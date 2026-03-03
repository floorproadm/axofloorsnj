const CACHE_NAME = 'axo-admin-v1';
const ADMIN_SHELL = [
  '/admin',
  '/admin-manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ADMIN_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle admin routes, skip OAuth
  if (!url.pathname.startsWith('/admin') || url.pathname.includes('~oauth')) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
