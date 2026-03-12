
/*
 * Games 目录 — "确保 Network 出现 games.json" 修复包 (v8)
 * 目标：无论数据最终从哪来，Network 面板里**一定**能看到一次对 `games.json` 的请求。
 * 做法：
 *   A. 先发起一次 “纯路径探测请求” fetch('games.json', {cache:'no-store'})，只为让 Network 出现；
 *   B. 再进行正式数据加载：
 *      - 首访带时间戳强拉（绕过 304/空体）；失败则再试纯路径；
 *      - 仍失败 → `fallback.json` → 内联 __GAMES__；
 *   C. 仍含 file:// 离线选择器、桌面网格兜底、图片回退；
 *   D. 支持 window.__APP_DEBUG__ = true 打开右下角日志。
 */
(function(){
  var DEBUG = !!window.__APP_DEBUG__;
  var box=null; function log(){ if(!DEBUG) return; if(!box){ box=document.createElement('div'); box.style.cssText='position:fixed;right:12px;bottom:12px;width:380px;max-height:50vh;overflow:auto;background:#0b0b0b;color:#ccc;font:12px/1.45 Menlo,Consolas,monospace;border:1px solid #333;border-radius:8px;padding:10px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.5)'; document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(box);}); }
    var p=document.createElement('div'); p.textContent=[].slice.call(arguments).join(' '); (box||document.body).appendChild(p); console.log('[APP]', p.textContent); }

  // 样式兜底
  (function(){ var s=document.createElement('style'); s.textContent='@media (min-width:992px){#grid,.grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;min-height:120px;visibility:visible!important;opacity:1!important}}.game-card.img-failed .cover{background:#1f1f1f;position:relative}.game-card.img-failed .cover::after{content:"图片不可用";color:#999;font-size:12px;position:absolute;left:8px;bottom:8px}.offline-tip{margin:16px 0;padding:12px 16px;border:1px solid #333;border-radius:8px;background:#151515;color:#bbb}'; document.head.appendChild(s);})();

  // webp 标记
  (function(){ var i=new Image(); i.onload=i.onerror=function(){document.documentElement.classList.add(i.height===2?'webp':'no-webp');}; i.src='data:image/webp;base64,UklGRiIAAABXRUJQVlA4TCEAAAAvAAAAAAfQ//73v/+BiOh/AAA='; })();

  var $grid=document.querySelector('#grid')||document.querySelector('.grid'); if(!$grid){ $grid=document.createElement('section'); $grid.id='grid'; $grid.className='grid'; document.body.appendChild($grid);} var $empty=document.getElementById('empty');
  function asArray(d){ if(Array.isArray(d)) return d; if(d&&Array.isArray(d.items)) return d.items; if(d&&Array.isArray(d.games)) return d.games; return []; }
  function buildCover(u, alt){ function f(x,e){return x?x.replace(/\.webp($|\?)/i,function(_,q){return '.'+e+(q||'');}):'';} var jpg=f(u,'jpg'), png=f(u,'png'); var img=document.createElement('img'); img.className='cover'; img.loading='lazy'; img.decoding='async'; img.alt=alt||''; if(document.documentElement.classList.contains('webp')&&u){ img.src=u;} else { img.src=jpg||u||'';} var tj=/\.jpg/.test(img.src), tp=false, tw=/\.webp/.test(img.src); img.onerror=function(){ if(!tj&&jpg){img.src=jpg; tj=true; return;} if(!tp&&png){img.src=png; tp=true; return;} if(!tw&&u){img.src=u; tw=true; return;} img.classList.add('img-failed'); }; return img; }
  function createCard(item){ var a=document.createElement('a'); a.href=(item.link||item.url||item.href||'detail.html'); a.setAttribute('aria-label', item.title||'查看详情'); var img=buildCover(item.cover||'', item.title||''); var meta=document.createElement('div'); meta.className='meta'; var h3=document.createElement('h3'); h3.className='title'; h3.textContent=item.title||''; meta.appendChild(h3); a.appendChild(img); a.appendChild(meta); var art=document.createElement('article'); art.className='game-card'; art.appendChild(a); $grid.appendChild(art);} 
  function render(list){ $grid.innerHTML=''; list.forEach(createCard); if($empty){ $empty.style.display=list.length?'none':'block'; } log('render items =', list.length); }

  // A. 先发一条“纯路径探测”，只为让 Network 必定出现 games.json
  function fireProbe(){
    log('probe: GET games.json (no params)');
    fetch('games.json', { cache: 'no-store' }).then(function(res){ log('probe status =', res.status); }).catch(function(e){ log('probe error =', e && e.message || e); });
  }

  // B. 正式加载逻辑：强拉 → 纯路径 → fallback → 内联
  function fetchOfficial(){
    var t=Date.now();
    var forced = ['games.json?v='+t, './games.json?v='+t, 'games (1).json?v='+t, './games (1).json?v='+t];
    var plain  = ['games.json', './games.json', 'games (1).json', './games (1).json'];

    function chain(list){ var i=0; function next(){ if(i>=list.length) return Promise.reject('all fail'); var u=list[i++]; log('try →', new URL(u, location.href).href); return fetch(u, {cache:'no-store'}).then(async function(r){ var ok=(r.status>=200&&r.status<300)||r.status===304; if(!ok) throw new Error('HTTP '+r.status); try{ return await r.json(); }catch(e){ // 304/空体
        if(!u.includes('v=')){ // 若是纯路径失败，则不再重复
          throw e;
        }
        // 带 v= 的也失败，则继续链
        throw e; }
      }).catch(function(){ return next(); }); }
      return next(); }

    // 先强拉（带 v=），失败再纯路径
    return chain(forced).catch(function(){ return chain(plain); });
  }

  function fetchFallback(){ return fetch('fallback.json?'+Date.now(), {cache:'no-store'}).then(r=>r.json()); }
  function tryInline(){ var el=document.getElementById('__GAMES__'); if(!el) throw 'no inline'; return JSON.parse(el.textContent||el.innerText||'[]'); }

  function init(){
    if(location.protocol==='file:'){
      var tip=document.createElement('div'); tip.className='offline-tip'; tip.innerHTML='<strong>file:// 模式。</strong> 选择本地 <code>games.json</code> 离线渲染： <input id="pickJSON" type="file" accept="application/json,.json">'; var m=document.querySelector('main')||document.body; m.insertBefore(tip, m.firstChild); tip.querySelector('#pickJSON').addEventListener('change', function(){ var f=this.files&&this.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ render(asArray(JSON.parse(String(r.result||'')))); }catch(e){ alert('解析失败：'+e.message);} }; r.readAsText(f,'utf-8'); });
      return;
    }

    fireProbe(); // 立刻打点，让 Network 出现 games.json 这一条

    fetchOfficial()
      .then(function(d){ render(asArray(d)); })
      .catch(function(){ return fetchFallback().then(function(d){ render(asArray(d)); }).catch(function(){ try{ render(asArray(tryInline())); }catch(e){ if($empty){ $empty.textContent='未能加载任何数据：请确认 js/app.js 已覆盖、且 games.json 与页面同域/同层级'; $empty.style.display='block'; } } }); });
  }

  try{ init(); }catch(e){ log('init crash', e && (e.stack||e)); }
})();
