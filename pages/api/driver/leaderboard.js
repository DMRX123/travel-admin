// pages/api/driver/leaderboard.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { period = 'week', sortBy = 'earnings', limit = 10 } = req.query;
  
  let startDate;
  const now = new Date();
  
  switch(period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7));
  }

  const { data: rides } = await supabaseAdmin
    .from('rides')
    .select('driver_id, driver:drivers!driver_id(profiles(full_name, profile_image), rating, total_trips), driver_earning, fare, distance')
    .eq('status', 'completed')
    .gte('completed_at', startDate.toISOString());

  const leaderboard = {};
  rides.forEach(ride => {
    if (!leaderboard[ride.driver_id]) {
      leaderboard[ride.driver_id] = {
        id: ride.driver_id,
        name: ride.driver?.profiles?.full_name || 'Unknown',
        image: ride.driver?.profiles?.profile_image,
        rating: ride.driver?.rating || 0,
        totalTrips: ride.driver?.total_trips || 0,
        earnings: 0,
        rides: 0,
        totalDistance: 0,
      };
    }
    leaderboard[ride.driver_id].earnings += ride.driver_earning || ride.fare * 0.8;
    leaderboard[ride.driver_id].rides++;
    leaderboard[ride.driver_id].totalDistance += ride.distance || 0;
  });

  let result = Object.values(leaderboard);
  
  if (sortBy === 'earnings') result.sort((a, b) => b.earnings - a.earnings);
  else if (sortBy === 'rides') result.sort((a, b) => b.rides - a.rides);
  else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
  
  res.json(result.slice(0, limit));
}