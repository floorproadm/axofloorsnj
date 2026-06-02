// Self-destructing service worker.
// The previous version cached the /admin shell, which caused blank white
// screens on iOS PWA after deploys (cached HTML referenced stale JS bundles).
// This version unregisters itself and clears all caches on activation.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) {
      // ignore
    }
    try {
      await self.registration.unregister();
    } catch (e) {
      // ignore
    }
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});

// Pass-through: never serve from cache.
self.addEventListener('fetch', () => {});
