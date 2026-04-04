import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import { LineChartComponent, BarChartComponent } from '../../components/Chart';
import StatsCard from '../../components/StatsCard';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

export default function DriverEarnings() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);
  const [period, setPeriod] = useState('all');
  const [rides, setRides] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [commissionRate, setCommissionRate] = useState(20);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/driver/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'driver') {
        await supabase.auth.signOut();
        router.replace('/driver/login');
        return;
      }

      await fetchEarnings(session.user.id);
      await fetchCommissionRate();
    };

    const fetchCommissionRate = async () => {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('commission_rate')
        .single();
      if (settings?.commission_rate) setCommissionRate(settings.commission_rate);
    };

    const fetchEarnings = async (userId) => {
      setLoading(true);
      try {
        let query = supabase
          .from('rides')
          .select('*')
          .eq('driver_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });

        if (period === 'today') {
          const today = new Date().toISOString().split('T')[0];
          query = query.gte('completed_at', today);
        } else if (period === 'week') {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('completed_at', weekAgo);
        } else if (period === 'month') {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('completed_at', monthAgo);
        }

        const { data: ridesData, error } = await query;

        if (error) throw error;

        const totalEarnings = ridesData?.reduce((sum, r) => sum + (r.driver_earning || r.fare || 0), 0) || 0;
        const totalCommission = ridesData?.reduce((sum, r) => sum + (r.commission || (r.fare * commissionRate / 100) || 0), 0) || 0;
        const totalRides = ridesData?.length || 0;
        const avgFare = totalRides > 0 ? totalEarnings / totalRides : 0;

        const dailyMap = {};
        ridesData?.forEach(ride => {
          const date = new Date(ride.completed_at).toLocaleDateString();
          if (!dailyMap[date]) {
            dailyMap[date] = { date, earnings: 0, rides: 0 };
          }
          dailyMap[date].earnings += ride.driver_earning || ride.fare || 0;
          dailyMap[date].rides++;
        });

        setEarnings({ totalEarnings, totalCommission, totalRides, avgFare });
        setRides(ridesData || []);
        setDailyData(Object.values(dailyMap).reverse());
      } catch (error) {
        console.error('Earnings error:', error);
        toast.error('Failed to fetch earnings');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router, period, commissionRate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Earnings | Driver Dashboard | Maa Saraswati Travels</title>
      </Head>

      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <header className={`shadow-md sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/driver/dashboard" className={`text-2xl hover:text-orange-500 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>←</Link>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>My Earnings</h1>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`px-3 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard title="Total Earnings" value={`₹${earnings?.totalEarnings?.toFixed(2) || 0}`} icon="💰" color="green" />
            <StatsCard title="Total Rides" value={earnings?.totalRides || 0} icon="🚕" color="orange" />
            <StatsCard title="Average Fare" value={`₹${earnings?.avgFare?.toFixed(2) || 0}`} icon="📊" color="blue" />
          </div>

          {dailyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <LineChartComponent 
                data={dailyData} 
                dataKey="earnings" 
                xAxisKey="date" 
                title="Earnings Trend" 
                color="#F97316"
              />
              <BarChartComponent 
                data={dailyData} 
                dataKey="rides" 
                xAxisKey="date" 
                title="Rides Trend" 
                color="#10B981"
              />
            </div>
          )}

          <div className={`rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'bg-orange-50'}`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Ride History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pickup</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Drop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Distance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fare</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Your Earnings</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {rides.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={`px-6 py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        No rides completed in this period
                      </td>
                    </tr>
                  ) : (
                    rides.map((ride) => (
                      <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm">
                          {formatDate(ride.completed_at)}<br />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(ride.completed_at)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate">{ride.pickup_address}</td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate">{ride.drop_address}</td>
                        <td className="px-6 py-4 text-sm">{ride.distance} km</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{ride.fare}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-orange-600">₹{ride.driver_earning || (ride.fare * (100 - commissionRate) / 100).toFixed(0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}