// pages/api/wait-time-compensation.js
import { supabaseAdmin } from '../../lib/supabase';

const COMPENSATION_PER_MINUTE = 2; // ₹2 per minute wait time
const FREE_WAIT_TIME_MINUTES = 5; // 5 minutes free

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, actualArrivalTime } = req.body;
  
  const { data: ride } = await supabaseAdmin
    .from('rides')
    .select('accepted_at, driver_id, user_id, fare')
    .eq('id', rideId)
    .single();
  
  const acceptedAt = new Date(ride.accepted_at);
  const arrivalTime = new Date(actualArrivalTime);
  const waitMinutes = Math.max(0, (arrivalTime - acceptedAt) / (1000 * 60) - FREE_WAIT_TIME_MINUTES);
  
  if (waitMinutes > 0) {
    const compensation = waitMinutes * COMPENSATION_PER_MINUTE;
    const newFare = ride.fare - compensation;
    
    await supabaseAdmin.from('rides').update({
      fare: newFare,
      wait_time_compensation: compensation,
      wait_time_minutes: waitMinutes,
    }).eq('id', rideId);
    
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: ride.user_id,
        title: '💰 Wait Time Compensation',
        body: `You received ₹${compensation} compensation for ${waitMinutes} minutes wait time`,
        data: { rideId, type: 'compensation' },
      }),
    });
    
    res.json({ compensation, waitMinutes, newFare });
  } else {
    res.json({ compensation: 0, waitMinutes: 0 });
  }
}