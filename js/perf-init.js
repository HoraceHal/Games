
(function(){
  // Register SW
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js'));
  }

  // Replace <img data-src> with Cloudflare Image Resizing URL if available
  function buildCFURL(src, opts){
    // opts: {w, q, f}
    const p=new URL(src, location.origin);
    const params=[];
    if(opts.w) params.push('width='+opts.w);
    if(opts.q) params.push('quality='+opts.q);
    if(opts.f) params.push('format='+opts.f);
    if(params.length===0) return src;
    return location.origin+"/cdn-cgi/image/"+params.join(',')+p.pathname+(p.search||'');
  }

  // Lazy-load with LQIP fade-in
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const img=en.target; io.unobserve(img);
      const src=img.dataset.src||img.src; // fallback
      const w=Math.min(img.parentElement.clientWidth, 1600);
      const cf=buildCFURL(src,{w:Math.round(w), q:70});
      const real = new Image();
      real.onload=function(){
        img.src=cf; img.classList.add('lqip-loaded');
      };
      real.src=cf;
    });
  },{rootMargin:'200px'}):null;

  document.querySelectorAll('img.lazy, img[data-src]').forEach(img=>{
    // If developer provided tiny preview (data-lqip), keep it as initial src
    if(img.dataset.lqip && !img.src) img.src=img.dataset.lqip;
    if(io) io.observe(img); else {
      // Fallback: immediate load
      const src=img.dataset.src||img.src; img.src=src;
    }
  });

  // Defer third-party non-critical scripts
  document.querySelectorAll('script[data-defer="true"]').forEach(s=>{
    const n=document.createElement('script'); n.src=s.dataset.src; n.defer=true; document.body.appendChild(n);
  });
})();
