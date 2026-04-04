// pages/api/driver/goal.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { driverId, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data: goal } = await supabaseAdmin
      .from('driver_goals')
      .select('*')
      .eq('driver_id', driverId)
      .eq('date', targetDate)
      .single();
    
    // Get actual earnings for the day
    const { data: rides } = await supabaseAdmin
      .from('rides')
      .select('driver_earning')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('completed_at', `${targetDate}T00:00:00`)
      .lt('completed_at', `${targetDate}T23:59:59`);
    
    const actualEarnings = rides?.reduce((sum, r) => sum + (r.driver_earning || 0), 0) || 0;
    
    res.json({
      goal: goal?.target_amount || 1000,
      actual: actualEarnings,
      achieved: actualEarnings >= (goal?.target_amount || 1000),
      progress: ((actualEarnings / (goal?.target_amount || 1000)) * 100),
    });
  }

  if (req.method === 'POST') {
    const { driverId, targetAmount, date } = req.body;
    
    await supabaseAdmin.from('driver_goals').upsert({
      driver_id: driverId,
      target_amount: targetAmount,
      date: date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });
    
    res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}