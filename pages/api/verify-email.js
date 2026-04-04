// pages/api/verify-email.js - NEW FILE
import { supabaseAdmin, sendEmailOTP, verifyEmailOTP } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, action, otp } = req.body;

    if (action === 'send') {
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const result = await sendEmailOTP(email);
      return res.status(200).json(result);
    }
    
    if (action === 'verify') {
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }
      
      const result = await verifyEmailOTP(email, otp);
      return res.status(200).json(result);
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}