
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function getCurrentDir(){
    const {origin, pathname} = window.location;
    const dir = pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '');
    return origin + dir;
  }
  async function loadJSON(name){
    const url = getCurrentDir() + name; // 与 index.html 同目录
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status+' '+url);
    return res.json();
  }
  function textIncludes(haystack, needle){
    return (haystack||'').toLowerCase().includes((needle||'').toLowerCase());
  }
  function buildCategories(list){
    const set=new Set();
    list.forEach(g=>{ const c=g.category||g.categories; if(Array.isArray(c)) c.forEach(x=>x&&set.add(String(x))); else if(c) set.add(String(c)); });
    return ['__ALL__',...Array.from(set).sort()];
  }
  function createCard(item){
    const tpl=$('#card-tpl');
    const node=tpl.content.firstElementChild.cloneNode(true);
    const cover=node.querySelector('.cover');
    const title=node.querySelector('.title');
    const chipPlat=node.querySelector('.chip-platform');
    const chipSize=node.querySelector('.chip-size');
    const chipStatus=node.querySelector('.chip-status');
    const link='./detail.html?id='+encodeURIComponent(item.id||item.slug||item.title);
    cover.src=(item.cover||'').replace(/^\.\//,'./');
    cover.alt=item.title||item.name||'';
    title.textContent=item.title||item.name||'[未命名]';
    chipPlat.textContent=item.platform||item.plat||'';
    if(item.size){ chipSize.hidden=false; chipSize.textContent=item.size; }
    if(item.status){ chipStatus.hidden=false; chipStatus.textContent=item.status; chipStatus.style.borderColor=item.statusColor||'#e5e7eb'; }
    node.addEventListener('click',()=>location.href=link);
    node.addEventListener('keypress',(e)=>{ if(e.key==='Enter') location.href=link; });
    return node;
  }
  function renderList(list){
    const grid=$('#grid'); grid.innerHTML='';
    const frag=document.createDocumentFragment();
    list.forEach(item=>frag.appendChild(createCard(item)));
    grid.appendChild(frag);
  }
  function filterList(list, kw, cat){
    return list.filter(g=>{
      const inCat=(cat==='__ALL__') || (Array.isArray(g.category)? g.category.includes(cat): g.category===cat || (Array.isArray(g.categories)&&g.categories.includes(cat)));
      if(!inCat) return false; if(!kw) return true;
      const bag=[g.title,g.name,g.desc,g.description,(g.tags||[]).join(','),(g.category||'')].join('
');
      return textIncludes(bag, kw);
    });
  }
  function debounce(fn, wait){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }

  function pickToday(list){
    // 规则：优先 views 最大；否则取第一条
    const arr=Array.from(list);
    arr.sort((a,b)=> (b.views||0)-(a.views||0));
    return arr[0];
  }
  function renderToday(item){
    if(!item) return;
    const sec=$('#today'); const card=$('#todayCard'); const title=$('#todayTitle'); const desc=$('#todayDesc'); const link=$('#todayLink');
    title.textContent=item.title||item.name||'';
    desc.textContent=(item.desc||item.description||'').slice(0,120);
    link.href='./detail.html?id='+encodeURIComponent(item.id||item.slug||item.title);
    // 背景艺术：使用封面作为背景 blur
    const art=$('.today-art');
    const url=(item.cover||'').replace(/^\.\//,'./');
    art.style.backgroundImage=`url('${url}')`;
    art.style.backgroundSize='cover'; art.style.backgroundPosition='center';
    art.style.filter='blur(12px)'; art.style.opacity='.55';
    sec.hidden=false;
  }

  async function main(){
    const notice=$('#notice'); const search=$('#searchInput'); const catSel=$('#categorySelect');
    let data=await loadJSON('games.json'); let list=data.games||data;
    list=Array.from(list).sort((a,b)=> (b.views||0)-(a.views||0) || String(a.title||'').localeCompare(b.title||''));

    // Today 卡片
    renderToday(pickToday(list));

    // 分类
    buildCategories(list).forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=(c==='__ALL__')?'全部分类':c; catSel.appendChild(o); });

    // 初始渲染
    renderList(list);

    const doFilter=()=>{ const kw=search.value.trim(); const cat=catSel.value; const res=filterList(list, kw, cat); if(!res.length){ notice.hidden=false; notice.textContent='没有匹配的结果'; } else { notice.hidden=true; } renderList(res); };
    search.addEventListener('input', debounce(doFilter, 180));
    catSel.addEventListener('change', doFilter);
  }

  main().catch(err=>{ const n=$('#notice'); n.hidden=false; n.textContent='加载失败：'+err.message; console.error(err); });
})();
