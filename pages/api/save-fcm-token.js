import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, userId } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Save token to database
    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        token,
        user_id: userId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ error: 'Failed to save token' });
  }
}