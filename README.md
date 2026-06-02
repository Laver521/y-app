# Y - 社交网络

类似 X (Twitter) 的中文社交网络。紫色主题，支持后端 API + 图片上传。

## 快速启动

双击 `start.bat`，然后打开 http://localhost:3000

## 使用方式

### 方式一：完整版（有后端）
启动后端服务器 → 浏览器打开 http://localhost:3000
登录方式：邮箱注册/登录，数据持久化，支持图片上传

### 方式二：单文件版（无需服务器）
双击 `Y-all-in-one.html`
点击"先随便看看"，所有功能用内置模拟数据运行

### 方式三：纯前端版
`node server.js` → 浏览器打开 http://localhost:3456

## 部署到 GitHub Pages

打开 https://github.com/Laver521
创建仓库 `y-app` → 上传 Y 文件夹所有文件
Settings → Pages → 选 main → 完成

## API 接口

后端运行后提供 REST API：
POST /api/auth/register    注册
POST /api/auth/login       登录
GET  /api/posts            帖子列表
POST /api/posts            发帖
POST /api/posts/:id/like   点赞
POST /api/posts/:id/comments  评论
GET  /api/posts/search?q=  搜索
GET  /api/users/:id        用户资料