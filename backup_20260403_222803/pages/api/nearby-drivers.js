import { findNearbyDriversByType } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, vehicleType, radiusKm = 0.8 } = req.body;

  if (!lat || !lng || !vehicleType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const drivers = await findNearbyDriversByType(lat, lng, vehicleType, radiusKm);
    res.status(200).json({ success: true, drivers });
  } catch (error) {
    console.error('Nearby drivers API error:', error);
    res.status(500).json({ error: error.message });
  }
}