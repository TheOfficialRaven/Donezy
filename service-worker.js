const CACHE_NAME = 'donezy-v1.0.3';
const STATIC_CACHE = 'donezy-static-v1.0.3';
const DYNAMIC_CACHE = 'donezy-dynamic-v1.0.3';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/tailwind.css',
  '/css/modules/base.css',
  '/css/modules/components.css',
  '/css/modules/layout.css',
  '/css/modules/themes.css',
  '/css/styles.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/firebase-config.js',
  '/js/target-audience-selector.js',
  '/js/pwa-installer.js',
  '/js/modules/FirebaseService.js',
  '/js/modules/LocalStorageService.js',
  '/js/modules/DataService.js',
  '/js/modules/NotificationService.js',
  '/js/modules/ModalService.js',
  '/js/modules/LevelSystem.js',
  '/js/modules/StatAggregator.js',
  
  '/js/modules/CurrencyService.js',
  
  '/js/modules/ListsService.js',
  '/js/modules/ListsRenderer.js',
  '/js/modules/NotesService.js',
  '/js/modules/NotesRenderer.js',
  '/js/modules/CalendarService.js',
  '/js/modules/CalendarRenderer.js',
  '/js/modules/ReminderService.js',
  '/js/modules/DashboardService.js',
  '/js/modules/ThemeService.js',
  '/js/modules/ThemeRenderer.js',
      '/js/modules/MissionService.js',
    '/js/modules/MissionRenderer.js',
    '/js/modules/ResultsService.js',
    '/js/modules/ResultsRenderer.js',
  '/imgs/Essence.svg',
  '/imgs/icon-192x192.svg',
  '/imgs/icon-512x512.svg',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files...');
        // Cache files one by one to handle individual failures
        return Promise.allSettled(
          STATIC_FILES.map(url => 
            cache.add(url).catch(error => {
              console.warn(`[SW] Failed to cache ${url}:`, error);
              return null; // Continue with other files
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`[SW] Cache results: ${successful} successful, ${failed} failed`);
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Critical error during installation:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Firebase and external requests
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') || 
      url.hostname.includes('gstatic') ||
      !url.origin.includes(location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', request.url);
          return response;
        }
        
        // Fetch from network
        console.log('[SW] Fetching from network:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return offline page for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // Return fallback for other requests
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('[SW] Processing background sync...')
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Új értesítés a Donezy-ből!',
    icon: '/imgs/icon-192x192.svg',
    badge: '/imgs/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Megnyitás',
        icon: '/imgs/icon-192x192.svg'
      },
      {
        action: 'close',
        title: 'Bezárás',
        icon: '/imgs/icon-192x192.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Donezy', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for app updates
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 