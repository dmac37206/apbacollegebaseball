/* APBA College Baseball - offline cache.
   The page files (index.html, season.html, manifest) are NETWORK-FIRST: when
   there is a connection the phone fetches the fresh copy and updates the
   cache, so a new build shows up on the next open without reinstalling.
   Offline, the cached copy is served.  Fonts, icons and anything else stay
   cache-first.  CACHE still gets bumped on a publish so old caches are dropped. */
const CACHE = 'apba-cb-2026-09-13-d';
const CORE = ['./','./index.html','./season.html','./manifest.json',
              './icon-180.png','./icon-192.png','./icon-512.png'];
const FRESH = /\/(index\.html|season\.html|manifest\.json)?(\?.*)?$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(CORE.map(u => c.add(u).catch(()=>{}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = url.origin === self.location.origin && FRESH.test(url.pathname);
  if (isPage) {
    /* network first, cache as fallback */
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  /* everything else: cache first, then network, keeping what comes back */
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
