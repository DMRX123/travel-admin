// pages/api/cancel-ride.js - NEW FILE
import { supabaseAdmin, cancelRide } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, userId, reason } = req.body;

  if (!rideId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await cancelRide(rideId, userId, reason, 'user');
    
    if (result.success) {
      res.status(200).json({
        success: true,
        refundAmount: result.refundAmount,
        cancellationFee: result.cancellationFee,
        message: result.refundAmount > 0 
          ? `Ride cancelled. ₹${result.refundAmount} will be refunded.`
          : 'Ride cancelled successfully.'
      });
    } else {
      res.status(400).json({ error: result.message || 'Failed to cancel ride' });
    }
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
}