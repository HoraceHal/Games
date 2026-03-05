
(function(){
  const $ = s=>document.querySelector(s);
  const grid = $('#grid');
  const empty = $('#empty');
  const q = $('#q');
  const sortSel = $('#sortSel');
  const chips = document.querySelectorAll('.chip');
  let DATA = [];
  let state = { q:'', filter:'all', sort:'default'};

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

  function render(list){
    if(!list.length){ grid.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';
    grid.innerHTML = list.map(g=>{
      const corner = (g.tags||[]).includes('推荐') ? '<span class="badge-corner">荐</span>' : '';
      const status = g.status? `<span class="label">${g.status}</span>` : '';
      const cat = g.category || (g.platform||'');
      return `
      <article class="card">
        <div class="thumb">
          <img src="${g.cover}" alt="${g.title}" loading="lazy"/>
          ${corner}
        </div>
        <div class="meta-top"><span class="dot"></span><span>${cat}</span></div>
        <div class="content">
          ${status}
          <div class="title">${g.title}</div>
          <a class="btn" style="display:none" href="detail.html?id=${encodeURIComponent(g.id)}">查看详情</a>
        </div>
        <div class="bottom">
          <div class="left"><span class="icon">📅</span><span>${g.date||''}</span></div>
          <div class="right"><span class="icon">👁</span><span>${fmtViews(g.views||0)}</span></div>
        </div>
        <a href="detail.html?id=${encodeURIComponent(g.id)}" aria-label="查看 ${g.title} 详情" style="position:absolute;inset:0"></a>
      </article>`;
    }).join('');
  }

  function apply(){
    let list = DATA.slice();
    // search by title
    if(state.q){
      const kw = state.q.trim().toLowerCase();
      list = list.filter(g => (g.title||'').toLowerCase().includes(kw));
    }
    // filter chips
    if(state.filter==='推荐'){
      list = list.filter(g => (g.tags||[]).includes('推荐'));
    } else if(state.filter==='最新'){
      // show all but sort by date, we'll override sort below
      state.sort = 'date';
    }
    // sort
    if(state.sort==='date'){
      list.sort((a,b)=> new Date(b.date||'1970-01-01') - new Date(a.date||'1970-01-01'));
    } else if(state.sort==='views'){
      list.sort((a,b)=> (b.views||0)-(a.views||0));
    }
    render(list);
  }

  // events
  q.addEventListener('input', (e)=>{ state.q = e.target.value; apply(); });
  chips.forEach(c=> c.addEventListener('click', ()=>{
    chips.forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    state.filter = c.dataset.filter;
    if(state.filter!=='最新' && sortSel.value==='date') sortSel.value='default';
    apply();
  }));
  sortSel.addEventListener('change', ()=>{ state.sort = sortSel.value; apply(); });

  // load data
  fetch('./games.json').then(r=>r.json()).then(d=>{ DATA = d; apply(); })
    .catch(err=>{ console.error(err); grid.innerHTML=''; empty.style.display='block'; empty.textContent='数据加载失败'; });
})();
