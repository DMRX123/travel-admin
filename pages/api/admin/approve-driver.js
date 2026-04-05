// pages/api/admin/approve-driver.js
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
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId);

      if (error) throw error;

      await supabaseAdmin
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', driverId);

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          title: '✅ Driver Application Approved',
          body: 'Congratulations! Your driver application has been approved. You can now go online and start accepting rides.',
          data: { type: 'driver_approved' }
        }),
      }).catch(() => {});

      res.status(200).json({ success: true, message: 'Driver approved successfully' });
    } 
    else if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('drivers')
        .update({
          is_approved: false,
          verification_status: 'rejected',
          rejection_notes: notes,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId);

      if (error) throw error;

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          title: '❌ Driver Application Rejected',
          body: notes || 'Your driver application has been rejected. Please contact support for more information.',
          data: { type: 'driver_rejected' }
        }),
      }).catch(() => {});

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