
/*
  桌面端不显示卡片的修复版 app.js
  关键策略：
  1) 不再依赖图片 onload 事件后再插入卡片；即使图片失败，卡片也会渲染。
  2) WebP 兜底：优先尝试 .webp，失败后自动回退到 .jpg/.png。
  3) 懒加载兼容：在不支持 IntersectionObserver 的环境不再阻塞渲染。
  4) 更健壮的 games.json 解析。
*/
(function(){
  var $grid = document.querySelector('.cards, .grid, .card-list, .games');
  if (!$grid) {
    $grid = document.createElement('section');
    $grid.className = 'cards';
    document.body.appendChild($grid);
  }

  function fetchJSON(url){
    return fetch(url, {cache: 'no-store'}).then(function(res){
      if(!res.ok) throw new Error('加载失败: ' + url);
      return res.json();
    });
  }

  function asArray(data){
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items; // 兼容 {items: []}
    if (data && Array.isArray(data.games)) return data.games; // 兼容 {games: []}
    return [];
  }

  function resolveCover(item){
    // 优先用数据里的 cover
    if (item.cover) return item.cover;
    // 其次用 images/covers/<slug>.webp 的约定
    var slug = item.slug || item.id || (item.title ? item.title.replace(/\s+/g,'').toLowerCase() : 'nocover');
    return 'images/covers/' + slug + '.webp';
  }

  function buildPicture(coverUrl, alt){
    // 根据 .webp 自动生成 jpg/png 回退候选
    function fallback(url, ext){
      return url.replace(/\.webp($|\?)/i, function(_, q){ return '.'+ext + (q||''); });
    }
    var jpg = fallback(coverUrl, 'jpg');
    var png = fallback(coverUrl, 'png');

    var picture = document.createElement('picture');

    var sourceWebp = document.createElement('source');
    sourceWebp.type = 'image/webp';
    sourceWebp.srcset = coverUrl;

    var img = document.createElement('img');
    img.className = 'cover';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = alt || '';
    img.src = jpg; // 先给 jpg，下面再在支持 webp 时切换；若无 jpg 则 onerror 再试 png

    // 若 <html> 带有 webp/no-webp 标记，则在首帧即选对资源
    if (document.documentElement.classList.contains('webp')) {
      img.src = coverUrl;
    }

    var triedJpg = false, triedPng = false;
    img.onerror = function(){
      if (!triedJpg && /\.jpg($|\?)/i.test(img.src)) { triedJpg = true; img.src = png; return; }
      if (!triedPng && /\.png($|\?)/i.test(img.src)) { triedPng = true; img.src = coverUrl; return; }
      img.classList.add('img-failed');
    };

    picture.appendChild(sourceWebp);
    picture.appendChild(img);
    return picture;
  }

  function createCard(item){
    var article = document.createElement('article');
    article.className = 'game-card';

    var a = document.createElement('a');
    a.href = (item.link || item.url || item.href || 'detail.html');
    a.setAttribute('aria-label', item.title || '查看详情');

    var coverUrl = resolveCover(item);
    var picture = buildPicture(coverUrl, item.title || '');

    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = '
      <h3 class="title">' + (item.title || '未命名') + '</h3>
      ' + (item.desc ? ('<p class="desc">'+ item.desc +'</p>') : '');

    a.appendChild(picture);
    a.appendChild(meta);
    article.appendChild(a);

    // 不等待图片 onload，先渲染到 DOM
    $grid.appendChild(article);
  }

  function render(list){
    $grid.innerHTML = '';
    list.forEach(createCard);
  }

  function init(){
    fetchJSON('games.json').then(function(data){
      var list = asArray(data);
      render(list);
    }).catch(function(err){
      console.error(err);
      // 即使数据失败，也给个可见的提示，避免“空白什么也没有”的错觉
      var tip = document.createElement('div');
      tip.style.color = '#bbb';
      tip.style.padding = '12px';
      tip.textContent = '未能加载游戏列表（games.json）。';
      $grid.appendChild(tip);
    });
  }

  // 对外暴露，便于懒加载兜底脚本调用
  window.initCards = init;

  // 直接初始化
  init();
})();
