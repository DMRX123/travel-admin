import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, name } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  if (phone.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
  }

  try {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          otp_code: otpCode, 
          otp_expiry: otpExpiry,
          is_verified: false 
        })
        .eq('id', existingUser.id);

      if (updateError) throw updateError;
    } else {
      // Create new user
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          full_name: name || '',
          phone: phone,
          user_type: 'user',
          is_verified: false,
          otp_code: otpCode,
          otp_expiry: otpExpiry,
        });

      if (insertError) throw insertError;
    }

    // Send SMS via MSG91 (Production)
    if (process.env.SMS_API_KEY) {
      try {
        await fetch('https://api.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            'authkey': process.env.SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobile: `91${phone}`,
            otp: otpCode,
            sender: process.env.SMS_SENDER_ID || 'MSTRAV',
          }),
        });
      } catch (smsError) {
        console.error('SMS send error:', smsError);
        // Don't fail the request, just log error
      }
    }

    // For development, return OTP (remove in production)
    console.log(`[DEV] OTP for ${phone}: ${otpCode}`);

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}