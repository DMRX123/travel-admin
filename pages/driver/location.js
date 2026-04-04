import { supabase } from '../../lib/supabase';
import { updateDriverLocation } from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, bearing } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is driver
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (profile?.user_type !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can update location' });
    }

    // Update location in Firebase Realtime Database
    await updateDriverLocation(session.user.id, lat, lng, bearing || 0);

    // Update last location in Supabase
    await supabase
      .from('drivers')
      .update({
        current_latitude: lat,
        current_longitude: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
}