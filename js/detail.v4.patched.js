
(function(){
  const $=(s,r=document)=>r.querySelector(s);
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


  function setChips(el, item){ const chips=[]; if(item.platform) chips.push(['平台', item.platform]); if(item.size) chips.push(['大小', item.size]); if(item.status) chips.push(['状态', item.status]); const cat=Array.isArray(item.category)? item.category.join('、'):(item.category||''); if(cat) chips.push(['分类', cat]); if(item.tags&&item.tags.length) chips.push(['标签', item.tags.slice(0,6).join('、')]); el.innerHTML = chips.map(([key,val])=>`<span class="chip">${key}：${val}</span>`).join(''); }
  function setActions(el, item){ const links=[]; const c=[item.url]; (item.links||[]).forEach(x=>{ if(x&&x.href) links.push(x); }); c.forEach(u=>{ if(u) links.push({href:u,text:'下载/前往'}); }); el.innerHTML = links.map(l=>`<a class="btn" target="_blank" rel="noopener" href="${l.href}">${l.text||'前往'}</a>`).join(' '); }
  function renderShots(el, item){ const arr=item.shots||[]; el.innerHTML = arr.map(s=>`<img src="${s}" alt="截图" loading="lazy"/>`).join(''); }
  function notice(msg){ const e=$('#d-error'); if(!e) return; e.hidden=false; e.textContent=msg; e.style.borderColor='#fda4af'; e.style.background='#fff1f2'; }
  function getParam(name){ return new URL(location.href).searchParams.get(name); }

  async function main(){ const id=getParam('id'); if(!id) return notice('缺少参数 id'); try{ const {data:raw, url} = await loadFlexible(); const listRaw=pickList(raw); const list=listRaw.map((x,i)=>normItem(x,i)); const item=list.find(g=>String(g.id)===id); window.DEBUG=Object.assign(window.DEBUG||{}, {v4detail:{fetchUrl:url, raw, listRaw, list, pickedId:id}}); if(!item) return notice('未找到条目：'+id); $('#d-cover').src=item.cover||''; $('#d-title').textContent=item.title; const sub=[]; if(item.platform) sub.push(item.platform); if(item.size) sub.push(item.size); if(item.release) sub.push(item.release); $('#d-sub').textContent=sub.join(' · '); setChips($('#d-chips'), item); setActions($('#d-actions'), item); $('#d-desc').textContent=item.desc||''; renderShots($('#d-shots'), item); $('#detail').hidden=false; }catch(e){ console.error(e); notice('加载失败：'+e.message); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
