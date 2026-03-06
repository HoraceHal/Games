
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open('v1').then(c=>c.addAll(['/','/index.html','/css/style.css','/js/detail.js'])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
