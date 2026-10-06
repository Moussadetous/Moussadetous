const CACHE_NAME = 'miette-arbre-v1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const home = new URL('./', self.registration.scope).href;
    try {
      const response = await fetch(home, { cache: 'reload' });
      if (response.ok) {
        const html = await response.clone().text();
        await cache.put(home, response);
        const paths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((match) => match[1])
          .filter((path) => !/^(?:https?:|data:|#)/i.test(path));
        await Promise.all(paths.map(async (path) => {
          try {
            const url = new URL(path, home).href;
            const asset = await fetch(url);
            if (asset.ok) await cache.put(url, asset);
          } catch { /* One optional icon should never prevent the game from being cached. */ }
        }));
      }
    } catch { /* The browser will retry the cache warm-up on the next visit. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('miette-arbre-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && /\.(?:js|css|webmanifest|svg)$/.test(requestUrl.pathname)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const home = new URL('./', self.registration.scope).href;
      return (await caches.match(home)) || Response.error();
    }
  })());
});
