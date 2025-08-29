
const CACHE_NAME = 'choptym-v1';
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
        console.log('ChopTym cache opened');
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

// Push notification support
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Your ChopTym order status has been updated!',
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-192.png',
    tag: data.tag || 'choptym-notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction !== false,
    silent: data.silent || false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Order'
      }
    ],
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ChopTym', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to orders page
    event.waitUntil(
      clients.openWindow('/?tab=orders')
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0];
          return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
