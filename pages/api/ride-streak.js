// pages/api/ride-streak.js - PRODUCTION READY
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    // Get today's date (IST)
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user had a ride yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const { data: yesterdayRide } = await supabaseAdmin
      .from('rides')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', yesterday)
      .lt('completed_at', yesterday + 'T23:59:59')
      .maybeSingle();
    
    const { data: todayRide } = await supabaseAdmin
      .from('rides')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', today)
      .lt('completed_at', today + 'T23:59:59')
      .maybeSingle();
    
    // Get current streak
    const { data: streak } = await supabaseAdmin
      .from('ride_streaks')
      .select('current_streak, best_streak')
      .eq('user_id', userId)
      .maybeSingle();
    
    let currentStreak = streak?.current_streak || 0;
    let bestStreak = streak?.best_streak || 0;
    
    if (todayRide) {
      if (yesterdayRide) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      
      await supabaseAdmin
        .from('ride_streaks')
        .upsert({
          user_id: userId,
          current_streak: currentStreak,
          best_streak: bestStreak,
          last_ride_date: today,
          updated_at: new Date().toISOString(),
        });
      
      // Bonus points for streak milestones
      if (currentStreak === 7) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/loyalty/points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, points: 50, description: '7-day ride streak bonus!' }),
        }).catch(() => {});
      } else if (currentStreak === 30) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/loyalty/points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, points: 200, description: '30-day ride streak champion!' }),
        }).catch(() => {});
      }
    }
    
    res.status(200).json({ 
      success: true, 
      streak: { currentStreak, bestStreak },
      hasRiddenToday: !!todayRide,
      hasRiddenYesterday: !!yesterdayRide
    });
  } catch (error) {
    console.error('Ride streak error:', error);
    res.status(500).json({ error: 'Failed to update ride streak' });
  }
}