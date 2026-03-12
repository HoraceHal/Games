
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  function getCurrentDir(){ const {origin, pathname}=window.location; const dir=pathname.endsWith('/')? pathname: pathname.replace(/[^/]*$/, ''); return origin+dir; }
  async function tryFetch(url){ const res=await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error('HTTP '+res.status+' '+url); return res.json(); }
  async function loadFlexible(){ const base=getCurrentDir(); const tries=[base+'games.json?ts='+Date.now(), './games.json?ts='+Date.now(), 'games.json?ts='+Date.now()]; let last=null; for(const u of tries){ try{ const j=await tryFetch(u); return {data:j, url:u}; }catch(e){ last=e; } } throw last||new Error('无法加载 games.json'); }

  
function normPath(p){
  if(!p) return '';
  p=String(p).trim();
  if(/^https?:\/\//i.test(p) || /^\//.test(p)) return p;
  if(p.startsWith('./')) return p;
  return './' + p.replace(/^\.\//,'');
}
function firstArrayDeep(obj, maxDepth){
  maxDepth = maxDepth||3; const seen=new Set();
  function dfs(o, d){
    if(!o || d>maxDepth || seen.has(o)) return null; seen.add(o);
    if(Array.isArray(o)) return o;
    if(typeof o!=='object') return null;
    for(const k of Object.keys(o)){
      const v=o[k];
      if(Array.isArray(v)){
        if(v.length===0) return v; if(typeof v[0]==='object') return v;
      }
    }
    for(const k of Object.keys(o)){
      const r=dfs(o[k], d+1); if(r) return r;
    }
    return null;
  }
  return dfs(obj,0);
}
function pickList(json){
  if(Array.isArray(json)) return json;
  if(json && typeof json==='object'){
    const keys=['games','list','items','data','Data'];
    for(const key of keys){
      const v=json[key];
      if(Array.isArray(v)) return v;
      if(v && typeof v==='object'){
        const inner=firstArrayDeep(v,3); if(inner) return inner;
      }
    }
    const any=firstArrayDeep(json,3); if(any) return any;
  }
  return [];
}
function normItem(x, idx){
  const id = x.id || x.slug || x.key || x.code || x.title || x.name || ('idx'+idx);
  const title = x.title || x.name || '[未命名]';
  const cover = normPath(x.cover || x.image || x.img || (x.covers && x.covers[0]));
  const shots = (x.shots || x.screenshots || x.images || []).map(normPath);
  const category = x.category || x.categories || x.type || x.types || undefined;
  const tags = x.tags || x.keywords || [];
  const desc = x.desc || x.description || '';
  const platform = x.platform || x.plat || '';
  const size = x.size || x.filesize || '';
  const status = x.status || '';
  const links = Array.isArray(x.links)? x.links : [];
  const url = x.url || x.link || x.download || x.dest || '';
  return { id:String(id), title, cover, shots, category, tags, desc, platform, size, status, links, url,
           release: x.release || x.date || x.updated || '', views: x.views||0 };
}


  function buildCategories(list){ const set=new Set(); list.forEach(g=>{ const c=g.category; if(Array.isArray(c)) c.forEach(v=>v&&set.add(String(v))); else if(c) set.add(String(c)); }); return ['__ALL__', ...Array.from(set).sort()]; }
  function createCard(item){ const tpl=document.getElementById('card-tpl'); const node=tpl.content.firstElementChild.cloneNode(true); node.querySelector('.cover').src=item.cover||''; node.querySelector('.cover').alt=item.title; node.querySelector('.title').textContent=item.title; const cp=node.querySelector('.chip-platform'); cp.textContent=item.platform||''; const cs=node.querySelector('.chip-size'); if(item.size){ cs.hidden=false; cs.textContent=item.size; } const st=node.querySelector('.chip-status'); if(item.status){ st.hidden=false; st.textContent=item.status; } node.addEventListener('click',()=>{ location.href='./detail.html?id='+encodeURIComponent(item.id); }); node.addEventListener('keypress',(e)=>{ if(e.key==='Enter') location.href='./detail.html?id='+encodeURIComponent(item.id); }); return node; }
  function renderList(list){ const grid=document.getElementById('grid'); grid.innerHTML=''; const frag=document.createDocumentFragment(); list.forEach(x=>frag.appendChild(createCard(x))); grid.appendChild(frag); }
  function filterList(list, kw, cat){ kw=(kw||'').toLowerCase(); return list.filter(g=>{ const inCat=(cat==='__ALL__') || (Array.isArray(g.category)? g.category.includes(cat): g.category===cat); if(!inCat) return false; if(!kw) return true; const bag=[g.title,g.desc,(g.tags||[]).join(','), (Array.isArray(g.category)? g.category.join(','):g.category||'')].join('
').toLowerCase(); return bag.includes(kw); }); }
  function debugBanner(text){ const n=document.getElementById('notice'); if(!n) return; n.hidden=false; n.textContent=text; n.style.borderColor='#fda4af'; n.style.background='#fff1f2'; }

  async function main(){ const search=document.getElementById('searchInput'); const catSel=document.getElementById('categorySelect'); try{ const {data:raw, url} = await loadFlexible(); const listRaw = pickList(raw); const list = listRaw.map((x,i)=>normItem(x,i)); window.DEBUG=Object.assign(window.DEBUG||{}, {v4:{fetchUrl:url, raw, listRaw, list}}); buildCategories(list).forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=(c==='__ALL__')?'全部分类':c; catSel.appendChild(o); }); if(list.length===0){ const topKeys = raw && typeof raw==='object' ? Object.keys(raw).slice(0,8).join(', ') : 'n/a'; debugBanner('解析 games.json 成功，但未找到条目。顶层键：'+topKeys+'。已在 console 输出 DEBUG.v4。请检查数据字段名，如 games/list/items 等。'); } renderList(list); const doFilter=()=>{ const kw=search.value.trim(); const cat=catSel.value; renderList(filterList(list,kw,cat)); }; search.addEventListener('input', ()=>{ clearTimeout(search.__t); search.__t=setTimeout(doFilter,180); }); catSel.addEventListener('change', doFilter); }catch(e){ console.error(e); debugBanner('加载失败：'+e.message+'（已尝试多种路径）'); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
