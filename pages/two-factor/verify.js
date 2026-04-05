// pages/api/two-factor/verify.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, code } = req.body;

  const { data: twoFactorCode } = await supabaseAdmin
    .from('two_factor_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!twoFactorCode) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  await supabaseAdmin
    .from('two_factor_codes')
    .update({ verified: true })
    .eq('id', twoFactorCode.id);

  await supabaseAdmin
    .from('profiles')
    .update({ two_factor_enabled: true })
    .eq('id', userId);

  res.status(200).json({ success: true });
}