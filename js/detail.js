
(function(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  const id = new URLSearchParams(location.search).get('id');
  if(!id){ document.getElementById('title').textContent='未提供 id'; return; }
  fetch('./games.json?v='+Date.now(), {cache:'no-store'})
    .then(r=>r.json())
    .then(list=>{
      const g = list.find(x=> String(x.id)===String(id));
      if(!g){ document.getElementById('title').textContent='未找到该游戏'; return; }
      document.title = (g.title||'游戏') + ' - 详情';
      document.getElementById('title').textContent = g.title || '';
      document.getElementById('meta').textContent = `${(g.platforms||g.platform||[]).toString().replace(/,/g,' / ')} · ${(g.tags||[]).join('、')}`;
      document.getElementById('summary').textContent = g.summary || '';
      const gallery = document.getElementById('gallery');
      const imgs = Array.isArray(g.images) && g.images.length>0 ? g.images : [g.cover].filter(Boolean);
      imgs.forEach((src,idx)=>{
        const img = document.createElement('img');
        img.loading='lazy'; img.alt=(g.title||'图片')+' #'+(idx+1);
        img.src = src || `https://picsum.photos/640/360?random=${g.id}-${idx}`;
        gallery.appendChild(img);
      });
    })
    .catch(e=>{ document.getElementById('title').textContent='加载失败'; console.error(e); });
})();
