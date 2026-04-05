// pages/api/two-factor/send.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, method = 'sms' } = req.body;

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('phone, email')
    .eq('id', userId)
    .single();

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabaseAdmin.from('two_factor_codes').insert({
    user_id: userId,
    code: otp,
    expires_at: expiresAt,
    method,
  });

  if (method === 'sms' && user?.phone) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user.phone,
        message: `Your 2FA code is: ${otp}. Valid for 5 minutes.`,
      }),
    });
  } else if (method === 'email' && user?.email) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.email,
        subject: '2FA Verification Code',
        type: 'two_factor',
        data: { otp },
      }),
    });
  }

  res.status(200).json({ success: true });
}