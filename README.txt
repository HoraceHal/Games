
终极加速包（Cloudflare Pages/Workers 静态站）
=================================================
包含：
1) _headers：启用强缓存（静态资源 1 年）、HTML 实时更新、HSTS、Vary。
2) service-worker.js：HTML 网络优先、CSS/JS SWR、图片缓存优先，断网可用。
3) js/perf-init.js：LazyLoad + LQIP + 自动拼接 Cloudflare Image Resizing (cdn-cgi/image)。
4) css/lqip.css：LQIP 渐进清晰动画样式。

如何接入
--------
A. 把本包放在站点根目录（与 index.html 同级）后部署。
B. 在所有页面的 <head> 中引入：
   <link rel="stylesheet" href="/css/lqip.css">
   <script src="/js/perf-init.js" defer></script>

C. 把图片改成懒加载 + LQIP：
   <img class="lazy lqip" data-lqip="/images/foo_lqip.jpg" data-src="/images/foo.jpg" alt="...">
   （可不提供 data-lqip，仅 data-src 亦可）

说明
----
- perf-init.js 会根据容器宽度自动生成 /cdn-cgi/image/width=...,quality=70 的 URL，
  由 Cloudflare 在边缘动态压缩/裁剪，大幅减小图片体积。
- Service Worker 将对 HTML 采用网络优先（可离线回退），CSS/JS 采用 SWR，图片采用缓存优先。
- _headers 让静态资源命中浏览器/边缘缓存；HTML 始终最新。

可选：Cloudflare 仪表盘
----------------------
- Speed → Optimization：开启 Brotli、Auto Minify（HTML/CSS/JS）。
- Caching → Cache Rules：为非 HTML 资源设置 Cache Everything（若未使用 Pages 的 _headers 亦可）。
- Images：若开通 Cloudflare Images，可直接托管并自适应（本包已支持 cdn-cgi/image 方式）。
