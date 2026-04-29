// lib/supabase.js - PERFECT PRODUCTION READY VERSION
import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURATION
// =====================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// =====================================================
// SUPABASE CLIENTS
// =====================================================

// Client-side client (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'maa-saraswati-auth-token',
  },
  global: {
    headers: { 'x-application-name': 'maa-saraswati-travels' },
  },
});

// Admin client (server-side only)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase;

// =====================================================
// VEHICLE TYPES - MASTER DATA
// =====================================================
export const VEHICLE_TYPES = {
  BIKE: { id: 'bike', name: 'Bike', icon: '🏍️', baseFare: 20, perKm: 8, seating: 1, luggage: 'Small bag', estTime: '5-8 min' },
  AUTO: { id: 'auto', name: 'Auto', icon: '🛺', baseFare: 30, perKm: 12, seating: 3, luggage: '2 bags', estTime: '5-10 min' },
  SEDAN: { id: 'sedan', name: 'Sedan', icon: '🚗', baseFare: 60, perKm: 15, seating: 4, luggage: '3 bags', estTime: '3-8 min' },
  SUV: { id: 'suv', name: 'SUV', icon: '🚙', baseFare: 80, perKm: 20, seating: 6, luggage: '4 bags', estTime: '5-10 min' },
  LUXURY: { id: 'luxury', name: 'Luxury', icon: '🚘', baseFare: 120, perKm: 30, seating: 4, luggage: '4 bags', estTime: '8-12 min' },
  TEMPO: { id: 'tempo', name: 'Tempo Traveller', icon: '🚐', baseFare: 150, perKm: 25, seating: 12, luggage: '8 bags', estTime: '10-15 min' },
};

// =====================================================
// FARE CALCULATION
// =====================================================
export const calculateFare = (vehicleType, distanceKm, surgeMultiplier = 1) => {
  // Get vehicle or default to sedan
  const vehicle = VEHICLE_TYPES[vehicleType?.toUpperCase()] || VEHICLE_TYPES.SEDAN;
  
  // Calculate base fare
  let fare = vehicle.baseFare + (distanceKm * vehicle.perKm);
  
  // Apply minimum fare
  const minFares = { bike: 25, auto: 35, sedan: 50, suv: 70, luxury: 100, tempo: 150 };
  const minFare = minFares[vehicleType?.toLowerCase()] || 50;
  if (fare < minFare) fare = minFare;
  
  // Apply surge and round to nearest ₹5
  fare = Math.ceil((fare * surgeMultiplier) / 5) * 5;
  
  return Math.round(fare);
};

// =====================================================
// SURGE PRICING
// =====================================================
export const getSurgeMultiplier = async (city = 'default', vehicleType = 'all') => {
  try {
    // Check database for active surge
    const { data, error } = await supabase
      .from('surge_pricing')
      .select('surge_multiplier')
      .eq('city', city)
      .eq('vehicle_type', vehicleType)
      .gt('active_until', new Date().toISOString())
      .maybeSingle();
    
    if (!error && data) return data.surge_multiplier;
    
    // Dynamic surge based on time
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    let multiplier = 1.0;
    
    // Peak hours: 8-10 AM, 6-8 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) multiplier = 1.5;
    // Late night: 11 PM - 5 AM
    else if (hour >= 23 || hour <= 5) multiplier = 1.4;
    // Evening rush: 5-6 PM
    else if (hour >= 17 && hour < 18) multiplier = 1.2;
    
    // Weekend surcharge
    if (isWeekend) multiplier *= 1.1;
    
    return Math.round(multiplier * 10) / 10;
  } catch (error) {
    console.error('Get surge error:', error);
    return 1.0;
  }
};

// =====================================================
// NEARBY DRIVERS
// =====================================================
export const findNearbyDriversByType = async (lat, lng, vehicleType, radiusKm = 0.8) => {
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
    console.error('Find nearby drivers error:', error);
    return [];
  }
};

// =====================================================
// CREATE RIDE REQUEST
// =====================================================
export const createRideRequest = async (rideId, vehicleType, pickupLat, pickupLng) => {
  try {
    // Try expanding radius progressively
    let drivers = await findNearbyDriversByType(pickupLat, pickupLng, vehicleType, 1.5);
    if (!drivers?.length) drivers = await findNearbyDriversByType(pickupLat, pickupLng, vehicleType, 3.0);
    if (!drivers?.length) drivers = await findNearbyDriversByType(pickupLat, pickupLng, vehicleType, 5.0);
    
    if (!drivers?.length) {
      return { success: false, message: 'No drivers available nearby. Please try again.' };
    }
    
    // Sort by acceptance rate (higher first)
    drivers.sort((a, b) => (b.acceptance_rate || 0) - (a.acceptance_rate || 0));
    
    const notifiedDrivers = [];
    
    for (const driver of drivers.slice(0, 10)) {
      // Check if already requested
      const { data: existing } = await supabase
        .from('ride_requests')
        .select('id')
        .eq('ride_id', rideId)
        .eq('driver_id', driver.id)
        .maybeSingle();
      
      if (!existing) {
        await supabase
          .from('ride_requests')
          .insert({
            ride_id: rideId,
            driver_id: driver.id,
            status: 'pending',
            distance_to_pickup: driver.distance_km,
            timeout_at: new Date(Date.now() + 45000).toISOString(),
            created_at: new Date().toISOString(),
          });
        
        notifiedDrivers.push(driver.id);
        
        // Send push notification (non-blocking)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: driver.id,
            title: '🚕 New Ride Request',
            body: `${driver.distance_km.toFixed(1)} km away • ${vehicleType.toUpperCase()}`,
            data: { rideId, type: 'new_ride', distance: driver.distance_km }
          }),
        }).catch(() => {});
      }
    }
    
    return { success: true, driversNotified: notifiedDrivers.length };
  } catch (error) {
    console.error('Create ride request error:', error);
    return { success: false, message: error.message };
  }
};

// =====================================================
// DRIVER ACCEPT RIDE
// =====================================================
export const driverAcceptRide = async (rideId, driverId) => {
  try {
    const { data, error } = await supabase.rpc('accept_ride_request', {
      p_ride_id: rideId,
      p_driver_id: driverId,
    });
    
    if (error) throw error;
    if (data === false) return { success: false, message: 'Ride already taken' };
    
    // Send notification to user
    const { data: ride } = await supabase
      .from('rides')
      .select('user_id, otp_code')
      .eq('id', rideId)
      .single();
    
    if (ride?.user_id) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ride.user_id,
          title: '✅ Driver Assigned',
          body: `Your driver is on the way. OTP: ${ride.otp_code}`,
          data: { rideId, type: 'driver_assigned', otp: ride.otp_code }
        }),
      }).catch(() => {});
    }
    
    return { success: true };
  } catch (error) {
    console.error('Driver accept error:', error);
    return { success: false };
  }
};

// =====================================================
// DRIVER REJECT RIDE
// =====================================================
export const driverRejectRide = async (rideId, driverId) => {
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

// =====================================================
// LOYALTY POINTS
// =====================================================
export const getLoyaltyPoints = async (userId) => {
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

// =====================================================
// COMMISSION RATE
// =====================================================
export const getCommissionRate = async () => {
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

// =====================================================
// AVAILABLE VEHICLES
// =====================================================
export const getAvailableVehicles = async () => {
  try {
    const { data } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (data?.length) return data;
    return Object.values(VEHICLE_TYPES);
  } catch (error) {
    return Object.values(VEHICLE_TYPES);
  }
};

// =====================================================
// SYSTEM SETTINGS
// =====================================================
export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    return {
      base_fare: 50,
      per_km_rate: 15,
      cancellation_fee: 50,
      commission_rate: 20,
    };
  }
};

// =====================================================
// RIDE STREAK
// =====================================================
export const updateRideStreak = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const { data: yesterdayRide } = await supabase
      .from('rides')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', yesterday)
      .maybeSingle();
    
    const { data: streak } = await supabase
      .from('ride_streaks')
      .select('current_streak, best_streak')
      .eq('user_id', userId)
      .maybeSingle();
    
    let currentStreak = streak?.current_streak || 0;
    let bestStreak = streak?.best_streak || 0;
    
    if (yesterdayRide) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    
    if (currentStreak > bestStreak) bestStreak = currentStreak;
    
    await supabase
      .from('ride_streaks')
      .upsert({
        user_id: userId,
        current_streak: currentStreak,
        best_streak: bestStreak,
        last_ride_date: today,
        updated_at: new Date().toISOString(),
      });
    
    return { currentStreak, bestStreak };
  } catch (error) {
    console.error('Update streak error:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
};

// =====================================================
// EXPORT DEFAULT
// =====================================================
export default supabase;