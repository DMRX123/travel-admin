// pages/api/loyalty/redeem.js
import { supabaseAdmin, getLoyaltyPoints } from '../../lib/supabase';

const REWARDS = [
  { id: 1, name: '₹50 OFF', points: 500, discount: 50 },
  { id: 2, name: '₹100 OFF', points: 900, discount: 100 },
  { id: 3, name: 'Free Ride (up to ₹200)', points: 2000, discount: 200 },
  { id: 4, name: '20% OFF on next ride', points: 1500, discount: '20%' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, rewardId } = req.body;
  const reward = REWARDS.find(r => r.id === rewardId);
  
  if (!reward) {
    return res.status(400).json({ error: 'Invalid reward' });
  }

  const currentPoints = await getLoyaltyPoints(userId);
  
  if (currentPoints.points < reward.points) {
    return res.status(400).json({ error: 'Insufficient points' });
  }

  const newPoints = currentPoints.points - reward.points;
  
  await supabaseAdmin.from('loyalty_points').update({
    points: newPoints,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  await supabaseAdmin.from('loyalty_transactions').insert({
    user_id: userId,
    points: -reward.points,
    type: 'redeemed',
    description: `Redeemed: ${reward.name}`,
    created_at: new Date().toISOString(),
  });

  // Generate promo code for the reward
  const promoCode = `LOYALTY${Date.now()}`;
  await supabaseAdmin.from('promo_codes').insert({
    code: promoCode,
    discount_type: typeof reward.discount === 'number' ? 'fixed' : 'percentage',
    discount_value: typeof reward.discount === 'number' ? reward.discount : parseFloat(reward.discount),
    min_order_amount: 100,
    usage_limit: 1,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  });

  res.status(200).json({ success: true, promoCode, newPoints });
}