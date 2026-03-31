import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getDatabase, ref, set, onValue, update, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let auth = null;
let messaging = null;
let database = null;
let storage = null;
let analytics = null;

// Initialize services on client side only
if (typeof window !== 'undefined') {
  try {
    auth = getAuth(app);
    storage = getStorage(app);
    database = getDatabase(app);
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Firebase services init error:', error);
  }
  
  // Initialize Messaging
  isSupported().then((supported) => {
    if (supported && !messaging) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.error('Firebase Messaging init error:', error);
      }
    }
  });
}

// ==================== AUTHENTICATION FUNCTIONS ====================

// Setup Recaptcha for Phone Auth
export const setupRecaptcha = (containerId) => {
  if (!auth) return null;
  
  try {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
    });
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('Recaptcha setup error:', error);
    return null;
  }
};

// Send OTP via Phone Auth
export const sendPhoneOTP = async (phoneNumber, recaptchaVerifier) => {
  if (!auth || !recaptchaVerifier) {
    throw new Error('Auth not initialized');
  }
  
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

// Verify OTP
export const verifyPhoneOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    return result.user;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

// ==================== REALTIME DATABASE FUNCTIONS ====================

// Update Driver Location (Real-time)
export const updateDriverLocation = async (driverId, lat, lng, bearing = 0, speed = 0) => {
  if (!database) return;
  
  const driverRef = ref(database, `drivers/${driverId}`);
  await update(driverRef, {
    location: { lat, lng, bearing, speed },
    lastUpdate: Date.now(),
    isOnline: true,
    status: 'active',
  });
};

// Track Driver Location (Real-time)
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

// Get All Nearby Drivers (for customer)
export const getNearbyDrivers = async (lat, lng, radiusKm = 10) => {
  if (!database) return [];
  
  const driversRef = ref(database, 'drivers');
  const snapshot = await get(driversRef);
  const drivers = snapshot.val();
  
  if (!drivers) return [];
  
  // Filter nearby drivers (simplified - in production use geohash)
  const nearby = [];
  for (const [id, driver] of Object.entries(drivers)) {
    if (driver.location && driver.isOnline && driver.status === 'active') {
      const distance = calculateDistance(lat, lng, driver.location.lat, driver.location.lng);
      if (distance <= radiusKm) {
        nearby.push({
          id,
          ...driver,
          distance: distance.toFixed(1),
        });
      }
    }
  }
  
  return nearby.sort((a, b) => a.distance - b.distance);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get Driver Status
export const getDriverStatus = async (driverId) => {
  if (!database) return null;
  
  const driverRef = ref(database, `drivers/${driverId}`);
  const snapshot = await get(driverRef);
  return snapshot.val();
};

// Update Driver Online Status
export const setDriverOnline = async (driverId, isOnline) => {
  if (!database) return;
  
  const driverRef = ref(database, `drivers/${driverId}`);
  await update(driverRef, {
    isOnline: isOnline,
    lastUpdate: Date.now(),
    ...(isOnline ? {} : { location: null, status: 'offline' }),
  });
};

// Create Ride Tracking
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

// Track Ride Status
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

// Update Ride Status
export const updateRideStatus = async (rideId, status, additionalData = {}) => {
  if (!database) return;
  
  const rideRef = ref(database, `rides/${rideId}`);
  await update(rideRef, {
    status,
    ...additionalData,
    updatedAt: Date.now(),
  });
};

// Assign Driver to Ride
export const assignDriverToRide = async (rideId, driverId) => {
  if (!database) return;
  
  const rideRef = ref(database, `rides/${rideId}`);
  await update(rideRef, {
    driverId,
    status: 'accepted',
    assignedAt: Date.now(),
  });
  
  // Also update driver's current ride
  const driverRef = ref(database, `drivers/${driverId}/currentRide`);
  await set(driverRef, {
    rideId,
    assignedAt: Date.now(),
  });
};

// Complete Ride
export const completeRide = async (rideId, driverId, finalFare, distance, duration) => {
  if (!database) return;
  
  const rideRef = ref(database, `rides/${rideId}`);
  await update(rideRef, {
    status: 'completed',
    finalFare,
    distance,
    duration,
    completedAt: Date.now(),
  });
  
  // Clear driver's current ride
  const driverRef = ref(database, `drivers/${driverId}/currentRide`);
  await remove(driverRef);
  
  // Update driver stats
  const driverStatsRef = ref(database, `drivers/${driverId}/stats`);
  const snapshot = await get(driverStatsRef);
  const currentStats = snapshot.val() || { totalRides: 0, totalEarnings: 0 };
  await set(driverStatsRef, {
    totalRides: (currentStats.totalRides || 0) + 1,
    totalEarnings: (currentStats.totalEarnings || 0) + finalFare,
    lastRideAt: Date.now(),
  });
};

// Cancel Ride
export const cancelRide = async (rideId, cancelledBy, reason) => {
  if (!database) return;
  
  const rideRef = ref(database, `rides/${rideId}`);
  await update(rideRef, {
    status: 'cancelled',
    cancelledBy,
    cancellationReason: reason,
    cancelledAt: Date.now(),
  });
};

// ==================== PUSH NOTIFICATIONS FUNCTIONS ====================

// Request Notification Permission
export const requestNotificationPermission = async (userId) => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      
      if (token) {
        await fetch('/api/save-fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userId }),
        });
      }
      
      return token;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
};

// Listen for Foreground Messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// ==================== STORAGE FUNCTIONS ====================

// Upload Driver Document
export const uploadDriverDocument = async (driverId, file, documentType) => {
  if (!storage) return null;
  
  try {
    const fileRef = storageRef(storage, `drivers/${driverId}/${documentType}_${Date.now()}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    
    // Save URL to database
    await fetch('/api/driver/upload-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, documentType, url }),
    });
    
    return url;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

// Upload Vehicle Image
export const uploadVehicleImage = async (driverId, file) => {
  if (!storage) return null;
  
  try {
    const fileRef = storageRef(storage, `vehicles/${driverId}/${Date.now()}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

// ==================== ANALYTICS FUNCTIONS ====================

// Track Event
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

// Track Page View
export const trackPageView = (pagePath) => {
  if (typeof window !== 'undefined' && analytics) {
    logEvent(analytics, 'page_view', { page_path: pagePath });
  }
};

// Track Booking Event
export const trackBooking = (bookingId, amount, vehicle) => {
  trackEvent('booking_completed', {
    booking_id: bookingId,
    amount: amount,
    vehicle_type: vehicle,
  });
};

// ==================== EXPORTS ====================

export { auth, messaging, database, storage, analytics };
export default app;