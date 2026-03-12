
(function(){
  if(!('serviceWorker' in navigator)) return;
  try{
    navigator.serviceWorker.getRegistrations().then(list=>{
      if(!list.length) return;
      const once = localStorage.getItem('sw-unreg-once');
      if(once==='done') return;
      Promise.allSettled(list.map(r=>r.unregister())).then(()=>{ localStorage.setItem('sw-unreg-once','done'); location.reload(); });
    });
  }catch(e){ console.warn('sw-unregister failed', e); }
})();
