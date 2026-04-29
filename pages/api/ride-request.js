// pages/api/ride-request.js - FINAL WITH TIMEOUT HANDLING
import { supabaseAdmin, driverAcceptRide, driverRejectRide } from '../../lib/supabase';
import { withRateLimit } from '../../lib/rate-limit';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, driverId, action } = req.body;

  if (!rideId || !driverId || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check if ride request is still valid (not timed out)
    const { data: request, error: requestError } = await supabaseAdmin
      .from('ride_requests')
      .select('status, timeout_at')
      .eq('ride_id', rideId)
      .eq('driver_id', driverId)
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      throw requestError;
    }

    if (request && new Date(request.timeout_at) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ride request has expired. Another driver may have accepted it.' 
      });
    }

    if (request && request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Ride request already ${request.status}` 
      });
    }

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

export default withRateLimit(handler, { limit: 10, windowMs: 60000 });