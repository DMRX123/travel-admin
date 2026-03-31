// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging-compat.js');

// Firebase Configuration
firebase.initializeApp({
  apiKey: 'AIzaSyCe6hpFukB-0TjBG-En6Y45aN9N-xNqPus',
  authDomain: 'msttt-eb3f4.firebaseapp.com',
  databaseURL: 'https://msttt-eb3f4-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'msttt-eb3f4',
  storageBucket: 'msttt-eb3f4.firebasestorage.app',
  messagingSenderId: '957570514839',
  appId: '1:957570514839:web:2f4d1b618f653513324ed2',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Maa Saraswati Travels';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let urlToOpen = '/';
  
  if (event.notification.data?.rideId) {
    urlToOpen = `/track-ride?id=${event.notification.data.rideId}`;
  } else if (event.notification.data?.bookingId) {
    urlToOpen = `/booking-success?id=${event.notification.data.bookingId}`;
  } else if (event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
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