// pages/api/book.js - COMPLETE WITH VALIDATION & RATE LIMITING
import { supabaseAdmin, createRideRequest, calculateFare, VEHICLE_TYPES } from '../../lib/supabase';
import { validateBookingRequest, isValidCoordinates, isValidDistance, isValidVehicleType } from '../../lib/validators';
import { withRateLimit } from '../../lib/rate-limit';
import { getCached, invalidateCache } from '../../lib/cache';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    pickup, drop, vehicleType, pickupLat, pickupLng, 
    dropLat, dropLng, distance, name, phone, paymentMethod
  } = req.body;

  // ========== INPUT VALIDATION ==========
  const validation = validateBookingRequest({
    name, phone, vehicleType, pickupLat, pickupLng, 
    dropLat, dropLng, distance, paymentMethod
  });

  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Additional validations
  if (!pickup || pickup.length < 5 || pickup.length > 500) {
    return res.status(400).json({ error: 'Invalid pickup address' });
  }

  if (!drop || drop.length < 5 || drop.length > 500) {
    return res.status(400).json({ error: 'Invalid drop address' });
  }

  if (!VEHICLE_TYPES[vehicleType.toUpperCase()]) {
    return res.status(400).json({ error: 'Invalid vehicle type' });
  }

  // ========== FARE CALCULATION ==========
  const surgeMultiplier = await getCached(`surge:default:${vehicleType}`, 
    () => getSurgeMultiplier('default', vehicleType), 60
  );
  
  const fare = calculateFare(vehicleType, distance || 5, surgeMultiplier);
  
  // Validate fare is reasonable
  if (fare <= 0 || fare > 50000) {
    return res.status(400).json({ error: 'Invalid fare calculated' });
  }

  // Generate OTP
  const rideOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // ========== FIND OR CREATE USER ==========
  let userId;
  const { data: existingUser } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existingUser) {
    userId = existingUser.id;
    await supabaseAdmin
      .from('profiles')
      .update({ full_name: name, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } else {
    const { data: newUser } = await supabaseAdmin
      .from('profiles')
      .insert({
        full_name: name,
        phone: phone,
        user_type: 'user',
        is_verified: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    userId = newUser.id;
  }

  // ========== CREATE RIDE ==========
  const { data: ride, error: rideError } = await supabaseAdmin
    .from('rides')
    .insert({
      user_id: userId,
      pickup_address: pickup,
      drop_address: drop,
      pickup_lat: parseFloat(pickupLat),
      pickup_lng: parseFloat(pickupLng),
      drop_lat: parseFloat(dropLat),
      drop_lng: parseFloat(dropLng),
      vehicle_type: vehicleType,
      fare: fare,
      base_fare: fare,
      surge_multiplier: surgeMultiplier,
      distance: parseFloat(distance) || 0,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
      status: 'pending',
      otp_code: rideOtp,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (rideError) {
    console.error('Ride creation error:', rideError);
    return res.status(500).json({ error: 'Failed to create booking' });
  }

  // ========== SEND RIDE REQUEST TO DRIVERS ==========
  const requestResult = await createRideRequest(ride.id, vehicleType, parseFloat(pickupLat), parseFloat(pickupLng));

  // ========== INVALIDATE CACHE ==========
  invalidateCache(`rides:user:${userId}`);
  invalidateCache(`rides:pending:*`);

  // ========== RESPONSE ==========
  res.status(200).json({
    success: true,
    bookingId: ride.id,
    fare: fare,
    otp: rideOtp,
    surgeMultiplier: surgeMultiplier,
    driversNotified: requestResult.driversNotified || 0,
    message: requestResult.message || 'Booking created, finding drivers...',
  });
}

// Helper function (import or define)
async function getSurgeMultiplier(city, vehicleType) {
  // Simple implementation - can be expanded
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  let multiplier = 1.0;
  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) multiplier = 1.5;
  else if (hour >= 22 || hour <= 5) multiplier = 1.3;
  if (isWeekend) multiplier *= 1.2;
  return multiplier;
}

export default withRateLimit(handler, { limit: 5, windowMs: 60000 });