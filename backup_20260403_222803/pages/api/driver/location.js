import { protectAPI, supabase } from '../../../lib/supabase';
import { updateDriverLocation } from '../../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await protectAPI(req, res, false);
  if (!user) return;

  // Check if user is driver
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profile?.user_type !== 'driver') {
    return res.status(403).json({ error: 'Only drivers can update location' });
  }

  const { lat, lng, bearing } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    // Update location in Firebase Realtime Database
    await updateDriverLocation(user.id, lat, lng, bearing || 0);

    // Update last known location in Supabase
    await supabase
      .from('drivers')
      .update({
        last_lat: lat,
        last_lng: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', user.id);

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
}