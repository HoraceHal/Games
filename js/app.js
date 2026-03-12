/*
 * Games 目录 — 强制可见 & 强制拉取版 app.js (v6)
 * 变更点：
 *  - 首次就带时间戳强制拉取（避免中间层首访 304/空体）；
 *  - 仍保留 304 容错与二次重试；
 *  - 其他特性同 v5（file:// 离线、图片回退、桌面兜底、调试日志）。
 */
(function(){
  var DEBUG = !!(window.__APP_DEBUG__);
  var box=null; function log(){ if(!DEBUG) return; if(!box){ box=document.createElement('div'); box.style.cssText='position:fixed;right:12px;bottom:12px;width:380px;max-height:50vh;overflow:auto;background:#0b0b0b;color:#ccc;font:12px/1.45 Menlo,Consolas,monospace;border:1px solid #333;border-radius:8px;padding:10px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.5)'; document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(box);}); }
    var p=document.createElement('div'); p.textContent=[].slice.call(arguments).join(' '); (box||document.body).appendChild(p); console.log('[APP]', p.textContent); }

  (function(){
    var css = [
      '@media (min-width: 992px){#grid,.grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;min-height:120px;visibility:visible!important;opacity:1!important}}',
      '.game-card.img-failed .cover{background:#1f1f1f;position:relative}',
      '.game-card.img-failed .cover::after{content:"图片不可用";color:#999;font-size:12px;position:absolute;left:8px;bottom:8px}',
      '.offline-tip{margin:16px 0;padding:12px 16px;border:1px solid #333;border-radius:8px;background:#151515;color:#bbb}'
    ].join('\n');
    var s=document.createElement('style'); s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
  })();

  (function(){ var img=new Image(); img.onload=img.onerror=function(){ document.documentElement.classList.add(img.height===2?'webp':'no-webp');}; img.src='data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA='; })();

  var $grid=document.querySelector('#grid')||document.querySelector('.grid'); if(!$grid){ $grid=document.createElement('section'); $grid.id='grid'; $grid.className='grid'; document.body.appendChild($grid);} var $empty=document.getElementById('empty');
  function asArray(d){ if(Array.isArray(d)) return d; if(d&&Array.isArray(d.items)) return d.items; if(d&&Array.isArray(d.games)) return d.games; return []; }

  function buildCover(u, alt){ function f(x,e){ return x? x.replace(/\.webp($|\?)/i, function(_,q){return '.'+e+(q||'');}):'';} var jpg=f(u,'jpg'), png=f(u,'png'); var img=document.createElement('img'); img.className='cover'; img.loading='lazy'; img.decoding='async'; img.alt=alt||''; if(document.documentElement.classList.contains('webp')&&u){ img.src=u;} else { img.src=jpg||u||'';} var tj=/\.jpg/.test(img.src), tp=false, tw=/\.webp/.test(img.src); img.onerror=function(){ if(!tj&&jpg){ img.src=jpg; tj=true; return;} if(!tp&&png){ img.src=png; tp=true; return;} if(!tw&&u){ img.src=u; tw=true; return;} img.classList.add('img-failed'); }; return img; }
  function createCard(item){ var a=document.createElement('a'); a.href=(item.link||item.url||item.href||'detail.html'); a.setAttribute('aria-label', item.title||'查看详情'); var img=buildCover(item.cover||'', item.title||''); var meta=document.createElement('div'); meta.className='meta'; var h3=document.createElement('h3'); h3.className='title'; h3.textContent=item.title||''; meta.appendChild(h3); a.appendChild(img); a.appendChild(meta); var art=document.createElement('article'); art.className='game-card'; art.appendChild(a); $grid.appendChild(art);} 
  function render(list){ $grid.innerHTML=''; list.forEach(createCard); if($empty){ $empty.style.display=list.length?'none':'block'; } log('render items =', list.length); }

  function fetchJSONWithFallback(){
    var now=Date.now();
    var candidates = [
      'games.json?v='+now, './games.json?v='+now,
      'games (1).json?v='+now, './games (1).json?v='+now
    ];
    var i=0;
    function tryOnce(url, withBuster){
      var finalUrl = withBuster? (url + '&v2=' + Date.now()): url;
      log('try fetch →', new URL(finalUrl, location.href).href);
      return fetch(finalUrl, { cache:'no-store' }).then(async function(res){
        var ok = (res.status>=200 && res.status<300) || res.status===304; if(!ok) throw new Error('HTTP '+res.status+' @ '+res.url);
        try { return await res.json(); } catch(e){ if(!withBuster){ log('JSON fail, retry buster once'); return tryOnce(url, true);} throw e; }
      });
    }
    function next(){ if(i>=candidates.length) return Promise.reject(new Error('候选均失败')); var u=candidates[i++]; return tryOnce(u).catch(function(){ return next();}); }
    return next();
  }

  function showOfflinePicker(){ var tip=document.createElement('div'); tip.className='offline-tip'; tip.innerHTML='<strong>检测到 file:// 打开。</strong> 请选择本地 <code>games.json</code> 进行离线渲染： <input id="pickJSON" type="file" accept="application/json,.json">'; var c=document.querySelector('main')||document.body; c.insertBefore(tip, c.firstChild); tip.querySelector('#pickJSON').addEventListener('change', function(){ var f=this.files&&this.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ render(asArray(JSON.parse(String(r.result||'')))); }catch(e){ alert('解析 JSON 失败：'+e.message);} }; r.readAsText(f,'utf-8'); }); }

  function init(){ if(location.protocol==='file:'){ showOfflinePicker(); return; } fetchJSONWithFallback().then(function(d){ render(asArray(d)); }).catch(function(e){ log('最终失败：', e&&e.message || e); if($empty){ $empty.textContent='未能加载游戏列表：'+(e.message||e); $empty.style.display='block'; } }); }
  try{ init(); }catch(e){ log('init crash', e&&e.message||e); }
})();
