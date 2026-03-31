import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, userId } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Check if token already exists
    const { data: existing, error: findError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('id')
      .eq('token', token)
      .single();

    if (existing) {
      // Update existing token
      await supabaseAdmin
        .from('fcm_tokens')
        .update({
          user_id: userId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Insert new token
      await supabaseAdmin
        .from('fcm_tokens')
        .insert({
          token,
          user_id: userId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    res.status(200).json({ success: true, message: 'Token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ error: 'Failed to save token' });
  }
}