// pages/api/payouts/schedule.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { driverId, frequency = 'weekly', dayOfWeek = 1, minAmount = 500 } = req.body;

  await supabaseAdmin.from('payout_schedules').upsert({
    driver_id: driverId,
    frequency, // weekly, biweekly, monthly
    day_of_week: dayOfWeek,
    min_amount: minAmount,
    is_active: true,
    next_payout: calculateNextPayout(frequency, dayOfWeek),
    updated_at: new Date().toISOString(),
  });

  res.json({ success: true });
}

function calculateNextPayout(frequency, dayOfWeek) {
  const now = new Date();
  const next = new Date(now);
  
  if (frequency === 'weekly') {
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + (daysUntil || 7));
  } else if (frequency === 'biweekly') {
    next.setDate(now.getDate() + 14);
  } else if (frequency === 'monthly') {
    next.setMonth(now.getMonth() + 1);
  }
  
  next.setHours(10, 0, 0, 0);
  return next.toISOString();
}