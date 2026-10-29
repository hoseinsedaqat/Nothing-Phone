// Minimal offline-first service worker for the simulator shell.
// Paths are derived from the registration scope so the app works both at a
// domain root and under a GitHub Pages project path (e.g. /Nothing-Phone/).
const CACHE = 'np3-sim-v4';
const SCOPE = self.registration ? self.registration.scope : '/';
const CORE = [
  SCOPE,
  new URL('index.html', SCOPE).href,
  new URL('manifest.webmanifest', SCOPE).href,
  new URL('favicon.svg', SCOPE).href,
];
const INDEX = new URL('index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => undefined);
            return res;
          })
          .catch(() => caches.match(INDEX)),
    ),
  );
});
