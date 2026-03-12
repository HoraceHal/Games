
// home-link-fix.js
// 自动修正“返回首页”链接到项目页根路径： https://<user>.github.io/<repo>/
// 适配以下几种写法： href="index.html" / href="/" / href="#home" / 带 data-home
(function(){
  function projectBase(){
    // pathname 形如 "/Games/detail.html" 或 "/Games/sub/xx.html"
    // 取第一级目录作为仓库名
    var seg = location.pathname.split('/').filter(Boolean); // 去除空串
    if(seg.length>0){ return '/' + seg[0] + '/'; }
    return '/';
  }
  function isHomeLike(href){
    if(!href) return false;
    // 仅判断当前站内链接
    try{ var u = new URL(href, location.origin); if(u.origin!==location.origin) return false; href = u.pathname + (u.search||'') + (u.hash||''); }catch(e){}
    return href==='/' || href==='/index.html' || href.endsWith('/index.html') || href==='#home';
  }
  document.addEventListener('DOMContentLoaded', function(){
    var base = projectBase();
    var anchors = document.querySelectorAll('a[data-home], a.home, a');
    anchors.forEach(function(a){
      var txt = (a.textContent||'').trim();
      var want = a.hasAttribute('data-home') || /返回首页|回到首页|Home/i.test(txt) || isHomeLike(a.getAttribute('href'));
      if(!want) return;
      a.setAttribute('href', base);
    });
  });
})();
