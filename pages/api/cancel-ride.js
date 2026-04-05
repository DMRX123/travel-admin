// pages/api/cancel-ride.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, userId, reason } = req.body;

  if (!rideId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('fare, status, created_at, payment_method, payment_status')
      .eq('id', rideId)
      .single();

    if (rideError) throw rideError;

    if (ride.status !== 'pending' && ride.status !== 'accepted') {
      return res.status(400).json({ error: 'Ride cannot be cancelled at this stage' });
    }

    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('cancellation_fee, free_cancellation_minutes')
      .single();

    const cancellationFee = settings?.cancellation_fee || 50;
    const freeMinutes = settings?.free_cancellation_minutes || 5;
    
    const createdAt = new Date(ride.created_at);
    const minutesSinceBooking = Math.floor((Date.now() - createdAt.getTime()) / 60000);
    
    let refundAmount = 0;
    let fee = 0;
    
    if (minutesSinceBooking <= freeMinutes) {
      refundAmount = ride.fare;
      fee = 0;
    } else {
      refundAmount = ride.fare - cancellationFee;
      fee = cancellationFee;
    }
    
    if (refundAmount < 0) refundAmount = 0;

    const wasPaid = ride.payment_status === 'paid';
    const isOnlinePayment = ride.payment_method === 'card' || ride.payment_method === 'upi';

    const { error: updateError } = await supabaseAdmin
      .from('rides')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: 'user',
        cancelled_at: new Date().toISOString(),
        refund_amount: wasPaid ? refundAmount : 0,
        refund_status: wasPaid && refundAmount > 0 ? 'pending' : 'none',
      })
      .eq('id', rideId);

    if (updateError) throw updateError;

    if (wasPaid && refundAmount > 0) {
      await supabaseAdmin.from('refunds').insert({
        ride_id: rideId,
        user_id: userId,
        amount: refundAmount,
        reason: reason,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    if (ride.driver_id) {
      await supabaseAdmin
        .from('drivers')
        .update({ is_online: true, current_ride_id: null })
        .eq('id', ride.driver_id);
    }

    res.status(200).json({
      success: true,
      refundAmount: wasPaid ? refundAmount : 0,
      cancellationFee: fee,
      message: refundAmount > 0 
        ? `Ride cancelled. ₹${refundAmount} will be refunded.`
        : 'Ride cancelled successfully.'
    });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
}