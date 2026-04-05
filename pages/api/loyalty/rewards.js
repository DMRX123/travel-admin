// pages/api/loyalty/rewards.js
import { supabaseAdmin } from '../../../lib/supabase';

const DEFAULT_REWARDS = [
  { id: 1, name: '₹50 OFF', points: 500, discount: 50, discount_type: 'fixed', min_order: 200 },
  { id: 2, name: '₹100 OFF', points: 900, discount: 100, discount_type: 'fixed', min_order: 400 },
  { id: 3, name: 'Free Ride (up to ₹200)', points: 2000, discount: 200, discount_type: 'fixed', min_order: 0 },
  { id: 4, name: '20% OFF on next ride', points: 1500, discount: 20, discount_type: 'percentage', min_order: 300 },
  { id: 5, name: '30% OFF on next ride', points: 2500, discount: 30, discount_type: 'percentage', min_order: 500 },
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get custom rewards from database
    const { data: customRewards } = await supabaseAdmin
      .from('loyalty_rewards')
      .select('*')
      .eq('is_active', true)
      .order('points', { ascending: true });

    const rewards = [...DEFAULT_REWARDS, ...(customRewards || [])];
    res.status(200).json(rewards);
  }

  if (req.method === 'POST') {
    const { name, points, discount, discountType, minOrder } = req.body;

    const { data: reward } = await supabaseAdmin.from('loyalty_rewards').insert({
      name,
      points,
      discount,
      discount_type: discountType,
      min_order: minOrder,
      is_active: true,
      created_at: new Date().toISOString(),
    }).select().single();

    res.status(200).json(reward);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}