// pages/api/book.js - COMPLETE UPDATED VERSION
import { supabaseAdmin, createRideRequest, calculateFare, getSurgePricing, VEHICLE_TYPES } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      pickup, 
      drop, 
      vehicleType, 
      pickupLat, 
      pickupLng, 
      dropLat, 
      dropLng,
      distance,
      name, 
      phone, 
      email
    } = req.body;

    if (!pickup || !drop || !vehicleType || !pickupLat || !pickupLng) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    if (!VEHICLE_TYPES[vehicleType.toUpperCase()]) {
      return res.status(400).json({ error: 'Invalid vehicle type' });
    }

    // Calculate fare
    const surgeMultiplier = 1; // Get from surge_pricing table
    const fare = calculateFare(vehicleType, distance || 5, surgeMultiplier);
    
    // Generate OTP
    const rideOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Find or create user
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
        .update({ full_name: name, email: email || null })
        .eq('id', userId);
    } else {
      const { data: newUser } = await supabaseAdmin
        .from('profiles')
        .insert({
          full_name: name,
          phone: phone,
          email: email || null,
          user_type: 'user',
          is_verified: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      userId = newUser.id;
    }

    // Create ride
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .insert({
        user_id: userId,
        pickup_address: pickup,
        drop_address: drop,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        drop_lat: dropLat,
        drop_lng: dropLng,
        vehicle_type: vehicleType,
        fare: fare,
        base_fare: fare,
        surge_multiplier: surgeMultiplier,
        distance: distance || 0,
        payment_method: 'qr',
        status: 'pending',
        otp_code: rideOtp,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (rideError) throw rideError;

    // Send ride request to nearby drivers
    const requestResult = await createRideRequest(ride.id, vehicleType, pickupLat, pickupLng);
    
    res.status(200).json({
      success: true,
      bookingId: ride.id,
      fare: fare,
      otp: rideOtp,
      driversNotified: requestResult.driversNotified || 0,
      message: requestResult.message || 'Booking created, finding drivers...',
    });
    
  } catch (error) {
    console.error('Booking API error:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
}