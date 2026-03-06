
(function(){
  const q = k => new URL(location.href).searchParams.get(k);
  function saveTheme(t){ localStorage.setItem('theme', t); }
  function loadTheme(){ return localStorage.getItem('theme') || 'dark'; }
  function applyTheme(){
    const t = loadTheme();
    document.body.classList.toggle('theme-light', t==='light');
    document.body.classList.toggle('theme-dark', t==='dark');
    const btn=document.getElementById('themeToggle');
    if(btn) btn.textContent=(t==='dark')?'夜间':'日间';
  }
  const themeBtn = document.getElementById('themeToggle');
  if(themeBtn){ themeBtn.addEventListener('click',()=>{ const t=loadTheme()==='dark'?'light':'dark'; saveTheme(t); applyTheme(); }); }
  applyTheme();

  const fallbackCover = 'https://picsum.photos/seed/fallback/800/450';
  const fallbackShot  = 'https://picsum.photos/seed/fallback/1280/720';
  const fmtViews=n=>{n=Number(n)||0; return n>=10000 ? (Math.round(n/1000)/10)+'万' : ''+n};

  fetch('./games.json', {cache:'no-cache'})
    .then(r=>r.json())
    .then(d=>{
      const id = q('id');
      const g = (Array.isArray(d)?d:[]).find(x=>String(x.id)===String(id));
      if(!g){ document.body.innerHTML='<div style="padding:40px">未找到该游戏</div>'; return; }

      document.title = (g.title||'') + ' - 游戏详情';
      const hero = document.getElementById('hero');
      hero.src = g.cover || fallbackCover; hero.onerror=()=>{ hero.onerror=null; hero.src=fallbackCover; };

      document.getElementById('title').textContent    = g.title || '';
      document.getElementById('desc').textContent     = g.desc  || '';
      document.getElementById('size').textContent     = g.size  || '';
      document.getElementById('version').textContent  = g.version || '';
      document.getElementById('platform').textContent = g.platform || '';
      document.getElementById('date').textContent     = g.date || '';
      document.getElementById('views').textContent    = fmtViews(g.views||0);

      // 构建单张轮播
      const track = document.getElementById('track');
      const shots = Array.isArray(g.shots) ? g.shots : [];
      track.innerHTML = shots.map((u,i)=>`<img src="${u}" alt="截图${i+1}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackShot}'"/>`).join('');

      const viewport = track.parentElement; // .viewport
      const carousel = document.getElementById('carousel');

      // 拖拽/滑动切换：按住拖动，松开后对齐到最近一张
      let isDown=false, startX=0, startLeft=0, lastTime=0, lastX=0;
      const getIndex=()=> Math.round(track.scrollLeft / viewport.clientWidth);
      const clamp=(n,min,max)=> Math.max(min, Math.min(max, n));
      const toIndex=(idx)=> track.scrollTo({left: idx*viewport.clientWidth, behavior:'smooth'});

      // 鼠标
      track.addEventListener('mousedown', (e)=>{ isDown=true; carousel.classList.add('dragging'); startX=e.pageX; startLeft=track.scrollLeft; lastTime=Date.now(); lastX=e.pageX; });
      window.addEventListener('mouseup', ()=>{ if(!isDown) return; isDown=false; carousel.classList.remove('dragging'); const dt=Math.max(1,Date.now()-lastTime); const v=(lastX-startX)/dt; // 惯性方向
        let idx = getIndex(); if(Math.abs(v)>0.5){ idx += (v<0?1:-1); } idx=clamp(idx,0,Math.max(0,shots.length-1)); toIndex(idx); });
      track.addEventListener('mousemove', (e)=>{ if(!isDown) return; e.preventDefault(); const dx=e.pageX-startX; track.scrollLeft = startLeft - dx; lastX=e.pageX; lastTime=Date.now(); });

      // 触摸
      let tStartX=0, tStartLeft=0, tLastX=0, tLastTime=0;
      track.addEventListener('touchstart',(e)=>{ const t=e.touches[0]; isDown=true; carousel.classList.add('dragging'); tStartX=t.clientX; tStartLeft=track.scrollLeft; tLastX=t.clientX; tLastTime=Date.now(); }, {passive:true});
      track.addEventListener('touchmove',(e)=>{ const t=e.touches[0]; track.scrollLeft = tStartLeft - (t.clientX - tStartX); tLastX=t.clientX; tLastTime=Date.now(); }, {passive:true});
      track.addEventListener('touchend',()=>{ if(!isDown) return; isDown=false; carousel.classList.remove('dragging'); const dt=Math.max(1,Date.now()-tLastTime); const v=(tLastX-tStartX)/dt; let idx=getIndex(); if(Math.abs(v)>0.5){ idx += (v<0?1:-1); } idx=clamp(idx,0,Math.max(0,shots.length-1)); toIndex(idx); }, {passive:true});

      // 滚轮上下 -> 左右
      track.addEventListener('wheel',(e)=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ e.preventDefault(); track.scrollLeft += e.deltaY; } }, {passive:false});

      // 窗口尺寸变化时对齐当前图
      window.addEventListener('resize', ()=>{ toIndex(getIndex()); });
    })
    .catch(_=>{ document.body.innerHTML='<div style="padding:40px">数据加载失败</div>'; });
})();
