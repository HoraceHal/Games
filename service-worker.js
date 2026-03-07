
/*
  GitHub Pages 性能加速 Service Worker
  - 导航(HTML)：Network First（失败回退缓存）
  - CSS/JS/JSON：Stale-While-Revalidate
  - 图片：Cache First（限制缓存条目数量）
*/

const VERSION = 'ghpages-v1';
const CORE_CACHE = `core-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

function scopePath(p) {
  // self.registration.scope 类似 https://horacehal.github.io/Games/
  const scope = new URL(self.registration.scope);
  return new URL(p.replace(/^\//,''), scope).toString();
}

const CORE_ASSETS = [
  scopePath('./'),
  scopePath('./index.html'),
  scopePath('./css/style.css'),
  scopePath('./js/app.js'),
  scopePath('./js/detail.js'),
  scopePath('./games.json'),
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    try { await cache.addAll(CORE_ASSETS); } catch (e) { /* ignore */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.includes(VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isHTML(req) {
  return req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
}
function isAsset(url) {
  return /\.(css|js|woff2?)$/i.test(url.pathname);
}
function isJSON(url) {
  return /\.json$/i.test(url.pathname);
}
function isImage(url) {
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname);
}

async function cacheTrim(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  // 删除最早加入的部分（简单 FIFO）
  const deletions = keys.slice(0, keys.length - maxItems).map(k => cache.delete(k));
  await Promise.all(deletions);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 只处理同源（GitHub Pages 项目域）
  if (url.origin !== location.origin) return;

  // HTML：网络优先
  if (isHTML(req)) {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, net.clone());
        return net;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match(scopePath('./index.html')) || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // CSS/JS/JSON：SWR
  if (isAsset(url) || isJSON(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res => {
        cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // 图片：缓存优先
  if (isImage(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      cache.put(req, res.clone());
      event.waitUntil(cacheTrim(RUNTIME_CACHE, 200));
      return res;
    })());
    return;
  }
});
