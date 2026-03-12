
(function(){
  function getCurrentDir(){
    const {origin, pathname} = window.location;
    const dir = pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '');
    return origin + dir;
  }

  async function loadJSON(name){
    const url = getCurrentDir() + name;
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json();
  }

  function render(list){
    const c = document.getElementById('content');
    c.innerHTML = list.map(g=>`<div class='card'><img src='${g.cover}'/><div>${g.title}</div></div>`).join('');
  }

  async function main(){
    const data = await loadJSON('games.json');
    const list = data.games || data;
    render(list);
  }

  main();
})();
