
(function(){
  const $ = s=>document.querySelector(s);
  const grid = $('#grid'), empty = $('#empty'), q = $('#q'), sortSel = $('#sortSel');
  const chips = document.querySelectorAll('.chip');
  let DATA = [];
  let state = { q:'', filter:'all', sort:'default'};

  // Theme
  function saveTheme(t){ localStorage.setItem('theme', t); }
  function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
  function applyTheme(){ const t = loadTheme(); document.body.classList.toggle('theme-light', t==='light'); document.body.classList.toggle('theme-dark', t==='dark'); const btn = document.getElementById('themeToggle'); btn.textContent=(t==='dark')?'🌙 夜间':'☀️ 日间'; }
  document.getElementById('themeToggle').addEventListener('click', ()=>{ const t = loadTheme()==='dark'?'light':'dark'; saveTheme(t); applyTheme(); });
  applyTheme();

  // Utils
  const ESC = s => (s||'').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const fmtViews = n => { n = Number(n)||0; return n>=10000 ? (Math.round(n/1000)/10)+'万' : (''+n); };
  const isNew = d => { const t = new Date(); const dt = new Date(d||'1970-01-01'); return (t - dt) <= 1000*60*60*24*30; }; // 30天内
  const fallbackCover = 'https://picsum.photos/seed/fallback/800/450';
  const fallbackShot  = 'https://picsum.photos/seed/fallback/1280/720';

  // Debounce
  function debounce(fn, wait){ let timer; return function(...args){ clearTimeout(timer); timer=setTimeout(()=>fn.apply(this,args), wait); } }

  // Robust JSON loader (tolerate comments & trailing commas)
  async function loadData(){
    const res = await fetch('./games.json', {cache:'no-cache'});
    const txt = await res.text();
    try{ return JSON.parse(txt); } catch(e){
      // strip // and /* */ comments & trailing commas
      let s = txt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\n)\s*\/\/.*(?=\n)/g, '$1');
      s = s.replace(/,\s*(]|})/g, '$1');
      return JSON.parse(s);
    }
  }

  function render(list){
    if(!Array.isArray(list)) list=[];
    if(!list.length){ grid.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';

    grid.innerHTML = list.map(g=>{
      const corner = (g.tags||[]).includes('推荐') ? '<span class="badge-corner">荐</span>' : '';
      const newest = (g.tags||[]).includes('最新') || isNew(g.date) ? '<span class="badge-new">新</span>' : '';
      const cat = ESC(g.category || g.platform || '');
      const status = g.status ? `<span class="label" style="background:${ESC(g.statusColor||'#1f7a36')};border-color:${ESC(g.statusColor||'#1f7a36')};color:#fff">${ESC(g.status)}</span>` : '';
      const title = ESC(g.title||'');
      const date  = ESC(g.date||'');
      const views = fmtViews(g.views||0);
      const cover = ESC(g.cover||fallbackCover);
      return `
      <article class="card">
        <div class="thumb">
          <img src="${cover}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackCover}'"/>
          ${corner}${newest}
        </div>
        <div class="meta-top"><span class="dot"></span><span>${cat}</span></div>
        <div class="content">
          <div class="title-row">${status}<div class="title">${title}</div></div>
        </div>
        <div class="bottom">
          <div class="left"><span class="icon">📅</span><span>${date}</span></div>
          <div class="right"><span class="icon">👁</span><span>${views}</span></div>
        </div>
        <a href="detail.html?id=${encodeURIComponent(g.id)}" aria-label="查看 ${title} 详情" style="position:absolute;inset:0"></a>
      </article>`;
    }).join('');
  }

  function apply(){
    let list = DATA.slice().map((g,i)=>({g,i})); // for stable sort
    // search
    if(state.q){ const kw = state.q.trim().toLowerCase(); list = list.filter(({g}) => (g.title||'').toLowerCase().includes(kw)); }
    // filter
    if(state.filter==='推荐'){ list = list.filter(({g}) => (g.tags||[]).includes('推荐')); }
    else if(state.filter==='最新'){ state.sort='date'; }
    // sort
    if(state.sort==='date'){
      list.sort((a,b)=> (new Date(b.g.date||'1970-01-01')) - (new Date(a.g.date||'1970-01-01')) || (a.i-b.i));
    } else if(state.sort==='views'){
      list.sort((a,b)=> (Number(b.g.views)||0) - (Number(a.g.views)||0) || (a.i-b.i));
    } else {
      list.sort((a,b)=> a.i-b.i);
    }
    render(list.map(x=>x.g));
  }

  q.addEventListener('input', debounce(e=>{ state.q = e.target.value; apply(); }, 180));
  chips.forEach(c=> c.addEventListener('click', ()=>{ chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); state.filter = c.dataset.filter; if(state.filter!=='最新' && sortSel.value==='date') sortSel.value='default'; apply(); }));
  sortSel.addEventListener('change', ()=>{ state.sort = sortSel.value; apply(); });

  loadData().then(d=>{ DATA = Array.isArray(d)? d : []; apply(); })
    .catch(err=>{ console.error(err); grid.innerHTML=''; empty.style.display='block'; empty.textContent='数据加载失败'; });
})();
