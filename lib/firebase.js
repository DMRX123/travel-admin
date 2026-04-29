// lib/firebase.js - EXCELLENT PRODUCTION READY
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get, off } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let database = null;
let isConnected = false;

// Lazy initialization for client-side only
if (typeof window !== 'undefined') {
  try {
    database = getDatabase(app);
    // Check connection
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
      isConnected = snap.val() === true;
      if (isConnected) {
        console.log('🔥 Firebase connected');
      } else {
        console.warn('🔥 Firebase disconnected');
      }
    });
  } catch (error) {
    console.error('Firebase init error:', error);
  }
}

// ==================== DRIVER LOCATION ====================
export const updateDriverLocation = async (driverId, lat, lng, bearing = 0, speed = 0) => {
  if (!database || !driverId) return false;
  
  try {
    const driverRef = ref(database, `drivers/${driverId}`);
    const locationData = {
      location: { lat: Number(lat), lng: Number(lng), bearing, speed, timestamp: Date.now() },
      lastUpdate: Date.now(),
      isOnline: true,
    };
    await update(driverRef, locationData);
    return true;
  } catch (error) {
    console.error('Update location error:', error);
    return false;
  }
};

export const trackDriverLocation = (driverId, onLocationUpdate, onError) => {
  if (!database || !driverId) return () => {};
  
  const locationRef = ref(database, `drivers/${driverId}/location`);
  const unsubscribe = onValue(locationRef, (snapshot) => {
    const location = snapshot.val();
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, (error) => {
    console.error('Location tracking error:', error);
    if (onError) onError(error);
  });
  
  // Return cleanup function
  return () => {
    off(locationRef);
    unsubscribe();
  };
};

// ==================== RIDE TRACKING ====================
export const trackRide = (rideId, onStatusUpdate) => {
  if (!database || !rideId) return () => {};
  
  const rideRef = ref(database, `rides/${rideId}`);
  const unsubscribe = onValue(rideRef, (snapshot) => {
    const rideData = snapshot.val();
    if (rideData && onStatusUpdate) {
      onStatusUpdate(rideData);
    }
  });
  
  return () => {
    off(rideRef);
    unsubscribe();
  };
};

export const updateRideStatus = async (rideId, status, additionalData = {}) => {
  if (!database || !rideId) return false;
  
  try {
    const rideRef = ref(database, `rides/${rideId}`);
    await update(rideRef, {
      status,
      ...additionalData,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Update ride status error:', error);
    return false;
  }
};

export const createRideTracking = async (rideId, rideData) => {
  if (!database || !rideId) return false;
  
  try {
    const rideRef = ref(database, `rides/${rideId}`);
    await set(rideRef, {
      ...rideData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending',
    });
    return true;
  } catch (error) {
    console.error('Create ride tracking error:', error);
    return false;
  }
};

// ==================== NEARBY DRIVERS ====================
export const getNearbyDrivers = async (lat, lng, radiusKm = 1.5) => {
  if (!database) return [];
  
  try {
    const driversRef = ref(database, 'drivers');
    const snapshot = await get(driversRef);
    const drivers = snapshot.val();
    
    if (!drivers) return [];
    
    const nearby = [];
    const now = Date.now();
    
    for (const [id, driver] of Object.entries(drivers)) {
      // Check if driver is online and location is recent (within 30 seconds)
      if (driver.location && driver.isOnline && driver.status === 'online' && (now - (driver.lastUpdate || 0) < 30000)) {
        const distance = calculateDistance(lat, lng, driver.location.lat, driver.location.lng);
        if (distance <= radiusKm) {
          nearby.push({ 
            id, 
            ...driver, 
            distance: distance.toFixed(1),
            eta: Math.ceil(distance / 30 * 60) // minutes at 30 km/h
          });
        }
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    return [];
  }
};

// ==================== HELPER FUNCTIONS ====================
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const isFirebaseConnected = () => isConnected;
export { database };
export default app;