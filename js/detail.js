(function(){
  const q=k=>new URL(location.href).searchParams.get(k);
  function saveTheme(t){ localStorage.setItem('theme', t); }
  function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
  function applyTheme(){ const t = loadTheme(); document.body.classList.toggle('theme-light', t==='light'); document.body.classList.toggle('theme-dark', t==='dark'); const btn=document.getElementById('themeToggle'); btn.textContent=(t==='dark')?'🌙 夜间':'☀️ 日间'; }
  document.getElementById('themeToggle').addEventListener('click', ()=>{ const t=loadTheme()==='dark'?'light':'dark'; saveTheme(t); applyTheme(); });
  applyTheme();

  const fallbackCover='https://picsum.photos/seed/fallback/800/450';
  const fallbackShot='https://picsum.photos/seed/fallback/1280/720';
  const fmtViews=n=>{n=Number(n)||0; return n>=10000 ? (Math.round(n/1000)/10)+'万' : ''+n};

  function getLocalViews(id){ return Number(localStorage.getItem('views:'+id)||0); }
  function addLocalView(id){ const v=getLocalViews(id)+1; localStorage.setItem('views:'+id, String(v)); }

  fetch('./games.json', {cache:'no-cache'})
    .then(r=>r.json())
    .then(d=>{
      const id=q('id');
      const g=(Array.isArray(d)?d:[]).find(x=>x.id===id);
      if(!g){ document.body.innerHTML='<div style="padding:40px">未找到该游戏</div>'; return; }
      // increment once per visit (session)
      const key='hit:'+id; if(!sessionStorage.getItem(key)){ addLocalView(id); sessionStorage.setItem(key,'1'); }

      document.title=g.title+' - 游戏详情';
      const hero=document.getElementById('hero'); hero.src=g.cover||fallbackCover; hero.onerror=()=>{hero.onerror=null; hero.src=fallbackCover;};
      document.getElementById('title').textContent=g.title||'';
      document.getElementById('desc').textContent=g.desc||'';
      document.getElementById('size').textContent=g.size||'';
      document.getElementById('version').textContent=g.version||'';
      document.getElementById('platform').textContent=g.platform||'';
      document.getElementById('date').textContent=g.date||'';
      document.getElementById('views').textContent=fmtViews((Number(g.views)||0)+getLocalViews(id));
      const gal=document.getElementById('gallery');
      gal.innerHTML=(g.shots||[]).map((u,i)=>`<img src="${u}" alt="${g.title} 截图${i+1}" style="width:100%;height:160px;object-fit:cover;border-radius:10px" loading="lazy" onerror="this.onerror=null;this.src='${fallbackShot}'"/>`).join('');
    })
    .catch(_=>{ document.body.innerHTML='<div style="padding:40px">数据加载失败</div>'; });
})();