
(function(){
  if ('IntersectionObserver' in window) return;
  // 触发全量渲染（如果你的初始化函数名不同，请在此改为实际名称）
  if (typeof window.initCards === 'function') {
    try { window.initCards({forceAll: true}); } catch (e) { console.error('[initCards fallback]', e); }
  }
  // 懒加载图片兜底
  var lazyImgs = document.querySelectorAll('img[data-src]');
  for (var i = 0; i < lazyImgs.length; i++) {
    var el = lazyImgs[i];
    el.src = el.getAttribute('data-src');
    el.removeAttribute('data-src');
  }
})();
