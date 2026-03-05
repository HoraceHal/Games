# 游戏目录网站

一个深色风格的**游戏目录**静态站点：主页卡片网格 + 详情页多图画廊。

- 页面不含“购买”字样
- 页脚：`如需获取资源，请添加微信：lyz7595`
- 自适应布局，卡片悬停动效
- 12 个示例条目与详情页

## 本地预览

双击 `index.html` 即可。

## 发布到 GitHub Pages

1. 新建一个空仓库（例如 `game-catalog`）。
2. 上传/推送本项目所有文件（保持目录结构）。
3. 默认分支设为 **main**（Settings → Branches）。
4. 打开 **Settings → Pages**：
   - Source 选择 **GitHub Actions**（使用本仓库自带 workflow）。
5. 每次推送到 `main`，Actions 会自动部署。完成后在 **Pages** 页可见公开访问地址。

> 若你的仓库是项目页（`username.github.io/<repo>`），请确保站内链接使用**相对路径**（本项目已处理）。

## 自定义

- 修改站名：在 `index.html` 和 `game/game*.html` 中搜索 `GameHub 目录`。
- 替换微信号文案：全站搜索 `lyz7595`。
- 替换图片：把 `picsum.photos` 的图片地址换为你自己的链接或本地图片。
- 新增条目：复制一张首页 `<article class="card">...</article>`，并新增相应 `gameX.html`。
