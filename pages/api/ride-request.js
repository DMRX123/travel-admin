import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rideId, driverId, action } = req.body;

  if (!rideId || !driverId || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (action === 'accept') {
      // Check if ride is already accepted
      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .select('status')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;

      if (ride.status !== 'pending') {
        return res.status(400).json({ error: 'Ride already taken' });
      }

      // Update ride status
      const { error: updateError } = await supabaseAdmin
        .from('rides')
        .update({
          driver_id: driverId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (updateError) throw updateError;

      // Update ride request status
      await supabaseAdmin
        .from('ride_requests')
        .update({ status: 'accepted' })
        .eq('ride_id', rideId)
        .eq('driver_id', driverId);

      // Reject other pending requests
      await supabaseAdmin
        .from('ride_requests')
        .update({ status: 'rejected' })
        .eq('ride_id', rideId)
        .neq('driver_id', driverId);

      // Update driver acceptance rate
      const { data: requests } = await supabaseAdmin
        .from('ride_requests')
        .select('status')
        .eq('driver_id', driverId);

      const total = requests.length;
      const accepted = requests.filter(r => r.status === 'accepted').length;
      const acceptanceRate = total > 0 ? accepted / total : 0;

      await supabaseAdmin
        .from('drivers')
        .update({ acceptance_rate: acceptanceRate })
        .eq('id', driverId);

      // Send notification to user
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ride.user_id,
          title: 'Driver Assigned',
          body: 'A driver has accepted your ride!',
          data: { rideId, type: 'driver_assigned' }
        }),
      });

      res.status(200).json({ success: true, message: 'Ride accepted' });
    } 
    else if (action === 'reject') {
      await supabaseAdmin
        .from('ride_requests')
        .update({ status: 'rejected' })
        .eq('ride_id', rideId)
        .eq('driver_id', driverId);

      res.status(200).json({ success: true, message: 'Ride rejected' });
    } 
    else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Ride request API error:', error);
    res.status(500).json({ error: error.message });
  }
}