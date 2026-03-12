(function(){
  const $ = s=>document.querySelector(s);
  const grid = $('#grid'), empty = $('#empty');
  const q = $('#q'), sortSel = $('#sortSel'), pageSizeSel = $('#pageSizeSel');
  const chips = document.querySelectorAll('.chip');
  const pager = $('#pager');
  const prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn');
  const pageNumbers = document.getElementById('pageNumbers');

  let DATA = [];
  let state = { q:'', filter:'all', sort:'default', page:1, pageSize: Number(localStorage.getItem('pageSize')||12) };
  if(pageSizeSel) pageSizeSel.value = String(state.pageSize);

  function saveTheme(t){ localStorage.setItem('theme', t); }
  function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
  function applyTheme(){ const t = loadTheme(); document.body.classList.toggle('theme-light', t==='light'); document.body.classList.toggle('theme-dark', t==='dark'); const btn=document.getElementById('themeToggle'); if(btn) btn.textContent=(t==='dark')?'🌙 夜间':'☀️ 日间'; }
  const themeBtn = document.getElementById('themeToggle'); if(themeBtn){ themeBtn.addEventListener('click',()=>{ const t=loadTheme()==='dark'?'light':'dark'; saveTheme(t); applyTheme(); }); }
  applyTheme();

  const ESC=s=>(s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const fmtViews=n=>{n=Number(n)||0; return n>=10000 ? (Math.round(n/1000)/10)+'万' : ''+n};
  const isNew=d=>{const t=new Date(); const dt=new Date(d||'1970-01-01'); return (t-dt)<=1000*60*60*24*30};

  function render(list){
    if(!list.length){ grid.innerHTML=''; empty.style.display='block'; pager.style.display='none'; return; }
    empty.style.display='none';

    const total=list.length; const ps=state.pageSize; const pages=Math.max(1, Math.ceil(total/ps));
    if(state.page>pages) state.page=pages; if(state.page<1) state.page=1;
    const start=(state.page-1)*ps; const end=Math.min(total, start+ps);
    const pageList=list.slice(start,end);

    grid.innerHTML = pageList.map(g=>{
      const corner=(g.tags||[]).includes('推荐')?'<span class="badge-corner">荐</span>':'';
      const newest=(g.tags||[]).includes('最新')||isNew(g.date)?'<span class="badge-new">新</span>':'';
      const cat=ESC(g.category||g.platform||'');
      const status=g.status?`<span class="label">${ESC(g.status)}</span>`:'';
      const title=ESC(g.title||'');
      const date=ESC(g.date||'');
      const viewsAll=Number(g.views)||0;
      const cover=ESC(g.cover||'');
      return `<article class="card">
        <div class="thumb"><img src="${cover}" alt="${title}" loading="lazy"/>${corner}${newest}</div>
        <div class="meta-top"><span class="dot"></span><span>${cat}</span></div>
        <div class="content"><div class="title-row">${status}<div class="title">${title}</div></div></div>
        <div class="bottom"><div class="left"><span class="icon">📅</span><span>${date}</span></div><div class="right"><span class="icon">👁</span><span>${fmtViews(viewsAll)}</span></div></div>
        <a href="detail.html?id=${encodeURIComponent(g.id)}" aria-label="查看 ${title} 详情" style="position:absolute;inset:0"></a>
      </article>`;
    }).join('');

    // 数字分页条
    pager.style.display='flex';
    pageNumbers.innerHTML='';
    for(let p=1;p<=pages;p++){
      const el=document.createElement('span');
      el.className='page-number'+(p===state.page?' active':'');
      el.textContent=String(p);
      el.addEventListener('click',()=>{ state.page=p; apply(); window.scrollTo({top:0,behavior:'smooth'}); });
      pageNumbers.appendChild(el);
    }
    prevBtn.disabled = (state.page<=1);
    nextBtn.disabled = (state.page>=pages);
    prevBtn.onclick = ()=>{ if(state.page>1){ state.page--; apply(); window.scrollTo({top:0,behavior:'smooth'}); } };
    nextBtn.onclick = ()=>{ if(state.page<pages){ state.page++; apply(); window.scrollTo({top:0,behavior:'smooth'}); } };
  }

  function apply(){
    let list = DATA.slice().map((g,i)=>({g,i}));
    if(state.q){ const kw=state.q.trim().toLowerCase(); list=list.filter(({g}) => (g.title||'').toLowerCase().includes(kw)); }
    if(state.filter==='推荐'){ list=list.filter(({g}) => (g.tags||[]).includes('推荐')); }
    else if(state.filter==='最新'){ state.sort='date'; if(sortSel) sortSel.value='date'; }
    if(state.sort==='date'){ list.sort((a,b)=> new Date(b.g.date||'1970-01-01') - new Date(a.g.date||'1970-01-01') || (a.i-b.i)); }
    else if(state.sort==='views'){ list.sort((a,b)=> (Number(b.g.views)||0) - (Number(a.g.views)||0) || (a.i-b.i)); }
    else { list.sort((a,b)=> a.i-b.i); }
    render(list.map(x=>x.g));
  }

  if(q) q.addEventListener('input', e=>{ state.q=e.target.value; state.page=1; apply(); });
  chips.forEach(c=> c.addEventListener('click', ()=>{ chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); state.filter=c.dataset.filter; if(state.filter!=='最新'&& sortSel && sortSel.value==='date') sortSel.value='default'; state.page=1; apply(); }));
  if(sortSel) sortSel.addEventListener('change', ()=>{ state.sort=sortSel.value; state.page=1; apply(); });
  if(pageSizeSel) pageSizeSel.addEventListener('change', ()=>{ state.pageSize=Number(pageSizeSel.value)||12; localStorage.setItem('pageSize', String(state.pageSize)); state.page=1; apply(); });

  fetch('./games.json',{cache:'no-cache'})
    .then(r=>r.json())
    .then(d=>{ DATA=Array.isArray(d)?d:[]; apply(); })
    .catch(_=>{ grid.innerHTML=''; empty.style.display='block'; empty.textContent='数据加载失败'; });
})();