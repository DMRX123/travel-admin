// pages/api/payouts/process.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { driverId, weekEnding } = req.body;

  // Get weekly earnings
  const startDate = new Date(weekEnding);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const { data: rides } = await supabaseAdmin
    .from('rides')
    .select('driver_earning, fare, commission')
    .eq('driver_id', driverId)
    .eq('status', 'completed')
    .gte('completed_at', startDate.toISOString())
    .lt('completed_at', endDate.toISOString());

  const totalEarnings = rides.reduce((sum, r) => sum + (r.driver_earning || r.fare * 0.8), 0);
  const totalCommission = rides.reduce((sum, r) => sum + (r.commission || r.fare * 0.2), 0);

  if (totalEarnings <= 0) {
    return res.status(400).json({ error: 'No earnings for this period' });
  }

  // Record payout
  const { data: payout } = await supabaseAdmin.from('payouts').insert({
    driver_id: driverId,
    amount: totalEarnings,
    commission: totalCommission,
    week_start: startDate.toISOString(),
    week_end: endDate.toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
  }).select().single();

  // Process payment (simplified - integrate with Razorpay Payouts)
  // In production, integrate with actual payment gateway

  await supabaseAdmin.from('payouts').update({
    status: 'processed',
    processed_at: new Date().toISOString(),
    transaction_id: `PAYOUT_${Date.now()}`,
  }).eq('id', payout.id);

  // Send notification to driver
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: driverId,
      title: '💰 Payout Processed',
      body: `₹${totalEarnings.toFixed(2)} has been sent to your bank account`,
      data: { type: 'payout', amount: totalEarnings },
    }),
  });

  res.json({ success: true, amount: totalEarnings, commission: totalCommission });
}