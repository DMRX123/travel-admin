// pages/api/driver/earnings.js
import { protectAPI, supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await protectAPI(req, res, false);
  if (!user) return;

  try {
    const { period = 'all' } = req.query;
    let dateFilter = {};

    const now = new Date();
    if (period === 'today') {
      const today = now.toISOString().split('T')[0];
      dateFilter = { gte: today };
    } else if (period === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      dateFilter = { gte: monthAgo };
    }

    let query = supabase
      .from('rides')
      .select('*')
      .eq('driver_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (dateFilter.gte) {
      query = query.gte('completed_at', dateFilter.gte);
    }

    const { data: rides, error } = await query;

    if (error) throw error;

    const totalEarnings = rides?.reduce((sum, r) => sum + (r.fare || 0), 0) || 0;
    const totalRides = rides?.length || 0;
    const avgFare = totalRides > 0 ? totalEarnings / totalRides : 0;

    // Group by date for chart
    const dailyMap = {};
    rides?.forEach(ride => {
      const date = new Date(ride.completed_at).toLocaleDateString();
      if (!dailyMap[date]) {
        dailyMap[date] = { date, earnings: 0, rides: 0 };
      }
      dailyMap[date].earnings += ride.fare || 0;
      dailyMap[date].rides++;
    });

    res.status(200).json({
      success: true,
      totalEarnings,
      totalRides,
      avgFare,
      rides: rides || [],
      dailyData: Object.values(dailyMap).reverse()
    });
  } catch (error) {
    console.error('Driver earnings error:', error);
    res.status(500).json({ error: error.message });
  }
}