// pages/api/heatmap.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  const { startDate, endDate, vehicleType } = req.query;
  
  let query = supabaseAdmin
    .from('rides')
    .select('pickup_lat, pickup_lng, drop_lat, drop_lng, created_at, vehicle_type')
    .eq('status', 'completed');

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (vehicleType && vehicleType !== 'all') query = query.eq('vehicle_type', vehicleType);

  const { data: rides } = await query;

  const pickupPoints = rides.map(ride => ({
    lat: ride.pickup_lat,
    lng: ride.pickup_lng,
    weight: 1,
    type: 'pickup',
  }));

  const dropPoints = rides.map(ride => ({
    lat: ride.drop_lat,
    lng: ride.drop_lng,
    weight: 1,
    type: 'drop',
  }));

  // Aggregate points by grid
  const heatmapData = aggregateByGrid([...pickupPoints, ...dropPoints]);

  res.json({ heatmapData, totalRides: rides.length });
}

function aggregateByGrid(points, gridSize = 0.01) {
  const grid = {};
  points.forEach(point => {
    const latKey = Math.floor(point.lat / gridSize) * gridSize;
    const lngKey = Math.floor(point.lng / gridSize) * gridSize;
    const key = `${latKey},${lngKey}`;
    if (!grid[key]) {
      grid[key] = { lat: latKey, lng: lngKey, weight: 0, count: 0 };
    }
    grid[key].weight += point.weight;
    grid[key].count++;
  });
  return Object.values(grid);
}