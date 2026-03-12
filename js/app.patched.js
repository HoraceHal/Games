
(function(){
  function getCurrentDir(){
    const {origin, pathname} = window.location;
    const dir = pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '');
    return origin + dir;
  }

  async function loadJSON(name){
    const url = getCurrentDir() + name; // 指向与 index.html 同目录
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status+' for '+url);
    return res.json();
  }

  function renderListHTML(list){
    if(!Array.isArray(list)) return '<div>数据格式不是数组</div>';
    return '<ul style="list-style:none;padding:0;">' + list.map(item=>{
      const title = item.title || item.name || '[未命名]';
      const cover = (item.cover || '').replace(/^\.\//,'./');
      const img = cover ? '<img src="'+cover+'" alt="'+title+'" style="width:200px;height:auto;border-radius:8px">' : '';
      const desc = item.desc || item.descp || '';
      return '<li style="margin:12px 0;border:1px solid #333;padding:12px;border-radius:10px">'+
        '<div style="font-weight:600;margin-bottom:6px">'+title+'</div>'+
        img+
        (desc?'<div style="margin-top:8px;color:#aaa">'+desc+'</div>':'')+
      '</li>';
    }).join('') + '</ul>';
  }

  async function main(){
    const loading = document.getElementById('loading');
    const error   = document.getElementById('error');
    const content = document.getElementById('content');
    try{
      const data = await loadJSON('games.json');
      loading.style.display = 'none';
      content.style.display = 'block';
      content.innerHTML = renderListHTML(data.games || data);
    }catch(e){
      loading.style.display = 'none';
      error.style.display = 'block';
      error.textContent = '数据加载失败：'+ e.message + '。请刷新或检查路径。';
      console.error(e);
    }
  }
  main();
})();
