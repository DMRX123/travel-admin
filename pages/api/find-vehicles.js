import { getAvailableVehicles, calculateFare } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pickupLat, pickupLng, dropLat, dropLng, distance } = req.body;

  if (!pickupLat || !pickupLng || !dropLat || !dropLng || !distance) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const vehicles = await getAvailableVehicles();
    
    // Calculate fare and ETA for each vehicle
    const vehiclesWithDetails = vehicles.map(vehicle => ({
      ...vehicle,
      fare: calculateFare(vehicle, distance),
      eta: Math.round(distance / 30 * 60), // minutes at 30 km/h
    }));

    // Sort by fare (lowest first)
    vehiclesWithDetails.sort((a, b) => a.fare - b.fare);

    res.status(200).json({ 
      success: true, 
      vehicles: vehiclesWithDetails,
      distance,
      eta: Math.round(distance / 30 * 60),
    });
  } catch (error) {
    console.error('Find vehicles API error:', error);
    res.status(500).json({ error: error.message });
  }
}