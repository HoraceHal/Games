function q(k){return new URL(location.href).searchParams.get(k)}
async function load(){
  const id = q('id');
  const res = await fetch('./games.json');
  const data = await res.json();
  const g = data.find(x=>x.id===id);
  if(!g){ document.body.innerHTML='<div style="padding:40px;color:#fff">未找到该游戏。</div>'; return; }
  document.title = g.title + ' - 游戏详情';
  document.getElementById('hero').src = g.cover;
  document.getElementById('title').innerHTML = `${g.title} <span class="tag">${g.platform}</span>`;
  document.getElementById('desc').textContent = g.desc;
  document.getElementById('size').textContent = g.size;
  document.getElementById('version').textContent = g.version;
  document.getElementById('platform').textContent = g.platform;
  document.getElementById('date').textContent = g.date;
  const gal = document.getElementById('gallery');
  gal.innerHTML = (g.shots||[]).map((u,i)=>`<img src="${u}" alt="${g.title} 截图${i+1}" loading="lazy"/>`).join('');
}
load();
