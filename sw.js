// 離線快取：先走網路（確保拿到最新版），斷網時改用快取；所有資料僅存本機
const C = 'afpr-gh-v3';
const CORE = ['./', './index.html', './engine.js', './support.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './ds/styles.css', './ds/_ds_bundle.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(C).then(async c => {
    try { const r = await fetch(e.request); if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }
    catch (_) { return (await c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' })) || Response.error(); }
  }));
});
