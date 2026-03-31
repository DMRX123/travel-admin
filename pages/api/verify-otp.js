import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, otp, bookingId } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  try {
    // Find user with this phone and OTP
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, otp_code, otp_expiry')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    // Check if OTP matches
    if (user.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check if OTP is expired
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

    // If bookingId provided, update ride status
    if (bookingId) {
      await supabase
        .from('rides')
        .update({ 
          status: 'confirmed',
          verified_at: new Date().toISOString()
        })
        .eq('id', bookingId);
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