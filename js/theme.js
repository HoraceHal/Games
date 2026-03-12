
(function(){
  const KEY='pref-theme';
  const root=document.documentElement;
  function applyTheme(val){
    if(val==='dark'||val==='light'){ root.setAttribute('data-theme', val); }
    else{ // auto
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefers? 'dark':'light');
      root.setAttribute('data-theme-mode','auto');
    }
  }
  function init(){
    const saved = localStorage.getItem(KEY) || 'auto';
    applyTheme(saved);
    const btn=document.getElementById('themeBtn');
    if(btn){
      btn.addEventListener('click',()=>{
        const cur = localStorage.getItem(KEY)||'auto';
        const next = cur==='light'? 'dark' : cur==='dark' ? 'auto' : 'light';
        localStorage.setItem(KEY, next);
        applyTheme(next);
        btn.title = '主题: '+next;
      });
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{
      if((localStorage.getItem(KEY)||'auto')==='auto') applyTheme('auto');
    });
    const link = document.getElementById('linkCanonical');
    if(link){ link.href = location.origin + location.pathname; }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
