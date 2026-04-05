// pages/api/ride-streak.js
import { supabaseAdmin, updateRideStreak } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  const streak = await updateRideStreak(userId);
  
  res.status(200).json({ streak });
}