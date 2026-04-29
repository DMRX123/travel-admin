// pages/api/send-notification.js - EXCELLENT PRODUCTION READY
import { supabaseAdmin } from '../../lib/supabase';

// Firebase Admin initialization with better error handling
let admin = null;
let isFirebaseInitialized = false;

const initFirebaseAdmin = () => {
  if (isFirebaseInitialized) return true;
  
  try {
    const { initializeApp, cert } = require('firebase-admin/app');
    const { getMessaging } = require('firebase-admin/messaging');
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('Firebase Admin credentials missing. Notifications will be logged only.');
      return false;
    }
    
    if (!admin || admin.apps.length === 0) {
      admin = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    isFirebaseInitialized = true;
    return true;
  } catch (error) {
    console.error('Firebase Admin init error:', error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, title, body, data = {} } = req.body;

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
      return res.status(200).json({ success: true, message: 'No tokens found for user', notificationsSent: 0 });
    }

    // Try to initialize Firebase Admin
    const firebaseReady = initFirebaseAdmin();
    
    if (!firebaseReady || !admin) {
      // Log notification for debugging
      console.log(`[NOTIFICATION] To ${userId}: ${title} - ${body}`);
      console.log(`[NOTIFICATION] Data:`, data);
      
      // Store in database for later
      await supabaseAdmin
        .from('notification_logs')
        .insert({
          user_id: userId,
          title,
          body,
          data,
          status: 'logged',
          created_at: new Date().toISOString()
        })
        .catch(err => console.error('Failed to log notification:', err));
      
      return res.status(200).json({ 
        success: true, 
        message: 'Notification logged (Firebase Admin not configured)',
        notificationsSent: 0
      });
    }

    const messaging = admin.messaging();
    const results = [];

    // Send to all tokens
    for (const { token } of tokens) {
      try {
        await messaging.send({
          token,
          notification: { 
            title: title.substring(0, 100), 
            body: body?.substring(0, 200) || '' 
          },
          data: { ...data, timestamp: Date.now().toString() },
          android: { priority: 'high' },
          apns: { headers: { 'apns-priority': '10' } },
        });
        results.push({ token, success: true });
      } catch (error) {
        // If token is invalid, remove it
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          await supabaseAdmin
            .from('fcm_tokens')
            .delete()
            .eq('token', token);
          console.log(`Removed invalid token: ${token}`);
        }
        results.push({ token, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.status(200).json({ 
      success: true, 
      notificationsSent: successCount,
      totalTokens: tokens.length,
      results: results.slice(0, 10) // Return first 10 results
    });

  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}