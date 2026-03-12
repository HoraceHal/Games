
// force-home-absolute.js
// 强制把“返回首页”按钮跳转到绝对地址：https://horacehal.github.io/Games/
// 无论原 href 写了什么（/、index.html、woii.ac.cn…），均在点击时改写并导航。
(function(){
  var ABS_HOME = 'https://horacehal.github.io/Games/';
  function shouldTreatAsHome(a){
    if(!a) return false;
    var txt=(a.textContent||'').trim();
    var href=(a.getAttribute('href')||'').trim();
    // 关键词 或 明显的首页 href 或 指向 woii.ac.cn
    var homeWords = /返回首页|回到首页|首页|Home/i.test(txt);
    var homeHref  = href==='' || href==='/' || /\/index\.html$/i.test(href) || href==='#home';
    var wrongHost = /https?:\/\/woii\.ac\.cn/i.test(href);
    return a.hasAttribute('data-home') || homeWords || homeHref || wrongHost;
  }
  function bind(){
    document.querySelectorAll('a').forEach(function(a){
      if(!shouldTreatAsHome(a)) return;
      a.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        // 统一跳到绝对地址
        window.location.assign(ABS_HOME);
      }, {capture:true});
      // 同时把可见 href 改掉，防止右键/状态栏显示旧地址
      a.setAttribute('href', ABS_HOME);
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', bind);
  }else{ bind(); }
})();
