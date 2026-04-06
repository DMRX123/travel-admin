// lib/supabase.js - COMPLETE UPDATED VERSION
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'maa-saraswati-auth-token',
  },
});

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

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

// ==================== RIDE STREAK ====================
export const updateRideStreak = async (userId) => {
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

// ==================== CREATE RIDE REQUEST ====================
export const createRideRequest = async (rideId, vehicleType, pickupLat, pickupLng) => {
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
      
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
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
    
    return { success: true, driversNotified: drivers.length };
  } catch (error) {
    console.error('Create ride request error:', error);
    return { success: false, message: error.message };
  }
};

// ==================== COMPLETE RIDE WITH COMMISSION ====================
export const completeRide = async (rideId, driverId, paymentId = null) => {
  try {
    const { data: ride } = await supabase
      .from('rides')
      .select('fare, distance')
      .eq('id', rideId)
      .single();
    
    const commissionRate = await getCommissionRate();
    const commission = (ride.fare * commissionRate) / 100;
    const driverEarning = ride.fare - commission;
    
    const { error: updateError } = await supabase
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
    
    if (updateError) throw updateError;
    
    await supabase.rpc('update_driver_earnings', {
      p_driver_id: driverId,
      p_amount: driverEarning
    });
    
    await supabase
      .from('payment_transactions')
      .insert({
        ride_id: rideId,
        driver_id: driverId,
        amount: ride.fare,
        commission,
        driver_amount: driverEarning,
        payment_method: 'qr',
        payment_id: paymentId,
        status: 'completed',
        settled_at: new Date().toISOString(),
      });
    
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

// ==================== CANCEL RIDE WITH REFUND ====================
export const cancelRide = async (rideId, userId, reason, cancelledBy = 'user') => {
  try {
    const { data: ride } = await supabase
      .from('rides')
      .select('fare, status, created_at')
      .eq('id', rideId)
      .single();
    
    if (ride.status === 'completed') {
      return { success: false, message: 'Cannot cancel completed ride' };
    }
    
    const { data: settings } = await supabase
      .from('system_settings')
      .select('cancellation_fee, free_cancellation_minutes')
      .single();
    
    const rideAge = Date.now() - new Date(ride.created_at).getTime();
    const freeCancellationMs = (settings.free_cancellation_minutes || 5) * 60 * 1000;
    
    let refundAmount = 0;
    let cancellationFee = 0;
    
    if (rideAge <= freeCancellationMs) {
      refundAmount = ride.fare;
      cancellationFee = 0;
    } else {
      cancellationFee = settings.cancellation_fee || 50;
      refundAmount = ride.fare - cancellationFee;
    }
    
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        refund_amount: refundAmount,
        refund_status: refundAmount > 0 ? 'pending' : 'none',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', rideId);
    
    if (updateError) throw updateError;
    
    if (refundAmount > 0) {
      await supabase.from('refunds').insert({
        ride_id: rideId,
        user_id: userId,
        amount: refundAmount,
        reason: reason,
        status: 'pending',
      });
    }
    
    if (ride.driver_id) {
      await supabase
        .from('drivers')
        .update({ is_online: true, current_ride_id: null })
        .eq('id', ride.driver_id);
    }
    
    return { success: true, refundAmount, cancellationFee };
  } catch (error) {
    console.error('Cancel ride error:', error);
    return { success: false };
  }
};

// ==================== SEND EMAIL OTP ====================
export const sendEmailOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  
  await supabase
    .from('email_verifications')
    .insert({ email, otp, expires_at: expiresAt });
  
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: 'Email Verification - Maa Saraswati Travels',
      type: 'email_verification',
      data: { otp }
    }),
  }).catch(() => {});
  
  return { success: true };
};

// ==================== VERIFY EMAIL OTP ====================
export const verifyEmailOTP = async (email, otp) => {
  const { data } = await supabase
    .from('email_verifications')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (!data) {
    return { success: false, message: 'Invalid or expired OTP' };
  }
  
  await supabase
    .from('email_verifications')
    .update({ verified: true })
    .eq('id', data.id);
  
  return { success: true };
};

// ==================== GENERATE DRIVER QR CODE ====================
export const generateDriverQRCode = async (driverId, upiId) => {
  const qrData = JSON.stringify({
    driverId,
    upiId,
    merchant: 'Maa Saraswati Travels',
    note: 'Ride Payment'
  });
  
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  
  await supabase
    .from('drivers')
    .update({ qr_code: qrCode, upi_id: upiId })
    .eq('id', driverId);
  
  return qrCode;
};

// ==================== GET AVAILABLE VEHICLES ====================
export const getAvailableVehicles = async () => {
  const { data } = await supabase
    .from('vehicle_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (data && data.length > 0) return data;
  return Object.values(VEHICLE_TYPES);
};

// ==================== API PROTECTION ====================
export const protectAPI = async (req, res, requireAdmin = true) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }
    
    if (requireAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      if (profile?.user_type !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return null;
      }
    }
    
    return user;
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
};

// ==================== GET CURRENT USER ====================
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

export default supabase;