const CACHE_NAME = 'unikgu-cache-v77';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation (HTML pages): Network-First with 1.2s timeout, falling back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const networkResponse = await fetch(event.request, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch {
          // Offline or network timeout -> serve from cache
        }

        const cache = await caches.open(CACHE_NAME);
        const cached =
          (await cache.match(event.request)) ||
          (await cache.match('./index.html')) ||
          (await cache.match('./'));

        if (cached) return cached;
        // Last resort: try plain fetch without timeout
        return fetch(event.request);
      })()
    );
    return;
  }

  // 2. Real-time sync requests: Pure Network (Never cache stale payloads in SW)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebasedatabase.app') ||
    url.hostname.includes('restful-api.dev') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('api.github.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. API & Schedule JSON requests: Network-First (Always fetch latest schedule if online)
  if (
    url.pathname.includes('/api') ||
    url.pathname.includes('/schedules/') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('eios.kosgos.ru') ||
    url.hostname.includes('raw.githubusercontent.com') ||
    url.hostname.includes('broker.emqx.io') ||
    url.hostname.includes('broker.hivemq.com') ||
    url.hostname.includes('mosquitto.org') ||
    url.hostname.includes('corsproxy')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Static assets (JS, CSS with hash in filename): Cache-first, fall back to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});

// Focus or open app window when clicking system push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});
