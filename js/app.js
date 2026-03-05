async function load(){
  const res = await fetch('./games.json');
  const data = await res.json();
  const grid = document.getElementById('grid');
  grid.innerHTML = data.map(g=>`<article class="card">
      <div class="thumb">
        <img src="${g.cover}" alt="${g.title}" loading="lazy"/>
        <span class="badge">${g.platform}</span>
      </div>
      <div class="content">
        <div class="title">${g.title}</div>
        <a class="btn" href="detail.html?id=${encodeURIComponent(g.id)}" aria-label="查看 ${g.title} 详情">查看详情</a>
      </div>
    </article>`).join('');
}
load();
