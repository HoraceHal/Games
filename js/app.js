
/*
 * Games 目录 — 桌面端不显示卡片 综合修复版 app.js
 * v5 (2026-03-12)
 *
 * ✅ 关键特性
 * 1) 304/空体 兼容：遇到 304 或 JSON 解析失败，自动带时间戳二次拉取，强制 200。
 * 2) file:// 离线模式：直接双击本地 HTML 时，提供“选择本地 games.json”入口（FileReader），无需服务器。
 * 3) 路径 & 文件名 兼容：按顺序尝试 'games.json'、'./games.json'、'games (1).json'、'./games (1).json'。
 * 4) 卡片渲染不依赖图片 onload：图片失败不阻塞卡片 DOM 的插入。
 * 5) 图片回退：webp→jpg→png 级联；<html> 打标 webp/no-webp。
 * 6) 桌面端网格兜底样式：强制#grid/.grid在≥992px可见。
 * 7) 懒加载兼容：即使没有 IntersectionObserver 也直接渲染。
 * 8) 轻量诊断：支持 window.__APP_DEBUG__ = true 打开右下角日志面板。
 */
(function(){
  var DEBUG = !!(window.__APP_DEBUG__);

  // ---------- 轻量日志面板 ----------
  var box=null; function log(){ if(!DEBUG) return; if(!box){ box = document.createElement('div'); box.style.cssText='position:fixed;right:12px;bottom:12px;width:380px;max-height:50vh;overflow:auto;background:#0b0b0b;color:#ccc;font:12px/1.45 Menlo,Consolas,monospace;border:1px solid #333;border-radius:8px;padding:10px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.5)'; box.id='diag-box'; document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(box);}); }
    var msg = Array.prototype.slice.call(arguments).join(' '); console.log('[APP]', msg); var p=document.createElement('div'); p.textContent=msg; (box||document.body).appendChild(p); }
  window.addEventListener('error', function(e){ log('window.onerror:', (e && e.message)||e);});
  window.addEventListener('unhandledrejection', function(e){ log('unhandledrejection:', e && (e.reason && (e.reason.stack||e.reason)) || e);});

  // ---------- 桌面兜底样式（不改现有 CSS 文件） ----------
  (function(){
    var css = [
      '@media (min-width: 992px){#grid,.grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;min-height:120px;visibility:visible!important;opacity:1!important}}',
      '.game-card.img-failed .cover{background:#1f1f1f;position:relative}',
      '.game-card.img-failed .cover::after{content:"图片不可用";color:#999;font-size:12px;position:absolute;left:8px;bottom:8px}',
      '.offline-tip{margin:16px 0;padding:12px 16px;border:1px solid #333;border-radius:8px;background:#151515;color:#bbb}',
      '.offline-tip strong{color:#ddd}',
      '.offline-tip input[type=file]{margin-left:8px}'
    ].join('\n');
    var styleEl = document.createElement('style');
    styleEl.appendChild(document.createTextNode(css));
    document.head.appendChild(styleEl);
  })();

  // ---------- WebP 支持打标 ----------
  (function(){ var img=new Image(); img.onload=img.onerror=function(){ var ok=img.height===2; document.documentElement.classList.add(ok?'webp':'no-webp'); log('webp =', ok);}; img.src='data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA='; })();

  // ---------- 基本引用 ----------
  var $grid = document.querySelector('#grid') || document.querySelector('.grid');
  if(!$grid){ $grid = document.createElement('section'); $grid.id='grid'; $grid.className='grid'; document.body.appendChild($grid);} 
  var $empty = document.getElementById('empty');

  function asArray(data){ if(Array.isArray(data)) return data; if(data && Array.isArray(data.items)) return data.items; if(data && Array.isArray(data.games)) return data.games; return []; }

  // ---------- 图片节点构建（webp→jpg→png 回退，失败不阻塞） ----------
  function buildCover(coverUrl, alt){
    function fallback(url, ext){ return url ? url.replace(/\.webp($|\?)/i, function(_,q){ return '.'+ext+(q||'');}) : ''; }
    var jpg = fallback(coverUrl, 'jpg'); var png = fallback(coverUrl, 'png');
    var img = document.createElement('img'); img.className='cover'; img.loading='lazy'; img.decoding='async'; img.alt=alt||'';
    if(document.documentElement.classList.contains('webp') && coverUrl){ img.src = coverUrl; } else { img.src = jpg || coverUrl || ''; }
    var triedJ=/\.jpg($|\?)/i.test(img.src), triedP=false, triedW=/\.webp($|\?)/i.test(img.src);
    img.onerror=function(){ if(!triedJ && jpg){ img.src=jpg; triedJ=true; return;} if(!triedP && png){ img.src=png; triedP=true; return;} if(!triedW && coverUrl){ img.src=coverUrl; triedW=true; return;} img.classList.add('img-failed'); };
    return img;
  }

  function createCard(item){
    var article = document.createElement('article'); article.className='game-card';
    var a = document.createElement('a'); a.href=(item.link||item.url||item.href||'detail.html'); a.setAttribute('aria-label', item.title||'查看详情');
    var img = buildCover(item.cover||'', item.title||'');
    var meta = document.createElement('div'); meta.className='meta'; var h3=document.createElement('h3'); h3.className='title'; h3.textContent=item.title||''; meta.appendChild(h3);
    a.appendChild(img); a.appendChild(meta); article.appendChild(a); $grid.appendChild(article); // 先插 DOM，不等待图片
  }

  function render(list){
    $grid.innerHTML=''; list.forEach(createCard); if($empty){ $empty.style.display = list.length ? 'none' : 'block'; }
    log('render done. items =', list.length);
  }

  // ---------- fetch 封装：兼容 304/空体；文件名/路径回退 ----------
  function fetchJSONWithFallback(){
    var candidates = ['games.json', './games.json', 'games (1).json', './games (1).json'];
    try { log('origin =', location.origin, '| protocol =', location.protocol); log('candidates =', JSON.stringify(candidates.map(p=>new URL(p, location.href).href))); } catch(_){ }

    var i=0;
    function tryOnce(url, withBuster){
      var finalUrl = withBuster ? (url + (url.includes('?')?'&':'?') + 'v=' + Date.now()) : url;
      log('try fetch →', new URL(finalUrl, location.href).href);
      // cache: 'no-store' 仍可能被部分中间层 304，后面做兜底
      return fetch(finalUrl, { cache: 'no-store' }).then(async function(res){
        var acceptable = (res.status>=200 && res.status<300) || res.status===304; // 接受 304
        if(!acceptable) throw new Error('HTTP '+res.status+' @ '+res.url);
        try {
          return await res.json();
        } catch(e){
          // 若是 304 或空体导致解析失败，带时间戳强制再拉一次
          if(!withBuster){ log('body empty / JSON parse fail, retry with buster:', e); return tryOnce(url, true); }
          throw e;
        }
      });
    }
    function tryNext(){ if(i>=candidates.length) return Promise.reject(new Error('所有候选均失败（含 304/空体 强制重试）')); var url=candidates[i++]; return tryOnce(url).catch(function(){ return tryNext();}); }
    return tryNext();
  }

  // ---------- file:// 离线模式：提供“选择本地 JSON”入口 ----------
  function showOfflinePicker(){
    var tip = document.createElement('div'); tip.className='offline-tip';
    tip.innerHTML = '<strong>检测到你是直接双击本地 HTML (file://)。</strong> 由于浏览器同源策略，脚本无法直接 fetch 本地 JSON。你可以：① 在项目目录启动本地服务器后用 http:// 访问；或 ② 直接选择本地 <code>games.json</code> 离线渲染。 <label style="margin-left:8px;">选择文件：<input id="pickJSON" type="file" accept="application/json,.json"></label>';
    var container = document.querySelector('main') || document.body; container.insertBefore(tip, container.firstChild);
    var input = tip.querySelector('#pickJSON'); input.addEventListener('change', function(){ var file = input.files && input.files[0]; if(!file) return; var reader=new FileReader(); reader.onload=function(){ try{ var data=JSON.parse(String(reader.result||'')); render(asArray(data)); }catch(e){ alert('解析 JSON 失败：'+e.message); } }; reader.readAsText(file, 'utf-8'); });
  }

  // ---------- 初始化 ----------
  function init(){
    if(!('IntersectionObserver' in window)){ log('no IntersectionObserver, but continue'); }
    if(location.protocol === 'file:'){ showOfflinePicker(); return; }
    fetchJSONWithFallback()
      .then(function(data){ render(asArray(data)); })
      .catch(function(err){ log('最终失败：', err && (err.stack||err)); if($empty){ $empty.textContent = '未能加载游戏列表：'+ (err.message||err); $empty.style.display='block'; } });
  }

  try{ init(); }catch(e){ log('init crashed:', e && (e.stack||e)); }
})();
