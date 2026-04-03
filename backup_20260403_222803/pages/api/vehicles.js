import { getAvailableVehicles } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const vehicles = await getAvailableVehicles();
    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    console.error('Vehicles API error:', error);
    res.status(500).json({ error: error.message });
  }
}