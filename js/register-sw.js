
(function(){
  if(!('serviceWorker' in navigator)) return;
  // 允许你在需要时再启用 SW。默认建议先禁用，确认站点稳定后再打开 index.html 中的引用。
  navigator.serviceWorker.register('./service-worker.js').then(()=>{
    console.log('SW registered');
  }).catch(err=>{
    console.warn('SW register failed', err);
  });
})();
