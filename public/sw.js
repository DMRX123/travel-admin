// public/sw.js - FINAL 10/10 PWA SERVICE WORKER
const CACHE_NAME = 'maa-saraswati-travels-v4';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png'
];

const API_ROUTES = [
  '/api/',
  '/api/auth/',
  '/api/booking/',
  '/api/driver/location',
  '/api/send-otp',
  '/api/verify-otp'
];

const EXTERNAL_URLS = [
  'supabase.co',
  'firebaseio.com',
  'maps.googleapis.com',
  'razorpay.com'
];

const shouldSkipCache = (url) => {
  if (API_ROUTES.some(route => url.includes(route))) return true;
  if (EXTERNAL_URLS.some(domain => url.includes(domain))) return true;
  return false;
};

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network First with offline fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  if (shouldSkipCache(request.url)) return;
  
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        
        if (request.mode === 'navigate') {
          return caches.match('/offline');
        }
        
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Maa Saraswati Travels', body: event.data.text() };
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'general',
    renotify: false,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Maa Saraswati Travels', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  let urlToOpen = '/';
  const notificationData = event.notification.data || {};
  
  if (notificationData.rideId) {
    urlToOpen = `/track-ride?id=${notificationData.rideId}`;
  } else if (notificationData.bookingId) {
    urlToOpen = `/booking-success?id=${notificationData.bookingId}`;
  } else if (notificationData.url) {
    urlToOpen = notificationData.url;
  } else if (event.action === 'open') {
    urlToOpen = '/dashboard';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-rides') {
    event.waitUntil(syncRides());
  }
});

async function syncRides() {
  console.log('Background sync triggered');
  // Implement offline queue sync here if needed
}