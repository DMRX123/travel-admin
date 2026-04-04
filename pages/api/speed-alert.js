// pages/api/speed-alert.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, driverId, speed, lat, lng } = req.body;
  const SPEED_LIMIT = 60; // km/h

  if (speed > SPEED_LIMIT) {
    // Log speed alert
    await supabaseAdmin.from('speed_alerts').insert({
      ride_id: rideId,
      driver_id: driverId,
      speed: speed,
      speed_limit: SPEED_LIMIT,
      location_lat: lat,
      location_lng: lng,
      created_at: new Date().toISOString(),
    });

    // Get user ID for this ride
    const { data: ride } = await supabaseAdmin
      .from('rides')
      .select('user_id')
      .eq('id', rideId)
      .single();

    if (ride) {
      // Send notification to user
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ride.user_id,
          title: '⚠️ Speed Alert',
          body: `Your driver is exceeding speed limit (${Math.round(speed)} km/h)`,
          data: { rideId, type: 'speed_alert', speed },
        }),
      });
    }

    return res.status(200).json({ alerted: true, message: 'Speed limit exceeded' });
  }

  return res.status(200).json({ alerted: false });
}