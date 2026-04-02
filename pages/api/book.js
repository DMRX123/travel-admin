import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract data from request body
    const { 
      pickup, 
      drop, 
      vehicle, 
      fare, 
      distance, 
      name, 
      phone, 
      paymentMethod,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      tripType = 'oneway',
      days = 1,
      stops = []
    } = req.body;

    // Validate required fields
    if (!pickup || !drop || !fare || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: pickup, drop, fare, and phone are required' 
      });
    }

    // Generate 6-digit OTP for ride verification
    const rideOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Find or create user
    let userId;
    
    // Check if user already exists
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      // User exists, use existing ID
      userId = existingUser.id;
      
      // Update user name if changed
      await supabaseAdmin
        .from('profiles')
        .update({ 
          full_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabaseAdmin
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
      
      if (userError) throw userError;
      userId = newUser.id;
    }

    // Create ride in database
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .insert({
        user_id: userId,
        pickup_address: pickup,
        drop_address: drop,
        pickup_lat: pickupLat || null,
        pickup_lng: pickupLng || null,
        drop_lat: dropLat || null,
        drop_lng: dropLng || null,
        vehicle_type: vehicle,
        fare: parseFloat(fare),
        distance: parseFloat(distance),
        payment_method: paymentMethod || 'cash',
        payment_status: 'pending',
        status: 'pending',
        trip_type: tripType,
        days: days,
        stops: stops,
        otp_code: rideOtp,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (rideError) throw rideError;

    // Send push notification to admin (optional - won't break if fails)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://travel-admin.vercel.app'}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          title: '🚕 New Ride Booking',
          body: `${name} booked a ${vehicle} from ${pickup.substring(0, 30)}`,
          data: { rideId: ride.id, type: 'new_ride' }
        }),
      });
    } catch (notifyError) {
      console.error('Notification error (non-critical):', notifyError.message);
    }

    // Send email confirmation (optional - won't break if fails)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://travel-admin.vercel.app'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          subject: 'Booking Confirmation - Maa Saraswati Travels',
          type: 'booking_confirmation',
          bookingDetails: {
            bookingId: ride.id,
            pickup,
            drop,
            vehicle,
            fare,
            distance,
            rideOtp
          }
        }),
      });
    } catch (emailError) {
      console.error('Email error (non-critical):', emailError.message);
    }

    // Return success response
    res.status(200).json({
      success: true,
      bookingId: ride.id,
      message: 'Booking created successfully',
      requiresOtp: true
    });
    
  } catch (error) {
    console.error('Booking API error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create booking',
      success: false 
    });
  }
}