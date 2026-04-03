import { supabaseAdmin } from '../../lib/supabase';

// Firebase Admin initialization
let admin = null;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
} catch (error) {
  console.error('Firebase Admin init error:', error);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, title, body, data } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get user's FCM tokens
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokenError) throw tokenError;

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No tokens found for user' });
    }

    // If Firebase Admin is not available, just log
    if (!admin) {
      console.log(`[Notification] Would send to ${userId}: ${title} - ${body}`);
      return res.status(200).json({ success: true, message: 'Notification logged (no Firebase Admin)' });
    }

    const messaging = admin.messaging();

    // Send to all tokens
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        try {
          await messaging.send({
            token,
            notification: { title, body },
            data: data || {},
            android: { priority: 'high' },
            apns: { headers: { 'apns-priority': '10' } },
          });
          return { token, success: true };
        } catch (error) {
          // If token is invalid, remove it
          if (error.code === 'messaging/invalid-registration-token') {
            await supabaseAdmin
              .from('fcm_tokens')
              .delete()
              .eq('token', token);
          }
          return { token, success: false, error: error.message };
        }
      })
    );

    res.status(200).json({ 
      success: true, 
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });

  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}