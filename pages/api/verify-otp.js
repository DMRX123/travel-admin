// pages/api/verify-otp.js - EXCELLENT WITH RATE LIMITING
import { supabase } from '../../lib/supabase';

// Rate limiting store
const rateLimitMap = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, otp, bookingId } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  // Rate limiting - max 5 attempts per 15 minutes
  const rateKey = `verify_${phone}`;
  const attempts = rateLimitMap.get(rateKey) || { count: 0, firstAttempt: Date.now() };
  
  if (attempts.count >= 5 && Date.now() - attempts.firstAttempt < 15 * 60 * 1000) {
    return res.status(429).json({ error: 'Too many attempts. Please try after 15 minutes.' });
  }

  try {
    // Find user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, otp_code, otp_expiry')
      .eq('phone', phone)
      .maybeSingle();

    if (userError || !user) {
      // Update rate limit
      rateLimitMap.set(rateKey, { count: attempts.count + 1, firstAttempt: attempts.firstAttempt });
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Check OTP
    if (user.otp_code !== otp) {
      rateLimitMap.set(rateKey, { count: attempts.count + 1, firstAttempt: attempts.firstAttempt });
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check expiry
    if (new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ error: 'OTP expired. Please request a new OTP.' });
    }

    // Verify user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_verified: true,
        otp_code: null,
        otp_expiry: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    // Clear rate limit on success
    rateLimitMap.delete(rateKey);

    // Update ride if bookingId provided
    if (bookingId) {
      await supabase
        .from('rides')
        .update({ status: 'confirmed', verified_at: new Date().toISOString() })
        .eq('id', bookingId)
        .then(({ error }) => {
          if (error) console.error('Ride update error:', error);
        });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Phone verified successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}