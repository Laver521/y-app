// === Y API Module ===
// Connects frontend to backend at localhost:3000

var API = 'http://localhost:3000/api';
var apiToken = localStorage.getItem('y_token');

// Helper: call backend API
async function api(method, path, body) {
  var opts = { method: method, headers: {} };
  if (body && body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (apiToken) opts.headers['Authorization'] = 'Bearer ' + apiToken;
  try {
    var res = await fetch(API + path, opts);
    if (!res.ok) {
      var err = await res.json();
      toast(err.error || '请求失败');
      return null;
    }
    return await res.json();
  } catch(e) {
    toast('网络错误，请确保后端已启动');
    return null;
  }
}

// Transform API post to frontend format
function toPost(p) {
  return {
    id: p.id, userId: p.user_id, text: p.content,
    images: p.image_url ? [p.image_url] : [],
    likes: p.likes_count || 0, reposts: 0,
    replies: p.comments_count || 0, bookmarks: 0,
    liked: p.liked_by_me > 0, reposted: false, bookmarked: false,
    createdAt: new Date(p.created_at),
    views: Math.floor(Math.random() * 5000), comments: []
  };
}

// Load posts from API
async function loadPosts() {
  var data = await api('GET', '/posts?limit=50');
  if (!data || !data.posts) return;
  for (var i = 0; i < data.posts.length; i++) {
    var p = data.posts[i];
    // Get comments for each post
    var detail = await api('GET', '/posts/' + p.id);
    var comments = (detail && detail.comments) ? detail.comments : [];
    var tp = toPost(p);
    tp.comments = comments.map(function(c) {
      return {
        id: c.id, postId: c.post_id, userId: c.user_id,
        text: c.content, likes: 0, liked: false,
        createdAt: new Date(c.created_at)
      };
    });
    tp.replies = tp.comments.length;
    // Find and replace in posts array
    var found = false;
    for (var j = 0; j < posts.length; j++) {
      if (String(posts[j].id) === String(p.id)) {
        posts[j] = tp; found = true; break;
      }
    }
    if (!found) posts.unshift(tp);
  }
  posts.sort(function(a,b){return b.createdAt - a.createdAt});
  renderFeed();
}

// Override createPost to use API
var _origCreatePost = createPost;
createPost = function(text) {
  var img = currentUploadedImage;
  var body = { content: text };
  if (img) body.imageUrl = img;
  api('POST', '/posts', body).then(function(data) {
    if (data) {
      var tp = toPost(data);
      posts.unshift(tp);
      renderFeed();
      toast('发布成功！');
      if (composerText) { composerText.value = ''; composerSubmit.classList.remove('active'); }
    }
  });
};

// Override toggleLike
var _origToggleLike = toggleLike;
toggleLike = function(id) {
  var p = posts.find(function(x){return String(x.id)===String(id)});
  if (!p) return;
  api('POST', '/posts/' + id + '/like').then(function(data) {
    if (data) { p.liked = data.liked; p.likes += data.liked ? 1 : -1; renderFeed(); }
  });
};

// Override submitReply
var _origSubmitReply = submitReply;
submitReply = function(postId) {
  var inp = document.getElementById('replyInput');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  api('POST', '/posts/' + postId + '/comments', { content: txt }).then(function(data) {
    if (data) {
      if (inp) inp.value = '';
      var btn = document.getElementById('replySubmit');
      if (btn) btn.classList.remove('active');
      // Reload post detail
      renderPostDetail(postId);
      toast('回复成功');
    }
  });
};

// Image upload
var currentUploadedImage = null;
var imageInput = document.getElementById('imageInput');
if (imageInput) {
  imageInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('image', file);
    toast('上传中...');
    api('POST', '/upload', fd).then(function(data) {
      if (data && data.url) {
        currentUploadedImage = data.url;
        toast('图片已添加');
      }
    });
  });
}

// Add image upload button handler to composer
(function() {
  var tools = document.querySelector('.composer-tools');
  if (tools) {
    var imgBtn = tools.querySelector('.composer-tool');
    if (imgBtn) {
      imgBtn.addEventListener('click', function() {
        if (imageInput) imageInput.click();
      });
    }
  }
})();

// Email login
function showEmailLogin() {
  var card = document.querySelector('.login-card');
  if (!card) return;
  var existing = document.getElementById('emailLoginArea');
  if (existing) { existing.style.display = 'block'; return; }
  var div = document.createElement('div');
  div.id = 'emailLoginArea';
  div.innerHTML = '<div class="login-divider" style="margin:16px 0">邮箱登录</div>'
    + '<input id="loginEmail" type="email" placeholder="邮箱" style="width:100%;padding:12px 16px;border-radius:9999px;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-size:15px;margin-bottom:8px;box-sizing:border-box" />'
    + '<input id="loginPassword" type="password" placeholder="密码" style="width:100%;padding:12px 16px;border-radius:9999px;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-size:15px;margin-bottom:12px;box-sizing:border-box" />'
    + '<button onclick="doEmailLogin()" style="width:100%;padding:12px;border-radius:9999px;background:var(--gradient);color:#fff;font-weight:700;font-size:15px;border:none;cursor:pointer;margin-bottom:8px">登录</button>'
    + '<button onclick="doEmailRegister()" style="width:100%;padding:12px;border-radius:9999px;background:transparent;color:var(--text-secondary);font-size:14px;border:1px solid var(--border-color);cursor:pointer">没有账号？注册</button>';
  card.appendChild(div);
}

async function doEmailLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pw = document.getElementById('loginPassword').value.trim();
  if (!email || !pw) { toast('请填写邮箱和密码'); return; }
  var data = await api('POST', '/auth/login', { username: email, password: pw });
  if (data && data.token) {
    apiToken = data.token;
    localStorage.setItem('y_token', data.token);
    localStorage.setItem('y_user', JSON.stringify(data.user));
    loginOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    toast('登录成功！');
    loadPosts();
  }
}

async function doEmailRegister() {
  var email = document.getElementById('loginEmail').value.trim();
  var pw = document.getElementById('loginPassword').value.trim();
  if (!email || !pw) { toast('请填写邮箱和密码'); return; }
  if (pw.length < 6) { toast('密码至少6位'); return; }
  var data = await api('POST', '/auth/register', { username: email, email: email, password: pw, displayName: email.split('@')[0] });
  if (data && data.token) {
    apiToken = data.token;
    localStorage.setItem('y_token', data.token);
    localStorage.setItem('y_user', JSON.stringify(data.user));
    loginOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    toast('注册成功！');
    loadPosts();
  }
}

// Override guestLogin to also load API data
var _origGuestLogin = guestLogin;
guestLogin = function() {
  isLoggedIn = true;
  localStorage.setItem('y_logged', 'true');
  loginOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  toast('欢迎来到 Y');
  loadPosts();
};

// Override WeChat login
var _origCompleteWechat = completeWechatLogin;
completeWechatLogin = function() {
  isLoggedIn = true;
  localStorage.setItem('y_logged', 'true');
  loginQr.style.display = 'none';
  loginOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  toast('登录成功！');
  loadPosts();
};

// Add email login button to login page
(function addEmailLoginBtn() {
  var phoneBtn = document.querySelector('.login-btn-phone');
  if (phoneBtn) {
    var btn = document.createElement('button');
    btn.className = 'login-btn login-btn-phone';
    btn.style.marginTop = '8px';
    btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg> 使用邮箱登录';
    btn.onclick = showEmailLogin;
    phoneBtn.parentNode.insertBefore(btn, phoneBtn.nextSibling);
  }
})();

// On page load, if token exists, try loading API data
(function checkToken() {
  if (apiToken && isLoggedIn) {
    setTimeout(loadPosts, 500);
  }
})();