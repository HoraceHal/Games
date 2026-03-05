(function(){
  const $ = s=>document.querySelector(s);
  const grid=$('#grid'), empty=$('#empty'), q=$('#q'), sortSel=$('#sortSel');
  const pageSizeSel = $('#pageSizeSel');
  const chips=document.querySelectorAll('.chip');
  const pager = $('#pager');
  const pageInfo = $('#pageInfo');
  const totalInfo = $('#totalInfo');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const skeleton = $('#skeleton');

  let DATA=[]; // raw
  let state={ q:'', filter:'all', sort:'default', page:1, pageSize: Number(localStorage.getItem('pageSize')||12) };
  pageSizeSel.value = String(state.pageSize);

  // theme
  function saveTheme(t){ localStorage.setItem('theme', t); }
  function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
  function applyTheme(){ const t = loadTheme(); document.body.classList.toggle('theme-light', t==='light'); document.body.classList.toggle('theme-dark', t==='dark'); const btn=document.getElementById('themeToggle'); btn.textContent=(t==='dark')?'🌙 夜间':'☀️ 日间'; }
  document.getElementById('themeToggle').addEventListener('click', ()=>{ const t = loadTheme()==='dark'?'light':'dark'; saveTheme(t); applyTheme(); });
  applyTheme();

  // helpers
  const ESC=s=>(s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;"}[c]));
  const fmtViews=n=>{n=Number(n)||0; return n>=10000 ? (Math.round(n/1000)/10)+'万' : ''+n};
  const isNew=d=>{const t=new Date(); const dt=new Date(d||'1970-01-01'); return (t-dt)<=1000*60*60*24*30};
  const fallbackCover='https://picsum.photos/seed/fallback/800/450';

  function getLocalViews(id){ return Number(localStorage.getItem('views:'+id)||0); }
  function addLocalView(id){ const v=getLocalViews(id)+1; localStorage.setItem('views:'+id, String(v)); }

  // skeleton
  function showSkeleton(n=9){
    let html='';
    for(let i=0;i<n;i++){
      html += `<div class="skeleton-card"><div class="shimmer skel-thumb"></div><div class="shimmer skel-line w80"></div><div class="shimmer skel-line w60"></div><div class="shimmer skel-line w40"></div></div>`;
    }
    skeleton.innerHTML=html; skeleton.style.display='grid'; grid.style.display='none'; empty.style.display='none'; pager.style.display='none';
  }
  function hideSkeleton(){ skeleton.style.display='none'; grid.style.display='grid'; }

  // robust loader
  async function loadData(){
    const res = await fetch('./games.json', {cache:'no-cache'}); const txt = await res.text();
    try{ return JSON.parse(txt); } catch(e){ let s=txt.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|
)\s*\/\/.*(?=
)/g,'$1'); s=s.replace(/,\s*(]|})/g,'$1'); return JSON.parse(s); }
  }

  function render(list){
    if(!list.length){ grid.innerHTML=''; empty.style.display='block'; pager.style.display='none'; return; }
    empty.style.display='none';
    // paging
    const total=list.length; const ps=state.pageSize; const pages=Math.max(1, Math.ceil(total/ps));
    if(state.page>pages) state.page=pages; if(state.page<1) state.page=1;
    const start=(state.page-1)*ps; const end=Math.min(total, start+ps);
    const pageList=list.slice(start,end);

    // render page
    grid.innerHTML = pageList.map(g=>{
      const corner=(g.tags||[]).includes('推荐')?'<span class="badge-corner">荐</span>':'';
      const newest=(g.tags||[]).includes('最新')||isNew(g.date)?'<span class="badge-new">新</span>':'';
      const cat=ESC(g.category||g.platform||'');
      const status=g.status?`<span class="label" style="background:${ESC(g.statusColor||'#1f7a36')};border-color:${ESC(g.statusColor||'#1f7a36')};color:#fff">${ESC(g.status)}</span>`:'';
      const title=ESC(g.title||''); const date=ESC(g.date||'');
      const viewsAll = (Number(g.views)||0) + getLocalViews(g.id);
      const cover=ESC(g.cover||fallbackCover);
      return `<article class="card"><div class="thumb"><img src="${cover}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackCover}'"/>${corner}${newest}</div><div class="meta-top"><span class="dot"></span><span>${cat}</span></div><div class="content"><div class="title-row">${status}<div class="title">${title}</div></div></div><div class="bottom"><div class="left"><span class="icon">📅</span><span>${date}</span></div><div class="right"><span class="icon">👁</span><span>${fmtViews(viewsAll)}</span></div></div><a data-id="${ESC(g.id)}" href="detail.html?id=${encodeURIComponent(g.id)}" style="position:absolute;inset:0" aria-label="查看 ${title} 详情"></a></article>`;
    }).join('');

    // pager ui
    pager.style.display='flex';
    totalInfo.textContent = `共 ${total} 条`;
    pageInfo.textContent = `第 ${state.page} / ${pages} 页`;
    prevBtn.disabled = (state.page<=1);
    nextBtn.disabled = (state.page>=pages);
  }

  function apply(){
    let list = DATA.slice().map((g,i)=>({g,i})); // stable sort support
    // search
    if(state.q){ const kw=state.q.trim().toLowerCase(); list=list.filter(({g}) => (g.title||'').toLowerCase().includes(kw)); }
    // filter
    if(state.filter==='推荐'){ list = list.filter(({g}) => (g.tags||[]).includes('推荐')); }
    else if(state.filter==='最新'){ state.sort='date'; }
    // sort
    if(state.sort==='date') list.sort((a,b)=> new Date(b.g.date||'1970-01-01') - new Date(a.g.date||'1970-01-01') || (a.i-b.i));
    else if(state.sort==='views') list.sort((a,b)=> ((Number(b.g.views)||0)+(Number(localStorage.getItem('views:'+b.g.id))||0)) - ((Number(a.g.views)||0)+(Number(localStorage.getItem('views:'+a.g.id))||0)) || (a.i-b.i));
    else list.sort((a,b)=> a.i-b.i);

    hideSkeleton();
    render(list.map(x=>x.g));
  }

  // events
  q.addEventListener('input', (e)=>{ state.q=e.target.value; state.page=1; apply(); });
  chips.forEach(c=> c.addEventListener('click', ()=>{ chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); state.filter=c.dataset.filter; if(state.filter!=='最新'&& sortSel.value==='date') sortSel.value='default'; state.page=1; apply(); }));
  sortSel.addEventListener('change', ()=>{ state.sort=sortSel.value; state.page=1; apply(); });
  pageSizeSel.addEventListener('change', ()=>{ state.pageSize=Number(pageSizeSel.value)||12; localStorage.setItem('pageSize', String(state.pageSize)); state.page=1; apply(); });
  prevBtn.addEventListener('click', ()=>{ state.page-=1; apply(); });
  nextBtn.addEventListener('click', ()=>{ state.page+=1; apply(); });

  // delegate click to add local view before navigation
  grid.addEventListener('click', (e)=>{ const a = e.target.closest('a[data-id]'); if(!a) return; const id=a.getAttribute('data-id'); try{ addLocalView(id);}catch(_){} });

  // init
  showSkeleton(9);
  loadData().then(d=>{ DATA = Array.isArray(d)?d:[]; apply(); }).catch(err=>{ console.error(err); skeleton.style.display='none'; empty.style.display='block'; empty.textContent='数据加载失败'; });
})();