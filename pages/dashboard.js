import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import { LineChartComponent, BarChartComponent } from '../components/Chart';
import Head from 'next/head';
import toast from 'react-hot-toast';
import RecurringRideList from '../components/RecurringRideList';
import RecurringRideModal from '../components/RecurringRideModal';
import ThemeToggle from '../components/ThemeToggle';
import CommissionCard from '../components/CommissionCard';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalRevenue: 0,
    totalCommission: 0,
    activeRides: 0,
    pendingDrivers: 0,
    todayBookings: 0,
    pendingVerifications: 0,
  });
  const [recentRides, setRecentRides] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [commissionRate, setCommissionRate] = useState(20);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      
      setUser(session.user);
      
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
      
      const subscription = supabase
        .channel('admin-dashboard')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'rides' },
          () => loadData()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'drivers' },
          () => loadData()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => loadData()
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
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

        // Revenue and Commission
        const { data: revenueData } = await supabase
          .from('rides')
          .select('fare, commission')
          .eq('payment_status', 'paid');
        
        const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.fare || 0), 0) || 0;
        const totalCommission = revenueData?.reduce((sum, r) => sum + (r.commission || r.fare * 0.2 || 0), 0) || 0;

        // Get commission rate from settings
        const { data: settings } = await supabase
          .from('system_settings')
          .select('commission_rate')
          .single();
        if (settings?.commission_rate) setCommissionRate(settings.commission_rate);

        // Active rides
        const { count: activeRides } = await supabase
          .from('rides')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'accepted', 'arrived', 'started', 'confirmed']);

        // Pending drivers
        const { count: pendingDrivers } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false);

        // Pending verifications
        const { count: pendingVerifications } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
          .eq('background_check_status', 'pending');

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
          totalCommission,
          activeRides: activeRides || 0,
          pendingDrivers: pendingDrivers || 0,
          todayBookings: todayBookings || 0,
          pendingVerifications: pendingVerifications || 0,
        });

        // Recent rides
        const { data: recentData } = await supabase
          .from('rides')
          .select(`
            id,
            fare,
            commission,
            status,
            created_at,
            pickup_address,
            drop_address,
            vehicle_type,
            user:user_id (full_name, phone),
            driver:driver_id (full_name, vehicle_number)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        setRecentRides(recentData || []);

        // Daily stats
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: dailyData } = await supabase
          .from('rides')
          .select('created_at, fare, commission')
          .gte('created_at', thirtyDaysAgo);
        
        const dailyMap = {};
        dailyData?.forEach(ride => {
          const date = new Date(ride.created_at).toLocaleDateString();
          if (!dailyMap[date]) dailyMap[date] = { date, rides: 0, revenue: 0, commission: 0 };
          dailyMap[date].rides++;
          dailyMap[date].revenue += ride.fare || 0;
          dailyMap[date].commission += ride.commission || ride.fare * 0.2 || 0;
        });
        setDailyStats(Object.values(dailyMap).reverse());
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load dashboard data');
      }
    };
    
    checkAuthAndLoad();
  }, [router]);

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      arrived: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      started: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      confirmed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setShowRecurringModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 flex items-center gap-2"
              >
                <span>🔄</span>
                Schedule Recurring
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
            <StatsCard title="Total Users" value={stats.totalUsers} icon="👥" color="blue" />
            <StatsCard title="Total Drivers" value={stats.totalDrivers} icon="🚗" color="orange" />
            <StatsCard title="Total Rides" value={stats.totalRides} icon="🚕" color="purple" />
            <StatsCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} icon="💰" color="green" />
            <StatsCard title="Platform Commission" value={`₹${stats.totalCommission.toFixed(2)}`} icon="🏦" color="indigo" />
            <StatsCard title="Active Rides" value={stats.activeRides} icon="🔄" color="yellow" />
            <StatsCard title="Pending Drivers" value={stats.pendingDrivers} icon="⏳" color="red" />
            <StatsCard title="Today's Bookings" value={stats.todayBookings} icon="📅" color="pink" />
          </div>

          {/* Commission Card */}
          <div className="mb-8">
            <CommissionCard 
              totalRevenue={stats.totalRevenue} 
              totalCommission={stats.totalCommission} 
              commissionRate={commissionRate}
            />
          </div>

          {/* Recurring Rides Section */}
          <div className="mt-8 mb-8">
            <RecurringRideList userId={user?.id} />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LineChartComponent data={dailyStats} dataKey="revenue" xAxisKey="date" title="Revenue Trend (Last 30 Days)" color="#F97316" />
            <BarChartComponent data={dailyStats} dataKey="rides" xAxisKey="date" title="Ride Volume (Last 30 Days)" color="#10B981" />
          </div>

          {/* Recent Bookings Table */}
          <div className={`rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'bg-orange-50'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Recent Bookings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ride ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fare</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {recentRides.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No rides yet
                      </td>
                    </tr>
                  ) : (
                    recentRides.map((ride) => (
                      <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-300">
                          {ride.id?.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{ride.user?.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{ride.user?.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {ride.driver?.full_name || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 text-sm capitalize text-gray-900 dark:text-gray-300">
                          {ride.vehicle_type || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                          ₹{ride.fare || 0}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-orange-600 dark:text-orange-400">
                          ₹{ride.commission || (ride.fare * 0.2).toFixed(0) || 0}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ride.status)}`}>
                            {ride.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {ride.created_at ? new Date(ride.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>

      {/* Recurring Ride Modal */}
      <RecurringRideModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        pickup=""
        drop=""
        vehicle="sedan"
        fare={0}
        distance={0}
      />
    </>
  );
}