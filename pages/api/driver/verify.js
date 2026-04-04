// pages/api/driver/verify.js - NEW FILE
import { supabaseAdmin } from '../../../lib/supabase';
import { uploadDriverDocument } from '../../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { driverId, documents } = req.body;

  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID required' });
  }

  try {
    // Update verification status
    const { error: updateError } = await supabaseAdmin
      .from('drivers')
      .update({
        verification_status: 'submitted',
        document_rc_url: documents?.rc_url,
        document_insurance_url: documents?.insurance_url,
        document_pollution_url: documents?.pollution_url,
        document_driving_license_url: documents?.license_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', driverId);

    if (updateError) throw updateError;

    // Notify admin
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'admin',
        title: '📄 New Driver Verification Request',
        body: `Driver ${driverId} has submitted documents for verification`,
        data: { driverId, type: 'driver_verification' }
      }),
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Documents submitted for verification' });
  } catch (error) {
    console.error('Driver verification error:', error);
    res.status(500).json({ error: 'Failed to submit documents' });
  }
}