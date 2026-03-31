import { supabaseAdmin } from '../../lib/supabase';
import { updateRideStatus } from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, driverId, pickup, drop } = req.body;

  if (!rideId || !driverId) {
    return res.status(400).json({ error: 'Missing rideId or driverId' });
  }

  try {
    // Initialize ride tracking in Firebase
    await updateRideStatus(rideId, 'accepted', {
      driverId,
      pickup,
      drop,
      startedAt: Date.now(),
      status: 'accepted'
    });

    // Update ride in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('rides')
      .update({ 
        status: 'accepted',
        driver_id: driverId,
        accepted_at: new Date().toISOString()
      })
      .eq('id', rideId);

    if (updateError) throw updateError;

    // Get user info for notification
    const { data: ride } = await supabaseAdmin
      .from('rides')
      .select('user_id, pickup_address')
      .eq('id', rideId)
      .single();

    if (ride?.user_id) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ride.user_id,
          title: 'Driver Assigned',
          body: `Your driver has been assigned for pickup at ${ride.pickup_address?.substring(0, 30)}`,
          data: { rideId, type: 'ride_accepted' }
        }),
      });
    }

    res.status(200).json({ success: true, message: 'Ride tracking initialized' });
  } catch (error) {
    console.error('Init ride tracking error:', error);
    res.status(500).json({ error: 'Failed to initialize ride tracking' });
  }
}