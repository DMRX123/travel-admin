// pages/api/route-deviation.js
import { supabaseAdmin } from '../lib/supabase';

const DEVIATION_THRESHOLD_METERS = 500;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, currentLat, currentLng } = req.body;

  // Get ride details
  const { data: ride } = await supabaseAdmin
    .from('rides')
    .select('pickup_lat, pickup_lng, drop_lat, drop_lng, user_id')
    .eq('id', rideId)
    .single();

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  // Calculate if point is deviated from straight line path
  const isDeviated = await checkDeviation(
    ride.pickup_lat, ride.pickup_lng,
    ride.drop_lat, ride.drop_lng,
    currentLat, currentLng
  );

  if (isDeviated) {
    await supabaseAdmin.from('route_deviations').insert({
      ride_id: rideId,
      deviation_lat: currentLat,
      deviation_lng: currentLng,
      created_at: new Date().toISOString(),
    });

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: ride.user_id,
        title: '⚠️ Route Deviation Alert',
        body: 'Your driver has deviated from the planned route',
        data: { rideId, type: 'route_deviation' },
      }),
    });
  }

  res.json({ isDeviated });
}

async function checkDeviation(startLat, startLng, endLat, endLng, pointLat, pointLng) {
  const distance = pointToLineDistance(
    startLat, startLng, endLat, endLng, pointLat, pointLng
  );
  return distance > DEVIATION_THRESHOLD_METERS;
}

function pointToLineDistance(ax, ay, bx, by, px, py) {
  const abx = bx - ax;
  const aby = by - ay;
  const t = ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby);
  
  let nearestX, nearestY;
  if (t < 0) { nearestX = ax; nearestY = ay; }
  else if (t > 1) { nearestX = bx; nearestY = by; }
  else { nearestX = ax + t * abx; nearestY = ay + t * aby; }
  
  const dx = px - nearestX;
  const dy = py - nearestY;
  return Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters
}