// Service Worker for Drömlyktan
const CACHE_NAME = 'dromlyktan-v2';
const STATIC_CACHE = [
  '/',
  '/manifest.json',
  '/audio/white-noise.mp3',
  '/audio/rain.mp3',
  '/audio/waves.mp3',
  '/audio/fireplace.mp3',
  '/audio/forest.mp3'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add files one by one to handle missing files gracefully
        return Promise.allSettled(
          STATIC_CACHE.map(url => 
            cache.add(url).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API routes
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // For audio files, cache them for offline use
        if (event.request.url.includes('/audio/')) {
          return fetch(event.request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              }).catch(err => console.log('Cache put failed:', err));
            }
            return response;
          }).catch(err => {
            console.log('Audio fetch failed:', err);
            return new Response('', {
              status: 200,
              headers: { 'Content-Type': 'audio/mpeg' }
            });
          });
        }
        
        return fetch(event.request).catch(err => {
          console.log('Fetch failed for:', event.request.url, err);
          // Fallback for offline
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          // Return a proper Response object
          return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
      .catch((error) => {
        console.log('Cache match failed:', error);
        return new Response('Cache Error', { 
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Background sync for story generation
self.addEventListener('sync', (event) => {
  if (event.tag === 'story-generation') {
    event.waitUntil(
      // Handle offline story generation
      self.registration.showNotification('Drömlyktan', {
        body: 'Din saga är redo att genereras när du är online igen!',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'story-ready'
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: data.tag || 'dromlyktan-notification',
      actions: [
        {
          action: 'open',
          title: 'Öppna Drömlyktan'
        },
        {
          action: 'dismiss',
          title: 'Stäng'
        }
      ],
      requireInteraction: true
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Drömlyktan', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
