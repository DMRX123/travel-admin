// pages/api/loyalty/transactions.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, limit = 50 } = req.query;

  const { data: transactions } = await supabaseAdmin
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  res.status(200).json(transactions || []);
}