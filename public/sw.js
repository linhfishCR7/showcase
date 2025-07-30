// Service Worker for WebApps Hub
const CACHE_NAME = 'webapps-hub-v1.0.0';
const STATIC_CACHE = 'webapps-hub-static-v1';
const DYNAMIC_CACHE = 'webapps-hub-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/img/logo.svg',
  '/img/logo.png',
  '/img/logo-192.png',
  '/manifest.json',
  
  // Expense Tracker
  '/expense-tracker/',
  '/expense-tracker/index.html',
  '/expense-tracker/css/style.css',
  '/expense-tracker/js/app.js',
  '/expense-tracker/manifest.json',
  '/expense-tracker/img/logo.svg',
  
  // Drawing Canvas
  '/digital-drawing-canvas/',
  '/digital-drawing-canvas/index.html',
  '/digital-drawing-canvas/css/style.css',
  '/digital-drawing-canvas/js/app.js',
  '/digital-drawing-canvas/manifest.json',
  '/digital-drawing-canvas/img/logo.svg',
  
  // External resources
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external domains (except CDN resources)
  if (url.origin !== location.origin && !url.href.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                console.log('Service Worker: Caching dynamic content', request.url);
                cache.put(request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(error => {
            console.log('Service Worker: Network failed, trying cache', error);
            
            // If it's a navigation request, return the main page
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline - Content not available', {
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

// Background sync for future features
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
    );
  }
});

// Push notifications for future features
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/img/logo-192.png',
    badge: '/img/logo-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/img/logo-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/img/logo-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('WebApps Hub', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handler
self.addEventListener('error', event => {
  console.error('Service Worker: Error', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled rejection', event.reason);
  event.preventDefault();
});

console.log('Service Worker: Script loaded');
