/* APBA College Baseball - offline cache.
   Page files (index.html, season.html, manifest) are NETWORK-FIRST so a new
   build shows on the next open; everything else (fonts, icons, the Firebase
   scripts) is cache-first so the app still opens offline. */
const CACHE = 'apba-cb-2026-09-15-h';
const CORE = ['./','./index.html','./season.html','./manifest.json',
              './icon-180.png','./icon-192.png','./icon-512.png'];
const FRESH = /\/(index\.html|season\.html|manifest\.json)?(\?.*)?$/;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(()=>{})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  /* never intercept the Firebase/Google auth and database traffic */
  if (/googleapis\.com$|firebaseapp\.com$|google\.com$|firebaseio\.com$/.test(url.host)) return;
  const isPage = url.origin === self.location.origin && FRESH.test(url.pathname);
  if (isPage) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{}); return res; })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{}); return res; }).catch(() => caches.match('./index.html'))));
});
