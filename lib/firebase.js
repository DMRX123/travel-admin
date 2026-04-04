// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let database = null;

if (typeof window !== 'undefined') {
  try {
    database = getDatabase(app);
  } catch (error) {
    console.error('Firebase database init error:', error);
  }
}

// Update driver location
export const updateDriverLocation = async (driverId, lat, lng, bearing = 0) => {
  if (!database) return;
  
  const driverRef = ref(database, `drivers/${driverId}`);
  await update(driverRef, {
    location: { lat, lng, bearing, timestamp: Date.now() },
    lastUpdate: Date.now(),
    isOnline: true,
  });
};

// Track driver location
export const trackDriverLocation = (driverId, onLocationUpdate) => {
  if (!database) return () => {};
  
  const locationRef = ref(database, `drivers/${driverId}/location`);
  const unsubscribe = onValue(locationRef, (snapshot) => {
    const location = snapshot.val();
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  });
  
  return unsubscribe;
};

// Track ride status
export const trackRide = (rideId, onStatusUpdate) => {
  if (!database) return () => {};
  
  const rideRef = ref(database, `rides/${rideId}`);
  const unsubscribe = onValue(rideRef, (snapshot) => {
    const rideData = snapshot.val();
    if (rideData && onStatusUpdate) {
      onStatusUpdate(rideData);
    }
  });
  
  return unsubscribe;
};

// Update ride status
export const updateRideStatus = async (rideId, status, additionalData = {}) => {
  if (!database) return;
  
  const rideRef = ref(database, `rides/${rideId}`);
  await update(rideRef, {
    status,
    ...additionalData,
    updatedAt: Date.now(),
  });
};

// Create ride tracking
export const createRideTracking = async (rideId, rideData) => {
  if (!database) return;
  
  const rideRef = ref(database, `rides/${rideId}`);
  await set(rideRef, {
    ...rideData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending',
  });
};

// Get nearby drivers
export const getNearbyDrivers = async (lat, lng, radiusKm = 1.5) => {
  if (!database) return [];
  
  const driversRef = ref(database, 'drivers');
  const snapshot = await get(driversRef);
  const drivers = snapshot.val();
  
  if (!drivers) return [];
  
  const nearby = [];
  for (const [id, driver] of Object.entries(drivers)) {
    if (driver.location && driver.isOnline && driver.status === 'online') {
      const distance = calculateDistance(lat, lng, driver.location.lat, driver.location.lng);
      if (distance <= radiusKm) {
        nearby.push({ id, ...driver, distance: distance.toFixed(1) });
      }
    }
  }
  
  return nearby.sort((a, b) => a.distance - b.distance);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export { database };
export default app;