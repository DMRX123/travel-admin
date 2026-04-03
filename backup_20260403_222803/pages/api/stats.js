import { protectAPI, supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const user = await protectAPI(req, res, true);
  if (!user) return;
  
  try {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'user');

    const { count: totalDrivers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'driver');

    const today = new Date().toISOString().split('T')[0];
    const { count: todayRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    const { data: revenueData } = await supabase
      .from('rides')
      .select('fare')
      .eq('payment_status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, ride) => sum + (ride.fare || 0), 0) || 0;

    const { count: activeRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'accepted', 'arrived', 'started', 'confirmed']);

    const { count: pendingDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false);

    res.status(200).json({
      totalUsers: totalUsers || 0,
      totalDrivers: totalDrivers || 0,
      todayRides: todayRides || 0,
      totalRevenue,
      activeRides: activeRides || 0,
      pendingDrivers: pendingDrivers || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
}