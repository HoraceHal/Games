
// force-home-to-games.js
// 目的：在 GitHub Pages 项目页中，强制“返回首页”按钮跳转到 /<repo>/
// 本仓库为 /Games/，脚本会在加载时：
// 1) 把指向 woii.ac.cn 的“返回首页”链接改为 /Games/
// 2) 把 href="index.html"、href="/"、href="#home" 的链接改为 /Games/
// 3) 支持为任意 <a data-home> 强制设置首页链接
(function(){
  var REPO = '/Games/'; // 如仓库名更改，改这里即可
  function isHomeLikeHref(href){
    if(!href) return false;
    try{
      var u=new URL(href, location.origin);
      // 站外链接不处理
      if(u.origin!==location.origin && !/woii\.ac\.cn$/i.test(u.hostname)) return false;
      href = u.href;
    }catch(e){}
    return (
      /https?:\/\/woii\.ac\.cn/i.test(href) ||
      href==='/' || /\/index\.html$/i.test(href) || href==='#home'
    );
  }
  document.addEventListener('DOMContentLoaded', function(){
    var anchors = document.querySelectorAll('a');
    anchors.forEach(function(a){
      var txt=(a.textContent||'').trim();
      var href=a.getAttribute('href');
      var marked=a.hasAttribute('data-home') || /返回首页|回到首页|Home/i.test(txt);
      if(marked || isHomeLikeHref(href)){
        a.setAttribute('href', REPO);
      }
    });
  });
})();
