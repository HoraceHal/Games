
(function(){
  const q = (k)=> new URL(location.href).searchParams.get(k);
  function saveTheme(theme){ localStorage.setItem('theme', theme); }
  function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
  function applyTheme(){
    const t = loadTheme();
    document.body.classList.toggle('theme-light', t==='light');
    document.body.classList.toggle('theme-dark', t==='dark');
    const btn = document.getElementById('themeToggle');
    btn.textContent = (t==='dark') ? '🌙 夜间' : '☀️ 日间';
  }
  document.getElementById('themeToggle').addEventListener('click',()=>{
    const t = loadTheme()==='dark'?'light':'dark';
    saveTheme(t); applyTheme();
  });
  applyTheme();

  function fmtViews(n){ if(n>=10000) return (Math.round(n/1000)/10)+'万'; return n+''; }

  const id = q('id');
  fetch('./games.json').then(r=>r.json()).then(d=>{
    const g = d.find(x=>x.id===id);
    if(!g){ document.body.innerHTML='<div style="padding:40px">未找到该游戏</div>'; return; }
    document.title = g.title + ' - 游戏详情';
    document.getElementById('title').textContent = g.title;
    document.getElementById('hero').src = g.cover;
    document.getElementById('desc').textContent = g.desc||'';
    document.getElementById('size').textContent = g.size||'';
    document.getElementById('version').textContent = g.version||'';
    document.getElementById('platform').textContent = g.platform||'';
    document.getElementById('date').textContent = g.date||'';
    document.getElementById('views').textContent = fmtViews(g.views||0);
    const gal = document.getElementById('gallery');
    gal.innerHTML = (g.shots||[]).map((u,i)=>`<img src="${u}" alt="${g.title} 截图${i+1}" style="width:100%;height:160px;object-fit:cover;border-radius:10px" loading="lazy"/>`).join('');
  }).catch(err=>{ console.error(err); document.body.innerHTML='<div style="padding:40px">数据加载失败</div>'; });
})();
