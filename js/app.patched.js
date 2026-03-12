
(function(){
  const $ = s=>document.querySelector(s);
  const cardsEl = $('#cards') || (function(){ const s=document.createElement('section'); s.id='cards'; document.body.appendChild(s); return s; })();
  const emptyEl = $('#emptyState') || (function(){ const d=document.createElement('div'); d.id='emptyState'; d.hidden=true; d.textContent='没有可显示的游戏'; document.body.appendChild(d); return d; })();
  const pageSizeSel = $('#pageSize');
  const PAGE_SIZE = (pageSizeSel && parseInt(pageSizeSel.value,10)) || 24;
  const setYear = ()=>{ const y=document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); };
  setYear();

  const url = './games.json?v=' + Date.now(); // 加时间戳，避免 SW 或浏览器旧缓存
  fetch(url, {cache:'no-store'})
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(list=>{
      if (!Array.isArray(list) || list.length===0){ emptyEl.hidden=false; cardsEl.innerHTML=''; return; }
      // 只做最基础的渲染，确保显示
      const page = 1;
      const start = (page-1)*PAGE_SIZE, end = start + PAGE_SIZE;
      const arr = list.slice(start,end);
      cardsEl.innerHTML = arr.map(g=>`
        <a class="card" href="./detail.html?id=${encodeURIComponent(g.id)}">
          <img src="${(g.cover||'').trim()||`https://picsum.photos/seed/${g.id||Math.random()}/640/360`}" alt="${g.title||''}" loading="lazy" />
          <div class="body">
            <h3 title="${g.title||''}">${g.title||'未命名游戏'}</h3>
            <div class="meta">
              <span>${(g.platforms||g.platform||[]).toString().replace(/,/g,' / ')||'平台未知'}</span>
              <span>•</span>
              <span>${(g.tags||[]).slice(0,3).join('、')||'无标签'}</span>
            </div>
            <p class="summary">${g.summary||''}</p>
            <div class="actions">
              <span class="price">${g.price||''}</span>
            </div>
          </div>
        </a>
      `).join('');
      emptyEl.hidden = arr.length>0;
    })
    .catch(err=>{
      console.error('[games] 加载失败：', err);
      emptyEl.hidden=false; emptyEl.textContent='加载 games.json 失败，请检查路径或 JSON 格式';
    });
})();
