// pages/api/verify-email.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, action } = req.body;

  if (action === 'send') {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabaseAdmin
        .from('email_verifications')
        .insert({
          email,
          otp: emailOtp,
          expires_at: expiresAt,
          verified: false,
          created_at: new Date().toISOString(),
        });

      // Send email via nodemailer
      console.log(`[DEV] Email OTP for ${email}: ${emailOtp}`);

      res.status(200).json({ success: true, message: 'Verification email sent' });
    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } 
  else if (action === 'verify') {
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .eq('verified', false)
        .single();

      if (error || !data) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      await supabaseAdmin
        .from('email_verifications')
        .update({ verified: true })
        .eq('id', data.id);

      await supabaseAdmin
        .from('profiles')
        .update({ email_verified: true })
        .eq('email', email);

      res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  } 
  else {
    res.status(400).json({ error: 'Invalid action' });
  }
}