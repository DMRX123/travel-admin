import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pickup, drop, vehicle, fare, distance, name, phone, paymentMethod } = req.body;

    if (!pickup || !drop || !fare) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user if not exists (simplified)
    let userId = null;
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create temporary user
      const { data: newUser } = await supabase
        .from('profiles')
        .insert({
          full_name: name,
          phone: phone,
          user_type: 'user',
          is_verified: true,
        })
        .select()
        .single();
      userId = newUser.id;
    }

    // Create ride
    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        user_id: userId,
        pickup_address: pickup,
        drop_address: drop,
        vehicle_type: vehicle,
        fare: fare,
        distance: distance,
        payment_method: paymentMethod,
        status: 'pending',
        otp_code: Math.floor(1000 + Math.random() * 9000).toString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to drivers (simplified - in production, use push notifications)
    console.log('New ride created:', ride.id);

    res.status(200).json({
      success: true,
      bookingId: ride.id,
      message: 'Booking confirmed!',
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
}