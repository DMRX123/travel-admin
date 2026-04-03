// pages/api/log-cancellation.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, reason } = req.body;

  if (!rideId) {
    return res.status(400).json({ error: 'Ride ID required' });
  }

  try {
    // Get ride details
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('user_id, fare')
      .eq('id', rideId)
      .single();

    if (rideError) throw rideError;

    // Log cancellation
    const { error: logError } = await supabaseAdmin
      .from('cancellation_logs')
      .insert({
        ride_id: rideId,
        user_id: ride.user_id,
        reason: reason,
        cancelled_at: new Date().toISOString()
      });

    if (logError) throw logError;

    // Update analytics
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cancellation',
        data: { rideId, reason, fare: ride.fare }
      })
    }).catch(() => {});

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Log cancellation error:', error);
    res.status(500).json({ error: 'Failed to log cancellation' });
  }
}