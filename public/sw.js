
const CACHE_NAME = 'kwatalink-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('KwataLink cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip caching for API requests and external resources
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('fapshi.com') ||
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('emailjs.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification support (future feature)
self.addEventListener('push', (event) => {
  const options = {
            body: event.data ? event.data.text() : 'Your KwataLink order is ready!',
    icon: '/logo.png',
    badge: '/logo.png',
          tag: 'kwatalink-notification'
  };

  event.waitUntil(
    self.registration.showNotification('KwataLink', options)
  );
});
