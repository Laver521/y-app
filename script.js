// Y - Social Network JavaScript
// Utility
function timeAgo(d) { var n=new Date(),s=n-d,m=Math.floor(s/6e4);if(m<1)return '刚刚';if(m<60)return m+'分钟前';var h=Math.floor(m/60);if(h<24)return h+'小时前';var d2=Math.floor(h/24);if(d2<7)return d2+'天前';return d.toLocaleDateString('zh-CN',{month:'short',day:'numeric'}) }
function fmt(n) { if(n>=1e4)return (n/1e4).toFixed(1)+'万';if(n>=1e3)return (n/1e3).toFixed(1)+'千';return n }
function rid() { return 'y_'+Math.random().toString(36).substring(2,10) }
var colors = ['#1d9bf0','#ff6b9d','#00ba7c','#ffad1f','#f91880','#6a5acd','#2dc26d','#e0245e'];
function avColor(s) { var h=0;for(var i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);return colors[Math.abs(h)%colors.length] }

// Data
var me = { id:'me', name:'小明', handle:'xiaoming', verified:true };
var users = [
  { id:'u1', name:'陈一鸣', handle:'chenym', verified:true },
  { id:'u2', name:'李思然', handle:'lisiran', verified:true },
  { id:'u3', name:'王知行', handle:'wangzx', verified:true },
  { id:'u4', name:'赵小棠', handle:'zhaoxiaotang', verified:false },
  { id:'u5', name:'刘看山', handle:'liukanshan', verified:true },
  { id:'u6', name:'林沐阳', handle:'linmuyang', verified:false },
  { id:'u7', name:'周禹锡', handle:'zhouyuxi', verified:false },
  { id:'u8', name:'吴可欣', handle:'wukexin', verified:true },
];
var texts = [
  '今天天气真好，出门散步拍了几张照片',
  '刚看完一本很棒的书，推荐给所有做产品的朋友',
  '重构了个人项目的前端架构，开发体验提升不少',
  '周末去看了一个非常棒的展览，值得推荐',
  '今天面试了一个候选人，技术栈很全面',
  '写了一篇关于AI编程工具对比的文章',
  '在上海发现了一家藏在弄堂里的独立书店',
  '关于远程工作的几点思考，你们觉得呢？',
  '终于把桌面整理好了，一个好的环境很重要',
  '今天晨跑10公里，坚持就是胜利',
  '最近在研究LLM的RAG技术',
  '推荐一个macOS效率工具，用了就回不去了',
];
var posts = [];
for(var i=0;i<16;i++) {
  var u=users[i%users.length];
  posts.push({
    id:rid(), userId:u.id, text:texts[i%texts.length],
    images: (i%5===0) ? ['https://picsum.photos/seed/p'+i+'/600/400'] : [],
    likes:Math.floor(Math.random()*2000)+10, reposts:Math.floor(Math.random()*300)+5,
    replies:Math.floor(Math.random()*60)+2, bookmarks:Math.floor(Math.random()*80),
    liked:false, reposted:false, bookmarked:false,
    createdAt:new Date(Date.now()-Math.floor(Math.random()*72)*3600000),
    views:Math.floor(Math.random()*30000)+1000, comments:[]
  });
}
var trendData = [
  { cat:'科技', name:'#AIGC', cnt:'12.5万' },
  { cat:'体育', name:'NBA总决赛', cnt:'8.2万' },
  { cat:'娱乐', name:'新剧推荐', cnt:'6.7万' },
  { cat:'科技', name:'Vision Pro', cnt:'5.1万' },
  { cat:'社会', name:'可持续发展', cnt:'3.8万' },
];
var commentTexts = ['说得好！','学习了！','太棒了！','同意👍','能详细说说吗？','哈哈真实','完全赞同','有启发！','期待后续'];
posts.forEach(function(p){var c=[];for(var j=0;j<Math.floor(Math.random()*5)+2;j++){var cu=users[Math.floor(Math.random()*users.length)];c.push({id:rid(),userId:cu.id,text:commentTexts[Math.floor(Math.random()*commentTexts.length)],likes:Math.floor(Math.random()*30),createdAt:new Date(Date.now()-Math.floor(Math.random()*48)*3600000)})};p.comments=c});// State
var activeTab = 'forYou';
var following = new Set(['u2','u3','u5','u8']);
var currentView = 'home';
var detailPostId = null;
var isLoggedIn = localStorage.getItem('y_logged') === 'true';
var exploreQ = '';

// DOM refs
var $ = function(id){return document.getElementById(id)};
var feedEl = $('feed'), composerText = $('composerText'), composerSubmit = $('composerSubmit');
var trendsEl = $('trends'), followEl = $('followSuggestions'), footerEl = $('sidebarFooter');
var toastEl = $('toast'), detailOverlay = $('postDetailOverlay'), detailContent = $('postDetailContent');
var loginOverlay = $('loginOverlay'), loginQr = $('loginQrSection'), loginQrBox = $('loginQrBox');
var profileEl = $('profileContent'), msgsSidebar = $('messagesSidebar'), chatMsgs = $('chatMessages');
var chatInput = $('chatInput'), chatSend = $('chatSendBtn'), chatView = $('chatView'), chatEmpty = $('chatEmpty');
var chatHeaderName = $('chatHeaderName'), chatHeaderAvatar = $('chatHeaderAvatar');
var exploreSearch = $('exploreSearch'), exploreCats = $('exploreCategories'), exploreResults = $('exploreResults');
var views = { home:$('viewHome'), profile:$('viewProfile'), messages:$('viewMessages'), explore:$('viewExplore') };

// Toast
var tmr = null;
function toast(m) { toastEl.textContent=m; toastEl.classList.add('show'); clearTimeout(tmr); tmr=setTimeout(function(){toastEl.classList.remove('show')},2500) }

// View switching
function switchView(v) {
  currentView=v;
  Object.keys(views).forEach(function(k){views[k].classList.toggle('active',k===v)});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.toggle('active',n.dataset.page===v||(v==='home'&&n.dataset.page==='home'))});
  var t = document.querySelector('.feed-header-top h2');
  if(t) t.textContent = {home:'首页',profile:'个人资料',messages:'消息',explore:'探索'}[v]||'首页';
  if(v==='home') renderFeed();
  else if(v==='profile') renderProfile();
  else if(v==='messages') renderMessages();
  else if(v==='explore') renderExplore();
  if(v!=='home'&&composerText){composerText.value='';if(composerSubmit)composerSubmit.classList.remove('active')}
}

// Switch tab
function switchTab(t) { activeTab=t; document.querySelectorAll('.feed-tab').forEach(function(e){e.classList.toggle('active',e.dataset.tab===t)}); renderFeed() }

// Render functions
function renderPostHTML(p, showActs) {
  var u = users.find(function(u2){return u2.id===p.userId})||users[0];
  var c = avColor(u.handle);
  var t = timeAgo(p.createdAt);
  var imgs = p.images.length ? '<div class="post-images single">'+p.images.map(function(url){return '<img src="'+url+'" loading="lazy"/>'}).join('')+'</div>' : '';
  var vb = u.verified ? '<span class="post-verified"><svg viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25a3.606 3.606 0 00-1.336-.25c-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z"/></svg></span>' : '';
  var acts = '';
  if(showActs!==false) {
    var lp = p.liked ? 'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.73l-.503.3-.504-.3c-4.379-2.61-7.029-5.25-8.382-7.73-1.35-2.47-1.35-4.66 0-7.13 1.35-2.47 3.73-3.86 6.51-3.86 1.736 0 3.26.585 4.376 1.544 1.115-.959 2.64-1.544 4.376-1.544 2.78 0 5.16 1.39 6.51 3.86 1.35 2.47 1.35 4.66 0 7.13z' : 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z';
    acts = '<div class="post-actions">'
      +'<button class="post-action reply" onclick="event.stopPropagation();openPostDetail(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 0 0 0 0 0 0 4.49 0 0 0 0-.001 4.49-3.646 8.129-8.129 8.129h-3.595c-.177 0-.34.07-.466.194l-3.91 3.926c-.606.608-1.636.19-1.636-.456v-2.615c0-.276-.112-.527-.293-.725a7.968 7.968 0 01-1.986-5.07c-.083-3.15.6-5.778 2.535-7.78"/></svg></span><span class="action-count">'+fmt(p.replies)+'</span></button>'
      +'<button class="post-action repost '+(p.reposted?'reposted':'')+'" onclick="event.stopPropagation();toggleRepost(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg></span><span class="action-count">'+fmt(p.reposts)+'</span></button>'
      +'<button class="post-action like '+(p.liked?'liked':'')+'" onclick="event.stopPropagation();toggleLike(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24"><path d="'+lp+'"/></svg></span><span class="action-count">'+fmt(p.likes)+'</span></button>'
      +'<button class="post-action bookmark '+(p.bookmarked?'bookmarked':'')+'" onclick="event.stopPropagation();toggleBookmark(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg></span><span class="action-count">'+fmt(p.bookmarks)+'</span></button>'
      +'<button class="post-action share" onclick="event.stopPropagation();toast(\'已复制\')"><span class="action-icon"><svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59z"/></svg></span></button></div>';
  }
  return '<article class="post" data-id="'+p.id+'" onclick="openPostDetail(\''+p.id+'\')">'
    +'<div class="post-avatar">'+(u.avatar?'<img src="'+u.avatar+'"/>':'<div class="post-avatar-placeholder" style="background:'+c+'">'+u.name[0]+'</div>')+'</div>'
    +'<div class="post-content">'
    +'<div class="post-header"><span class="post-name">'+u.name+'</span>'+vb
    +'<span class="post-handle">@'+u.handle+'</span><span class="post-dot">·</span><span class="post-time">'+t+'</span></div>'
    +'<div class="post-text">'+p.text.replace(/\n/g,'<br>')+'</div>'
    +imgs+acts+'</div></article>';
}
function renderPost(p){return renderPostHTML(p,true)}

function renderFeed() {
  var filtered = posts.slice();
  if(activeTab==='following') filtered = posts.filter(function(p){return following.has(p.userId)});
  filtered.sort(function(a,b){return b.createdAt-a.createdAt});
  feedEl.innerHTML = filtered.map(renderPost).join('');
}

// Interactions
function toggleLike(id) { var p=posts.find(function(x){return x.id===id}); if(!p)return; p.liked=!p.liked; p.likes+=p.liked?1:-1; renderFeed(); if(detailPostId===id)renderPostDetail(id) }
function toggleRepost(id) { var p=posts.find(function(x){return x.id===id}); if(!p)return; p.reposted=!p.reposted; p.reposts+=p.reposted?1:-1; renderFeed(); if(detailPostId===id)renderPostDetail(id) }
function toggleBookmark(id) { var p=posts.find(function(x){return x.id===id}); if(!p)return; p.bookmarked=!p.bookmarked; p.bookmarks+=p.bookmarked?1:-1; toast(p.bookmarked?'已收藏':'已取消'); renderFeed(); if(detailPostId===id)renderPostDetail(id) }

function createPost(txt) {
  var np = { id:rid(), userId:'me', text:txt, images:[], likes:0, reposts:0, replies:0, bookmarks:0, liked:false, reposted:false, bookmarked:false, createdAt:new Date(), views:0, comments:[] };
  posts.unshift(np); renderFeed(); toast('发布成功！'); composerText.value=''; composerSubmit.classList.remove('active')
}// Post detail
function openPostDetail(id) {
  detailPostId=id; detailOverlay.classList.add('open'); document.body.style.overflow='hidden'; renderPostDetail(id)
}
function closePostDetail() {
  detailPostId=null; detailOverlay.classList.remove('open'); document.body.style.overflow=''
}
function renderPostDetail(id) {
  var p=posts.find(function(x){return x.id===id}); if(!p)return;
  var u=users.find(function(x2){return x2.id===p.userId})||users[0];
  var vb=u.verified?'<span class="post-verified"><svg viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25a3.606 3.606 0 00-1.336-.25c-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z"/></svg></span>':'';
  var imgs = p.images.length ? '<div class="post-images single">'+p.images.map(function(u){return '<img src="'+u+'"/>'}).join('')+'</div>' : '';
  var dt = p.createdAt.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  var lp = p.liked ? 'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.73l-.503.3-.504-.3c-4.379-2.61-7.029-5.25-8.382-7.73-1.35-2.47-1.35-4.66 0-7.13 1.35-2.47 3.73-3.86 6.51-3.86 1.736 0 3.26.585 4.376 1.544 1.115-.959 2.64-1.544 4.376-1.544 2.78 0 5.16 1.39 6.51 3.86 1.35 2.47 1.35 4.66 0 7.13z' : 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z';
  var cs = (p.comments||[]).map(function(c){
    var cu=users.find(function(x){return x.id===c.userId})||users[0];
    var cc=avColor(cu.handle);
    return '<div class="comment-item"><div class="comment-avatar" style="background:'+cc+'">'+cu.name[0]+'</div><div class="comment-content"><div class="comment-header"><span class="comment-name">'+cu.name+'</span><span class="comment-handle">@'+cu.handle+' · '+timeAgo(c.createdAt)+'</span></div><div class="comment-text">'+c.text+'</div></div></div>';
  }).join('');
  var pt = p.text.replace(/\n/g,'<br>');
  detailContent.innerHTML = ''
    +'<div class="post-detail-header"><button class="post-detail-back" onclick="closePostDetail()"><svg viewBox="0 0 24 24"><path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z"/></svg></button><span class="post-detail-title">帖子</span></div>'
    +'<div class="post-detail-body"><div class="post-header"><span class="post-name" style="font-size:17px">'+u.name+'</span>'+vb+'<span class="post-handle">@'+u.handle+'</span></div><div class="post-text" style="font-size:17px">'+pt+'</div>'+imgs+'</div>'
    +'<div class="post-detail-meta"><span>'+dt+'</span><span><strong>'+fmt(p.views)+'</strong> 次查看</span></div>'
    +'<div class="post-detail-actions">'
    +'<button class="post-action like '+(p.liked?'liked':'')+'" onclick="toggleLike(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24" style="width:20px;height:20px"><path d="'+lp+'"/></svg></span><span>'+fmt(p.likes)+'</span></button>'
    +'<button class="post-action repost '+(p.reposted?'reposted':'')+'" onclick="toggleRepost(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88z"/></svg></span><span>'+fmt(p.reposts)+'</span></button>'
    +'<button class="post-action bookmark '+(p.bookmarked?'bookmarked':'')+'" onclick="toggleBookmark(\''+p.id+'\')"><span class="action-icon"><svg viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg></span><span>'+fmt(p.bookmarks)+'</span></button>'
    +'<button class="post-action share" onclick="toast(\'已复制\')"><span class="action-icon"><svg viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59z"/></svg></span></button></div>'
    +'<div class="comment-composer"><div class="composer-avatar">小</div><div class="composer-input-area"><textarea class="composer-textarea" placeholder="回复 '+u.name+'" id="replyInput" rows="1"></textarea><div class="composer-actions"><button class="composer-submit" onclick="submitReply(\''+p.id+'\')">回复</button></div></div></div>'
    +'<div class="comments-section">'+(cs||'<div style="padding:24px;color:var(--text-secondary);text-align:center">暂无评论</div>')+'</div>';
}
function submitReply(id) {
  var inp=document.getElementById('replyInput');var txt=inp.value.trim();if(!txt)return;
  var p=posts.find(function(x){return x.id===id});if(!p)return;
  if(!p.comments)p.comments=[];p.comments.unshift({id:rid(),userId:'me',text:txt,likes:0,createdAt:new Date()});p.replies=p.comments.length;
  inp.value='';renderPostDetail(id);renderFeed();toast('回复成功')
}

// Profile
function renderProfile() {
  var c=avColor(me.handle),vb=me.verified?'<span class="post-verified"><svg viewBox="0 0 24 24"><path d="M22.5 12.5"/></svg></span>':'';
  var html = '<div class="profile-banner"></div><div class="profile-header">'
    +'<div class="profile-avatar-row"><div class="profile-avatar" style="background:'+c+'"><span>小</span></div>'
    +'<button class="profile-edit-btn" onclick="toast(\'编辑资料\')">编辑资料</button></div>'
    +'<div class="profile-name-row"><span class="profile-name">小明</span>'+vb+'</div>'
    +'<div class="profile-handle">@xiaoming</div>'
    +'<div class="profile-bio">设计 · 科技 · 生活</div>'
    +'<div class="profile-stats"><span class="profile-stat"><strong>128</strong> 正在关注</span><span class="profile-stat"><strong>342</strong> 关注者</span></div></div>'
    +'<div class="profile-tabs"><button class="profile-tab active">帖子</button></div>';
  profileEl.innerHTML=html;
  var myPosts=posts.filter(function(p){return p.userId==='me'});
  if(myPosts.length){myPosts.sort(function(a,b){return b.createdAt-a.createdAt});myPosts.forEach(function(p){profileEl.innerHTML+=renderPostHTML(p,true)})}
  else profileEl.innerHTML+='<div style="padding:48px;text-align:center;color:var(--text-secondary)">还没有发过帖子</div>';
}

// Messages
var conversations = [
  {id:'c1',userId:'u1',last:'好的明天见',time:'5分钟前',unread:2},
  {id:'c2',userId:'u3',last:'项目方案看过了',time:'1小时前',unread:0},
  {id:'c3',userId:'u5',last:'周末去看展吗？',time:'3小时前',unread:1},
];
var chatMsgsData = {c1:[{from:'them',text:'你好！明天几点开会？'},{from:'me',text:'下午两点'},{from:'them',text:'好的明天见'}],c2:[{from:'them',text:'方案看过了'},{from:'them',text:'整体不错'},{from:'me',text:'谢谢！'}],c3:[{from:'them',text:'周末有空吗？'},{from:'me',text:'有的'},{from:'them',text:'去看展吧？'}]};
var activeConv = null;

function renderMessages() {
  var h='';conversations.forEach(function(c){
    var u=users.find(function(x){return x.id===c.userId})||users[0];
    var col=avColor(u.handle);
    h+='<div class="conversation-item'+(activeConv===c.id?' active':'')+'" onclick="openConv(\''+c.id+'\')"><div class="conversation-avatar" style="background:'+col+'">'+u.name[0]+'</div><div class="conversation-info"><div class="conversation-top"><span class="conversation-name">'+u.name+'</span><span class="conversation-time">'+c.time+'</span></div><div class="conversation-preview">'+c.last+'</div></div>'+(c.unread?'<div class="conversation-unread">'+c.unread+'</div>':'')+'</div>';
  });msgsSidebar.innerHTML=h;
  if(activeConv)renderChat(activeConv);
  else {chatView.classList.remove('active');chatEmpty.style.display='flex'}
}
function openConv(id){activeConv=id;var c=conversations.find(function(x){return x.id===id});if(c)c.unread=0;renderMessages();renderChat(id)}
function renderChat(id){
  var c=conversations.find(function(x){return x.id===id});if(!c)return;
  var u=users.find(function(x){return x.id===c.userId})||users[0];
  chatEmpty.style.display='none';chatView.classList.add('active');
  chatHeaderName.textContent=u.name;chatHeaderAvatar.innerHTML='<span style="background:'+avColor(u.handle)+';width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff">'+u.name[0]+'</span>';
  var msgs=chatMsgsData[id]||[];chatMsgs.innerHTML=msgs.map(function(m){return '<div class="chat-bubble '+(m.from==='me'?'me':'them')+'">'+m.text+'</div>'}).join('');chatMsgs.scrollTop=chatMsgs.scrollHeight
}
function sendMsg(){var t=chatInput.value.trim();if(!t||!activeConv)return;if(!chatMsgsData[activeConv])chatMsgsData[activeConv]=[];chatMsgsData[activeConv].push({from:'me',text:t});var c=conversations.find(function(x){return x.id===activeConv});if(c){c.last=t;c.time='刚刚'}chatInput.value='';renderChat(activeConv);renderMessages()}

// Explore
function renderExplore(){
  var cats=['热门','科技','体育','娱乐','社会'];var h='';cats.forEach(function(c){h+='<button class="explore-cat" onclick="switchExplore(\''+c+'\')">'+c+'</button>'});exploreCats.innerHTML=h
}
function switchExplore(c){exploreQ='';exploreSearch.value='';exploreCats.querySelectorAll('.explore-cat').forEach(function(e){e.classList.toggle('active',e.textContent===c)});renderExploreResults()}
function renderExploreResults(){
  var q=exploreQ.toLowerCase();var r=posts.slice();if(q)r=r.filter(function(p){return p.text.toLowerCase().indexOf(q)!==-1});r.sort(function(a,b){return b.createdAt-a.createdAt});exploreResults.innerHTML=r.length?r.map(function(p){return renderPostHTML(p,true)}).join(''):'<div style="padding:48px;text-align:center;color:var(--text-secondary)">暂无内容</div>'
}
function doSearch(q){switchView('explore');exploreSearch.value=q;exploreQ=q;setTimeout(function(){renderExploreResults()},50)}// Sidebar
function renderTrends(){
  trendsEl.innerHTML=trendData.map(function(t){return '<div class="sidebar-card-item trend-item"><div><div class="trend-category">'+t.cat+'</div><div class="trend-name">'+t.name+'</div><div class="trend-count">'+t.cnt+' 条帖子</div></div></div>'}).join('')
}
function renderFollow(){
  var su=users.filter(function(u){return !following.has(u.id)&&u.id!=='me'}).slice(0,3);
  followEl.innerHTML=su.map(function(u){var c=avColor(u.handle);var f=following.has(u.id);return '<div class="sidebar-card-item follow-item"><div class="follow-avatar"><div class="follow-avatar-placeholder" style="background:'+c+'">'+u.name[0]+'</div></div><div class="follow-info"><div class="follow-name-line"><span class="follow-name">'+u.name+'</span></div><div class="follow-handle">@'+u.handle+'</div></div><button class="follow-btn '+(f?'following':'')+'" onclick="event.stopPropagation();toggleF(\''+u.id+'\',this)">'+(f?'正在关注':'关注')+'</button></div>'}).join('')
}
function renderFooter(){
  var links=['关于','帮助','条款','隐私','Cookie','广告','招聘','Y博客'];footerEl.innerHTML=links.map(function(l){return '<a href="#">'+l+'</a>'}).join(' ')
}
function toggleF(id,btn){
  if(following.has(id)){following.delete(id);toast('已取消关注')}
  else{following.add(id);toast('关注成功')}
  renderFollow();if(currentView==='home')renderFeed()
}

// Login
function checkLogin(){
  if(isLoggedIn){loginOverlay.classList.add('hidden');document.body.style.overflow=''}
  else{loginOverlay.classList.remove('hidden');document.body.style.overflow='hidden'}
  renderTrends();renderFollow();renderFooter();switchView('home')
}
function generateQr(){
  var s=16;var cells=[];for(var i=0;i<s*s;i++)cells.push(Math.random()>0.55?1:0);
  var f=function(ox,oy){for(var y=0;y<7;y++)for(var x=0;x<7;x++){var idx=(oy+y)*s+(ox+x);if(y===0||y===6||x===0||x===6)cells[idx]=1;else if(y>=2&&y<=4&&x>=2&&x<=4)cells[idx]=1;else cells[idx]=0}};
  f(0,0);f(s-7,0);f(0,s-7);for(var i=8;i<s-8;i++){cells[i*s+6]=i%2;cells[6*s+i]=i%2}
  var h='<div class="login-qr-inner" style="gap:1px">';for(var y=0;y<s;y++)for(var x=0;x<s;x++)h+='<div class="login-qr-dot '+(cells[y*s+x]?'black':'white')+'"></div>';h+='</div>';loginQrBox.innerHTML=h
}
function startWechatLogin(){loginQr.style.display='block';generateQr()}
function completeWechatLogin(){isLoggedIn=true;localStorage.setItem('y_logged','true');loginQr.style.display='none';loginOverlay.classList.add('hidden');document.body.style.overflow='';toast('登录成功！')}
function guestLogin(){isLoggedIn=true;localStorage.setItem('y_logged','true');loginOverlay.classList.add('hidden');document.body.style.overflow='';toast('欢迎来到 Y')}
function doLogout(){
  isLoggedIn=false;localStorage.removeItem('y_logged');document.body.style.overflow='hidden';
  var dd=document.getElementById('userDropdown');if(dd)dd.classList.remove('show');
  loginOverlay.classList.remove('hidden');toast('已退出登录')
}
function showUserMenu(e){
  e.stopPropagation();
  var dd=document.getElementById('userDropdown');
  if(!dd){
    dd=document.createElement('div');dd.id='userDropdown';dd.className='user-dropdown';
    dd.innerHTML='<div class="user-dropdown-item" onclick="switchView(\'profile\')">查看个人资料</div><div class="user-dropdown-item danger" onclick="doLogout()">退出登录</div>';
    document.querySelector('.sidebar-user').appendChild(dd);
    document.addEventListener('click',function(){var d=document.getElementById('userDropdown');if(d)d.classList.remove('show')})
  }
  dd.classList.toggle('show')
}// Events
composerText.addEventListener('input',function(){composerSubmit.classList.toggle('active',composerText.value.trim().length>0)});
composerSubmit.addEventListener('click',function(){var t=composerText.value.trim();if(t)createPost(t)});
document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.key==='Enter'){var t=composerText.value.trim();if(t)createPost(t)}});
chatInput.addEventListener('keydown',function(e){if(e.key==='Enter')sendMsg()});
chatSend.addEventListener('click',sendMsg);
document.addEventListener('keydown',function(e){if(e.key==='Escape')closePostDetail()});
if(exploreSearch)exploreSearch.addEventListener('keydown',function(e){if(e.key==='Enter'){exploreQ=exploreSearch.value;renderExploreResults()}});

// Check login state on load
checkLogin();
document.body.classList.add('has-mobile-nav');