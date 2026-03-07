
GitHub Pages 大陆访问图片延迟：前端加速补丁（v1）
========================================

为什么会“图片慢慢出”？
- 跨境链路 + 多图并发请求导致首屏等待更明显；开代理后变快通常是因为链路/出口不同。

本补丁做什么：
1) 强化 Service Worker：缓存 HTML(网络优先)、CSS/JS/JSON(SWR)、图片(缓存优先)。
2) 首屏图片优化：只保留前几张关键图立即加载，其它图片进入视口再加载，减少首屏并发。

如何安装（必须做）：
A) 把本包文件覆盖到仓库根目录：
   - service-worker.js（覆盖你现有的同名文件）
   - js/ghpages-perf-init.js（新增）
   - css/ghpages-perf.css（新增）

B) 在 index.html 与 detail.html 的 </head> 之前加入：
   <link rel="stylesheet" href="./css/ghpages-perf.css">

C) 在 index.html 与 detail.html 的 </body> 之前加入：
   <script defer src="./js/ghpages-perf-init.js"></script>

提示：
- 部署后请强制刷新（Ctrl+F5 / Cmd+Shift+R）。
- 如果之前装过旧的 Service Worker，可在浏览器 DevTools → Application → Service Workers → Unregister。

可选（更进一步）：
- 把封面/截图转成 WebP/AVIF（体积可再降 30%-70%），大幅改善大陆加载。
- 如后续愿意用自定义域 + CDN，可把图片迁移到 Cloudflare R2 公共桶 + 自定义域并开启缓存。
