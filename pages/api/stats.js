import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // SECURITY CHECK - Verify admin session
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();
  
  if (profile?.user_type !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  // --- SECURITY CHECK END ---

  if (req.method === 'GET') {
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

      const totalRevenue = revenueData?.reduce((sum, ride) => sum + ride.fare, 0) || 0;

      const { count: activeRides } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted', 'arrived', 'started']);

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
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}