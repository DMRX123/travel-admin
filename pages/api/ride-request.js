import { supabaseAdmin, driverAcceptRide, driverRejectRide } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, driverId, action } = req.body;

  if (!rideId || !driverId || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (action === 'accept') {
      const result = await driverAcceptRide(rideId, driverId);
      return res.status(200).json(result);
    } 
    else if (action === 'reject') {
      const result = await driverRejectRide(rideId, driverId);
      return res.status(200).json(result);
    } 
    else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Ride request API error:', error);
    res.status(500).json({ error: error.message });
  }
}