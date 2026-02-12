const CACHE_NAME = 'donezy-v3';
const PRECACHE_URLS = [
  '/',
  '/donezy-logo.svg',
  '/Donezy-logo.png',
];

// Install: precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler with proper SPA navigation support
self.addEventListener('fetch', (event) => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  // Navigation requests (page loads/refreshes) → always serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Always fetch the root index.html from the network for navigation
      fetch('/')
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
            return response;
          }
          // Server error: fall back to cached index.html
          return caches.match('/').then((cached) => cached || response);
        })
        .catch(() => {
          // Offline: serve cached index.html
          return caches.match('/').then((cached) => {
            return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
          });
        })
    );
    return;
  }

  // Other requests: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
