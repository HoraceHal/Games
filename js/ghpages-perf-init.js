
// ghpages-perf-init.js
// 目标：减少首屏同时请求的图片数量，避免图片“慢慢出”
// 策略：
//  - 首屏前几张图保持原样（更快出图）
//  - 其余图片转换为 data-src + 占位图，进入视口再加载
//  - 给 img 加 decoding=async 和 loading=lazy
(function(){
  const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9" viewBox="0 0 16 9"><rect width="16" height="9" fill="#111"/></svg>');

  function inFirstScreens(el, screens){
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * screens;
  }

  function upgradeImages(){
    const imgs = Array.from(document.querySelectorAll('img'));
    if(!imgs.length) return;

    // 保护封面/首屏关键图：前 3 张或在 1.2 屏内的保持原 src
    let eagerCount = 0;
    imgs.forEach(img => {
      img.decoding = 'async';
      // 已经是 data-src 的不重复处理
      if (img.dataset && img.dataset.src) {
        img.loading = img.loading || 'lazy';
        img.classList.add('lazy-swap');
        return;
      }

      const keepEager = eagerCount < 3 || inFirstScreens(img, 1.2);
      if(keepEager){
        eagerCount++;
        img.fetchPriority = img.fetchPriority || 'high';
        return;
      }

      // 远离首屏：改为占位 + data-src
      const src = img.currentSrc || img.src;
      if(!src || src.startsWith('data:')) return;
      img.dataset.src = src;
      img.src = PLACEHOLDER;
      img.loading = 'lazy';
      img.classList.add('lazy-swap');
    });

    // 观察进入视口再加载
    if(!('IntersectionObserver' in window)){
      document.querySelectorAll('img.lazy-swap[data-src]').forEach(img=>{ img.src = img.dataset.src; img.classList.add('lazy-loaded'); });
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(!en.isIntersecting) return;
        const img = en.target;
        io.unobserve(img);
        const src = img.dataset.src;
        if(!src) return;
        const real = new Image();
        real.decoding = 'async';
        real.onload = () => {
          img.src = src;
          img.classList.add('lazy-loaded');
        };
        real.src = src;
      });
    }, { rootMargin: '300px' });

    document.querySelectorAll('img.lazy-swap[data-src]').forEach(img => io.observe(img));
  }

  // 注册/更新 SW（GitHub Pages 默认 HTTPS，允许 SW）
  function registerSW(){
    if(!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }

  document.addEventListener('DOMContentLoaded', () => {
    registerSW();
    upgradeImages();
  });
})();
