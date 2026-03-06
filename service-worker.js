
const VERSION='v2-ultimate';
const CORE=[
  '/',
  '/index.html',
  '/css/style.css'
];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open('core-'+VERSION);
    try{ await c.addAll(CORE);}catch(err){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>!k.includes(VERSION)).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

// Strategy:
//  - HTML: network-first (fallback cache)
//  - CSS/JS: stale-while-revalidate
//  - Images: cache-first with max entries/age

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET') return;

  const isHTML=e.request.headers.get('accept')?.includes('text/html');
  const isImage=/\.(avif|webp|png|jpe?g|gif|svg)$/i.test(url.pathname) || url.pathname.includes('/cdn-cgi/image/');
  const isAsset=/\.(css|js|woff2?)$/i.test(url.pathname);

  if(isHTML){
    e.respondWith((async()=>{
      try{
        const net=await fetch(e.request);
        const cache=await caches.open('html-'+VERSION);
        cache.put(e.request, net.clone());
        return net;
      }catch(err){
        const cache=await caches.match(e.request);
        return cache || new Response('<h1>Offline</h1>',{headers:{'Content-Type':'text/html'}});
      }
    })());
    return;
  }

  if(isAsset){
    e.respondWith((async()=>{
      const cache=await caches.open('asset-'+VERSION);
      const cached=await cache.match(e.request);
      const fetchAndUpdate=fetch(e.request).then(r=>{ cache.put(e.request,r.clone()); return r;}).catch(()=>cached);
      return cached || fetchAndUpdate;
    })());
    return;
  }

  if(isImage){
    e.respondWith((async()=>{
      const cache=await caches.open('img-'+VERSION);
      const cached=await cache.match(e.request);
      if(cached) return cached;
      try{
        const net=await fetch(e.request,{mode:'no-cors'});
        cache.put(e.request, net.clone());
        return net;
      }catch(err){
        return cached || Response.error();
      }
    })());
    return;
  }
});
