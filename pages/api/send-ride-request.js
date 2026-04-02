import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, pickupLat, pickupLng, vehicleType } = req.body;

  if (!rideId || !pickupLat || !pickupLng || !vehicleType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Find nearby drivers of this vehicle type within 0.8 km
    const { data: drivers, error: driversError } = await supabaseAdmin
      .rpc('find_nearby_drivers_by_type', {
        lat: pickupLat,
        lng: pickupLng,
        vehicle_type: vehicleType,
        radius_km: 0.8,
      });

    if (driversError) throw driversError;

    if (!drivers || drivers.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: 'No nearby drivers available. Expanding search radius...' 
      });
    }

    // Sort by acceptance rate (higher first)
    drivers.sort((a, b) => (b.acceptance_rate || 0) - (a.acceptance_rate || 0));

    // Create ride requests for each driver
    for (const driver of drivers) {
      await supabaseAdmin
        .from('ride_requests')
        .insert({
          ride_id: rideId,
          driver_id: driver.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      // Send push notification to driver
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driver.id,
          title: 'New Ride Request',
          body: `New ride request ${driver.distance_km.toFixed(1)} km away`,
          data: { rideId, type: 'new_ride', pickupLat, pickupLng }
        }),
      });
    }

    res.status(200).json({ 
      success: true, 
      driversNotified: drivers.length,
      message: `Notified ${drivers.length} nearby drivers`
    });
  } catch (error) {
    console.error('Send ride request error:', error);
    res.status(500).json({ error: error.message });
  }
}