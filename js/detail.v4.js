
(function(){
  const $ = (sel, root=document)=>root.querySelector(sel);
  function getCurrentDir(){ const {origin, pathname}=window.location; const dir=pathname.endsWith('/')? pathname: pathname.replace(/[^/]*$/, ''); return origin+dir; }
  function getParam(name){ const u=new URL(location.href); return u.searchParams.get(name); }
  async function loadJSON(name){ const url=getCurrentDir()+name; const res=await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error('HTTP '+res.status); return res.json(); }

  function updateMeta(nameOrProp, content, property=true){
    const sel = property? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
    let el = document.head.querySelector(sel); if(!el){ el=document.createElement('meta'); if(property) el.setAttribute('property', nameOrProp); else el.setAttribute('name', nameOrProp); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }

  function setChips(el, item){
    const chips=[]; if(item.platform) chips.push(['平台', item.platform]); if(item.size) chips.push(['大小', item.size]); if(item.status) chips.push(['状态', item.status]);
    if(item.category){ const c=Array.isArray(item.category)? item.category.join('、'): item.category; chips.push(['分类', c]); }
    if(item.tags && item.tags.length){ chips.push(['标签', item.tags.slice(0,6).join('、')]); }
    el.innerHTML = chips.map(([k,v])=>`<span class="chip">${k}：${v}</span>`).join('');
  }

  function setActions(el, item){
    const links=[]; const c=[item.url,item.link,item.download,item.dest]; c.forEach(u=>{ if(typeof u==='string' && u.trim()) links.push({href:u,text:'下载/前往'}) }); if(Array.isArray(item.links)) item.links.forEach(x=>{ if(x&&x.href) links.push(x); });
    el.innerHTML = links.map(l=>`<a class="btn" target="_blank" rel="noopener" href="${l.href}">${l.text||'前往'}</a>`).join(' ');
  }

  function renderShots(el, item){ const shots=item.shots||item.screenshots||[]; el.innerHTML = shots.map(s=>`<img src="${String(s).replace(/^\.\//,'./')}" alt="截图" loading="lazy"/>`).join(''); }

  function injectJSONLD(item){
    const data = {
      '@context':'https://schema.org',
      '@type':'VideoGame',
      'name': item.title || item.name || '',
      'operatingSystem': item.platform || '',
      'image': (item.cover||'').replace(/^\.\//,'./'),
      'description': item.desc || item.description || '',
      'applicationCategory': Array.isArray(item.category)? item.category.join(','): (item.category||'Game'),
      'datePublished': item.release || item.date || undefined
    };
    const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(data); document.head.appendChild(s);
  }

  async function main(){
    const id=getParam('id'); const detail=$('#detail'); const error=$('#d-error'); if(!id){ error.hidden=false; error.textContent='缺少参数 id'; return; }
    const data=await loadJSON('games.json'); const list=data.games||data; const item=list.find(g=> String(g.id||g.slug||g.title)===id);
    if(!item){ error.hidden=false; error.textContent='未找到该条目：'+id; return; }

    $('#d-cover').src=(item.cover||'').replace(/^\.\//,'./');
    $('#d-title').textContent=item.title||item.name||'[未命名]';
    const sub=[]; if(item.platform) sub.push(item.platform); if(item.size) sub.push(item.size); if(item.release||item.date) sub.push(item.release||item.date); $('#d-sub').textContent=sub.join(' · ');
    setChips($('#d-chips'), item); setActions($('#d-actions'), item);
    $('#d-desc').textContent=item.desc||item.description||''; renderShots($('#d-shots'), item);

    // 动态更新标题与 OG（前端仅对部分平台有效）
    document.title=(item.title||'详情')+' · Games';
    updateMeta('og:title', item.title||'游戏详情');
    updateMeta('og:description', (item.desc||item.description||'').slice(0,120));
    updateMeta('og:image', (item.cover||'').replace(/^\.\//,'./'));
    const canon=document.getElementById('linkCanonical'); if(canon) canon.href=location.origin+location.pathname+'?id='+encodeURIComponent(id);

    injectJSONLD(item);
    detail.hidden=false;
  }

  main().catch(err=>{ const e=$('#d-error'); e.hidden=false; e.textContent='加载失败：'+err.message; console.error(err); });
})();
