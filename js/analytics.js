
(function(){
  const cfg = (window.__ANALYTICS||{});
  // Cloudflare Web Analytics
  if(cfg.cloudflareToken){
    const s=document.createElement('script');
    s.defer=true; s.src='https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({token: cfg.cloudflareToken}));
    document.head.appendChild(s);
  }
  // Umami
  if(cfg.umamiSrc && cfg.umamiWebsiteId){
    const s=document.createElement('script');
    s.defer=true; s.src=cfg.umamiSrc; s.setAttribute('data-website-id', cfg.umamiWebsiteId);
    document.head.appendChild(s);
  }
})();
