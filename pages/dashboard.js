import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import { LineChartComponent, BarChartComponent } from '../components/Chart';
import Head from 'next/head';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalRevenue: 0,
    activeRides: 0,
    pendingDrivers: 0,
    todayBookings: 0,
  });
  const [recentRides, setRecentRides] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.user_type !== 'admin') {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }
      
      await loadData();
      setLoading(false);
    };
    
    const loadData = async () => {
      try {
        // Users count
        const { count: users } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'user');

        // Drivers count
        const { count: drivers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'driver');

        // Rides count
        const { count: rides } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true });

        // Revenue
        const { data: revenueData } = await supabase
          .from('rides')
          .select('fare')
          .eq('payment_status', 'paid');
        const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.fare || 0), 0) || 0;

        // Active rides
        const { count: activeRides } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'accepted', 'arrived', 'started']);

        // Pending drivers
        const { count: pendingDrivers } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false);

        // Today's bookings
        const today = new Date().toISOString().split('T')[0];
        const { count: todayBookings } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        setStats({
          totalUsers: users || 0,
          totalDrivers: drivers || 0,
          totalRides: rides || 0,
          totalRevenue,
          activeRides: activeRides || 0,
          pendingDrivers: pendingDrivers || 0,
          todayBookings: todayBookings || 0,
        });

        // Recent rides - FIXED QUERY
        const { data: recentData } = await supabase
          .from('rides')
          .select(`
            id,
            fare,
            status,
            created_at,
            pickup_address,
            drop_address,
            user:profiles!rides_user_id_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        setRecentRides(recentData || []);

        // Daily stats
        const { data: dailyData } = await supabase
          .from('rides')
          .select('created_at, fare')
          .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString());
        
        const dailyMap = {};
        dailyData?.forEach(ride => {
          const date = new Date(ride.created_at).toLocaleDateString();
          if (!dailyMap[date]) dailyMap[date] = { date, rides: 0, revenue: 0 };
          dailyMap[date].rides++;
          dailyMap[date].revenue += ride.fare || 0;
        });
        setDailyStats(Object.values(dailyMap).reverse());
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    checkAuthAndLoad();
  }, [router]);

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      arrived: 'bg-purple-100 text-purple-800',
      started: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="ml-3 text-gray-600">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | Maa Saraswati Travels</title>
      </Head>
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
            <StatsCard title="Total Users" value={stats.totalUsers} icon="👥" color="orange" />
            <StatsCard title="Total Drivers" value={stats.totalDrivers} icon="🚗" color="blue" />
            <StatsCard title="Total Rides" value={stats.totalRides} icon="🚕" color="purple" />
            <StatsCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} icon="💰" color="green" />
            <StatsCard title="Active Rides" value={stats.activeRides} icon="🔄" color="yellow" />
            <StatsCard title="Pending Drivers" value={stats.pendingDrivers} icon="⏳" color="red" />
            <StatsCard title="Today's Bookings" value={stats.todayBookings} icon="📅" color="pink" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LineChartComponent data={dailyStats} dataKey="revenue" xAxisKey="date" title="Revenue Trend (Last 30 Days)" />
            <BarChartComponent data={dailyStats} dataKey="rides" xAxisKey="date" title="Ride Volume (Last 30 Days)" />
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-orange-50">
              <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRides.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No rides yet</td></tr>
                  ) : (
                    recentRides.map((ride) => (
                      <tr key={ride.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 text-sm font-mono">{ride.id?.substring(0, 8) || 'N/A'}...</td>
                        <td className="px-6 py-4 text-sm">{ride.user?.full_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">Not assigned</td>
                        <td className="px-6 py-4 text-sm font-medium">₹{ride.fare || 0}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ride.status)}`}>{ride.status || 'pending'}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-500">{ride.created_at ? new Date(ride.created_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}