
/*
 * Games 卡片桌面端“空白”修复（合并所有兜底逻辑，避免改 HTML/CSS）
 * - 自动注入桌面端网格兜底样式与图片失败占位
 * - WebP 支持探测（<html> 加 webp/no-webp）
 * - games.json 文件名兼容（优先 games.json，找不到回退到 "games (1).json"）
 * - 不依赖图片 onload 才插入卡片
 * - 无 IntersectionObserver 时自动全量渲染
 */
(function(){
  // ---- 注入样式兜底（不改现有 CSS 文件） ----
  var css = [
    '@media (min-width: 992px){',
    '  #grid, .grid { display:grid!important; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:16px; min-height:120px; visibility:visible!important; opacity:1!important; }',
    '}',
    '.game-card.img-failed .cover{ background:#1f1f1f; position:relative; }',
    '.game-card.img-failed .cover::after{ content:"图片不可用"; color:#999; font-size:12px; position:absolute; left:8px; bottom:8px; }'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-injected', 'desktop-rescue');
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  // ---- WebP 支持检测（给 <html> 打标） ----
  (function(){
    var img = new Image();
    img.onload = img.onerror = function(){
      document.documentElement.classList.add(img.height === 2 ? 'webp' : 'no-webp');
    };
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  })();

  // ---- 元素引用 ----
  var $grid = document.querySelector('#grid') || document.querySelector('.grid');
  if(!$grid){
    $grid = document.createElement('section');
    $grid.id = 'grid';
    $grid.className = 'grid';
    document.body.appendChild($grid);
  }
  var $empty = document.getElementById('empty');

  // ---- 数据加载（文件名回退） ----
  function fetchJSONWithFallback(){
    var candidates = ['games.json', 'games (1).json', './games.json', './games (1).json'];
    var i = 0;
    function tryNext(){
      if(i >= candidates.length) {
        return Promise.reject(new Error('未找到 games.json（或 games (1).json）'));
      }
      var url = candidates[i++];
      return fetch(url, {cache:'no-store'})
        .then(function(res){ if(!res.ok) throw new Error('HTTP '+res.status); return res.json(); })
        .catch(function(){ return tryNext(); });
    }
    return tryNext();
  }

  function asArray(data){
    if(Array.isArray(data)) return data;
    if(data && Array.isArray(data.items)) return data.items;
    if(data && Array.isArray(data.games)) return data.games;
    return [];
  }

  // ---- 图片节点构建（webp → jpg → png 回退） ----
  function buildCover(coverUrl, alt){
    function fallback(url, ext){ return url.replace(/\.webp($|\?)/i, function(_,q){return '.'+ext+(q||'');}); }
    var jpg = fallback(coverUrl, 'jpg');
    var png = fallback(coverUrl, 'png');

    var img = document.createElement('img');
    img.className = 'cover';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = alt || '';

    // 优先使用 webp（若支持），否则先给 jpg，再 error→png→webp 尝试
    if(document.documentElement.classList.contains('webp')) {
      img.src = coverUrl;
    } else {
      img.src = jpg;
    }

    var triedJpg = /\.jpg($|\?)/i.test(img.src);
    var triedPng = false;
    var triedWebp = /\.webp($|\?)/i.test(img.src);

    img.onerror = function(){
      if(!triedJpg){ img.src = jpg; triedJpg = true; return; }
      if(!triedPng){ img.src = png; triedPng = true; return; }
      if(!triedWebp){ img.src = coverUrl; triedWebp = true; return; }
      img.classList.add('img-failed');
    };

    return img;
  }

  function createCard(item){
    var article = document.createElement('article');
    article.className = 'game-card';

    var a = document.createElement('a');
    a.href = (item.link || item.url || item.href || 'detail.html');
    a.setAttribute('aria-label', item.title || '查看详情');

    var img = buildCover(item.cover || '', item.title || '');

    var meta = document.createElement('div');
    meta.className = 'meta';
    var titleEl = document.createElement('h3');
    titleEl.className = 'title';
    titleEl.textContent = item.title || '';
    meta.appendChild(titleEl);

    a.appendChild(img);
    a.appendChild(meta);
    article.appendChild(a);

    // 先插入 DOM，不等待图片
    $grid.appendChild(article);
  }

  function render(list){
    $grid.innerHTML = '';
    list.forEach(createCard);
    if($empty){ $empty.style.display = list.length ? 'none' : 'block'; }
  }

  function init(){
    fetchJSONWithFallback()
      .then(function(data){ render(asArray(data)); })
      .catch(function(err){
        console.error(err);
        if($empty){
          $empty.textContent = '未能加载游戏列表（请确认仓库中存在 games.json 或将文件名包含空格与括号的重命名为 games.json）';
          $empty.style.display = 'block';
        } else {
          var tip = document.createElement('div');
          tip.style.color = '#bbb';
          tip.style.padding = '12px';
          tip.textContent = '未能加载游戏列表（缺少 games.json）';
          $grid.appendChild(tip);
        }
      });
  }

  // 对外暴露，供兜底逻辑调用
  window.initCards = init;

  // 无 IntersectionObserver 也直接初始化（不阻塞）
  if(!('IntersectionObserver' in window)) init();
  else init();
})();
