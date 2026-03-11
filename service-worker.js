
// 极简 SW：仅做跳过等待和控制，不拦截 fetch，避免缓存干扰
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
// 不添加 fetch 监听，彻底避免缓存污染
