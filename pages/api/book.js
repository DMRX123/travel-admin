import { supabase, supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      pickup, drop, vehicle, fare, distance, 
      name, phone, paymentMethod, 
      pickupCoords, dropCoords,
      tripType = 'oneway',
      days = 1,
      stops = []
    } = req.body;

    if (!pickup || !drop || !fare || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate OTP for ride verification
    const rideOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Find or create user
    let userId;
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
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

    // Create ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert({
        user_id: userId,
        pickup_address: pickup,
        drop_address: drop,
        pickup_lat: pickupCoords?.lat,
        pickup_lng: pickupCoords?.lng,
        drop_lat: dropCoords?.lat,
        drop_lng: dropCoords?.lng,
        vehicle_type: vehicle,
        fare: parseFloat(fare),
        distance: parseFloat(distance),
        payment_method: paymentMethod,
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

    // Find nearby available drivers
    let nearbyDrivers = [];
    if (pickupCoords?.lat && pickupCoords?.lng) {
      const { data: drivers } = await supabase.rpc('find_nearby_drivers', {
        lat: pickupCoords.lat,
        lng: pickupCoords.lng,
        radius_km: 10
      });
      nearbyDrivers = drivers || [];
    }

    // Notify drivers via push notifications
    for (const driver of nearbyDrivers) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: driver.id,
            title: 'New Ride Request',
            body: `New booking from ${pickup.substring(0, 30)}... Fare: ₹${fare}`,
            data: { rideId: ride.id, type: 'new_ride', fare, pickup }
          }),
        });
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
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
      console.error('Email error:', emailError);
    }

    res.status(200).json({
      success: true,
      bookingId: ride.id,
      message: 'Booking created successfully',
      requiresOtp: true
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
}