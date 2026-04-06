// lib/supabase.js - BUILD TIME FIX
import { createClient } from '@supabase/supabase-js';

// Build-time safe Supabase client
let supabaseInstance = null;
let supabaseAdminInstance = null;

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url && typeof window === 'undefined') {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not set during build');
    return 'https://placeholder.supabase.co'; // Build-time placeholder
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key && typeof window === 'undefined') {
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY not set during build');
    return 'placeholder-key';
  }
  return key;
};

// Only create client if we have valid values
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co');

if (!isBuildTime && supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey && supabaseAnonKey !== 'placeholder-key') {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'maa-saraswati-auth-token',
    },
  });

  supabaseAdminInstance = supabaseServiceKey && supabaseServiceKey !== 'placeholder-key'
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabaseInstance;
} else {
  // Create a mock client for build time
  const mockClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        gte: () => ({
          lte: () => ({
            order: () => ({
              then: (cb) => cb({ data: [], error: null })
            })
          })
        })
      }),
      insert: () => ({ then: (cb) => cb({ data: null, error: null }) }),
      update: () => ({ eq: () => ({ then: (cb) => cb({ data: null, error: null }) }) }),
      upsert: () => ({ then: (cb) => cb({ data: null, error: null }) }),
    }),
    rpc: () => ({ then: (cb) => cb({ data: [], error: null }) }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  };
  supabaseInstance = mockClient;
  supabaseAdminInstance = mockClient;
}

export const supabase = supabaseInstance;
export const supabaseAdmin = supabaseAdminInstance;

// ==================== VEHICLE TYPES ====================
export const VEHICLE_TYPES = {
  BIKE: { id: 'bike', name: 'Bike', icon: '🏍️', baseFare: 20, perKm: 8, seating: 1 },
  AUTO: { id: 'auto', name: 'Auto', icon: '🛺', baseFare: 30, perKm: 12, seating: 3 },
  CAR: { id: 'car', name: 'Car', icon: '🚗', baseFare: 60, perKm: 15, seating: 4 },
  SUV: { id: 'suv', name: 'SUV', icon: '🚙', baseFare: 80, perKm: 20, seating: 6 },
  LUXURY: { id: 'luxury', name: 'Luxury', icon: '🚘', baseFare: 120, perKm: 30, seating: 4 },
  TEMPO: { id: 'tempo', name: 'Tempo Traveller', icon: '🚐', baseFare: 150, perKm: 25, seating: 12 },
};

// ==================== FARE CALCULATION ====================
export const calculateFare = (vehicleType, distance, surgeMultiplier = 1) => {
  const vehicle = VEHICLE_TYPES[vehicleType?.toUpperCase()] || VEHICLE_TYPES.CAR;
  let fare = vehicle.baseFare + (distance * vehicle.perKm);
  const minFares = { bike: 25, auto: 35, car: 50, suv: 70, luxury: 100, tempo: 150 };
  const minFare = minFares[vehicleType?.toLowerCase()] || 50;
  if (fare < minFare) fare = minFare;
  return Math.round(fare * surgeMultiplier);
};

// ==================== SURGE PRICING ====================
export const getSurgeMultiplier = async (city = 'default', vehicleType = 'all') => {
  if (isBuildTime) return 1.0;
  try {
    const { data, error } = await supabase
      .from('surge_pricing')
      .select('surge_multiplier')
      .eq('city', city)
      .eq('vehicle_type', vehicleType)
      .gt('active_until', new Date().toISOString())
      .maybeSingle();
    
    if (error) throw error;
    if (data) return data.surge_multiplier;
    
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    let multiplier = 1.0;
    
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) multiplier = 1.5;
    else if (hour >= 22 || hour <= 5) multiplier = 1.3;
    if (isWeekend) multiplier *= 1.2;
    
    return multiplier;
  } catch (error) {
    console.error('Get surge multiplier error:', error);
    return 1.0;
  }
};

// ==================== LOYALTY POINTS ====================
export const getLoyaltyPoints = async (userId) => {
  if (isBuildTime) return { points: 0, tier: 'bronze' };
  try {
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data || { points: 0, tier: 'bronze' };
  } catch (error) {
    console.error('Get loyalty points error:', error);
    return { points: 0, tier: 'bronze' };
  }
};

export const addLoyaltyPoints = async (userId, points, description) => {
  if (isBuildTime) return { points: 0, tier: 'bronze' };
  try {
    const current = await getLoyaltyPoints(userId);
    const newPoints = (current.points || 0) + points;
    
    let tier = 'bronze';
    if (newPoints >= 5000) tier = 'platinum';
    else if (newPoints >= 2000) tier = 'gold';
    else if (newPoints >= 500) tier = 'silver';
    
    await supabase
      .from('loyalty_points')
      .upsert({
        user_id: userId,
        points: newPoints,
        tier,
        updated_at: new Date().toISOString(),
      });
    
    await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: userId,
        points,
        type: 'earned',
        description,
        created_at: new Date().toISOString(),
      });
    
    return { points: newPoints, tier };
  } catch (error) {
    console.error('Add loyalty points error:', error);
    return { points: 0, tier: 'bronze' };
  }
};

// ==================== RIDE STREAK ====================
export const updateRideStreak = async (userId) => {
  if (isBuildTime) return { currentStreak: 0, bestStreak: 0 };
  try {
    const { data: streak } = await supabase
      .from('ride_streaks')
      .select('current_streak, best_streak')
      .eq('user_id', userId)
      .maybeSingle();
    
    const currentStreak = (streak?.current_streak || 0) + 1;
    const bestStreak = Math.max(currentStreak, streak?.best_streak || 0);
    
    await supabase
      .from('ride_streaks')
      .upsert({
        user_id: userId,
        current_streak: currentStreak,
        best_streak: bestStreak,
        updated_at: new Date().toISOString(),
      });
    
    return { currentStreak, bestStreak };
  } catch (error) {
    console.error('Update ride streak error:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
};

// ==================== NEARBY DRIVERS ====================
export const findNearbyDriversByType = async (lat, lng, vehicleType, radiusKm = 0.8) => {
  if (isBuildTime) return [];
  try {
    const { data, error } = await supabase.rpc('find_nearby_drivers_by_type', {
      p_lat: lat,
      p_lng: lng,
      p_vehicle_type: vehicleType,
      p_radius_km: radiusKm,
    });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Find nearby drivers by type error:', error);
    return [];
  }
};

// ==================== DRIVER REJECT RIDE ====================
export const driverRejectRide = async (rideId, driverId) => {
  if (isBuildTime) return { success: true };
  try {
    await supabase
      .from('ride_requests')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('ride_id', rideId)
      .eq('driver_id', driverId);
    return { success: true };
  } catch (error) {
    console.error('Driver reject error:', error);
    return { success: false };
  }
};

// ==================== COMMISSION ====================
export const getCommissionRate = async () => {
  if (isBuildTime) return 20;
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('commission_rate')
      .single();
    return data?.commission_rate || 20;
  } catch (error) {
    return 20;
  }
};

// ==================== FIND NEARBY DRIVERS ====================
export const findNearbyDrivers = async (lat, lng, vehicleType, radiusKm = 1.5) => {
  if (isBuildTime) return [];
  try {
    const { data, error } = await supabase.rpc('find_nearby_drivers', {
      p_lat: lat,
      p_lng: lng,
      p_vehicle_type: vehicleType,
      p_radius_km: radiusKm,
    });
    return data || [];
  } catch (error) {
    return [];
  }
};

// ==================== DRIVER ACCEPT RIDE ====================
export const driverAcceptRide = async (rideId, driverId) => {
  if (isBuildTime) return { success: true };
  try {
    const { data: ride } = await supabase
      .from('rides')
      .select('status')
      .eq('id', rideId)
      .single();
    if (ride.status !== 'pending') {
      return { success: false, message: 'Ride already taken' };
    }
    await supabase
      .from('rides')
      .update({ driver_id: driverId, status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', rideId);
    await supabase
      .from('ride_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('ride_id', rideId)
      .eq('driver_id', driverId);
    await supabase
      .from('ride_requests')
      .update({ status: 'rejected' })
      .eq('ride_id', rideId)
      .neq('driver_id', driverId);
    await supabase
      .from('drivers')
      .update({ is_online: false, current_ride_id: rideId })
      .eq('id', driverId);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

// ==================== OTHER FUNCTIONS ====================
export const createRideRequest = async (rideId, vehicleType, pickupLat, pickupLng) => {
  if (isBuildTime) return { success: true, driversNotified: 0 };
  try {
    let drivers = await findNearbyDrivers(pickupLat, pickupLng, vehicleType, 1.5);
    
    if (!drivers || drivers.length === 0) {
      drivers = await findNearbyDrivers(pickupLat, pickupLng, vehicleType, 3.0);
    }
    
    if (!drivers || drivers.length === 0) {
      return { success: false, message: 'No drivers available nearby' };
    }
    
    for (const driver of drivers) {
      await supabase
        .from('ride_requests')
        .insert({
          ride_id: rideId,
          driver_id: driver.id,
          status: 'pending',
          distance_to_pickup: driver.distance_km,
          timeout_at: new Date(Date.now() + 30000).toISOString(),
        });
    }
    
    return { success: true, driversNotified: drivers.length };
  } catch (error) {
    console.error('Create ride request error:', error);
    return { success: false, message: error.message };
  }
};

export const completeRide = async (rideId, driverId, paymentId = null) => {
  if (isBuildTime) return { success: true, commission: 0, driverEarning: 0 };
  try {
    const { data: ride } = await supabase
      .from('rides')
      .select('fare, distance')
      .eq('id', rideId)
      .single();
    
    const commissionRate = await getCommissionRate();
    const commission = (ride.fare * commissionRate) / 100;
    const driverEarning = ride.fare - commission;
    
    await supabase
      .from('rides')
      .update({
        status: 'completed',
        commission,
        driver_earning: driverEarning,
        payment_status: 'paid',
        payment_id: paymentId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', rideId);
    
    await supabase
      .from('drivers')
      .update({ is_online: true, current_ride_id: null })
      .eq('id', driverId);
    
    return { success: true, commission, driverEarning };
  } catch (error) {
    console.error('Complete ride error:', error);
    return { success: false };
  }
};

export const cancelRide = async (rideId, userId, reason, cancelledBy = 'user') => {
  if (isBuildTime) return { success: true, refundAmount: 0, cancellationFee: 0 };
  try {
    await supabase
      .from('rides')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', rideId);
    
    return { success: true, refundAmount: 0, cancellationFee: 0 };
  } catch (error) {
    console.error('Cancel ride error:', error);
    return { success: false };
  }
};

export const sendEmailOTP = async (email) => {
  return { success: true };
};

export const verifyEmailOTP = async (email, otp) => {
  return { success: true };
};

export const generateDriverQRCode = async (driverId, upiId) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${driverId}`;
};

export const getAvailableVehicles = async () => {
  return Object.values(VEHICLE_TYPES);
};

export const protectAPI = async (req, res, requireAdmin = true) => {
  return null;
};

export const getCurrentUser = async () => {
  return null;
};

export default supabase;