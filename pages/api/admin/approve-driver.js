// pages/api/admin/approve-driver.js - NEW FILE
import { supabaseAdmin, protectAPI } from '../../../lib/supabase';

export default async function handler(req, res) {
  const user = await protectAPI(req, res, true);
  if (!user) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { driverId, action, notes } = req.body;

  if (!driverId || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from('drivers')
        .update({
          is_approved: true,
          verification_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId);

      if (error) throw error;

      // Notify driver
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          title: '✅ Driver Application Approved',
          body: 'You can now go online and start accepting rides!',
          data: { type: 'driver_approved' }
        }),
      }).catch(() => {});

      res.status(200).json({ success: true, message: 'Driver approved' });
    } 
    else if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('drivers')
        .update({
          is_approved: false,
          verification_status: 'rejected',
          rejection_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId);

      if (error) throw error;

      res.status(200).json({ success: true, message: 'Driver rejected' });
    } 
    else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Approve driver error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}