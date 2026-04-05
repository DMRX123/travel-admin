// pages/api/loyalty/points.js
import { supabaseAdmin, addLoyaltyPoints, getLoyaltyPoints } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query;
    const points = await getLoyaltyPoints(userId);
    return res.status(200).json(points);
  }

  if (req.method === 'POST') {
    const { userId, points, description } = req.body;
    const result = await addLoyaltyPoints(userId, points, description);
    return res.status(200).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}