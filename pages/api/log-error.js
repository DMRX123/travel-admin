import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { error, stack, url, userAgent, userId } = req.body;

  try {
    await supabaseAdmin
      .from('error_logs')
      .insert({
        error_message: typeof error === 'string' ? error : error?.message || 'Unknown error',
        error_stack: stack,
        url: url || req.headers.referer || 'unknown',
        user_agent: userAgent || req.headers['user-agent'],
        user_id: userId || null,
        created_at: new Date().toISOString(),
      });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Log error failed:', err);
    res.status(500).json({ error: 'Failed to log error' });
  }
}