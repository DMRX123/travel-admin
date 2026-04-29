// pages/dashboard.js - OPTIMIZED PRODUCTION READY
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalUsers: 0, totalDrivers: 0, totalRides: 0, totalRevenue: 0, activeRides: 0, pendingDrivers: 0, todayBookings: 0 });
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).single();
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
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'user');
        const { count: drivers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'driver');
        const { count: rides } = await supabase.from('rides').select('*', { count: 'exact', head: true });
        
        const { data: revenueData } = await supabase.from('rides').select('fare').eq('payment_status', 'paid');
        const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.fare || 0), 0) || 0;
        
        const { count: activeRides } = await supabase.from('rides').select('*', { count: 'exact', head: true }).in('status', ['pending', 'accepted', 'arrived', 'started']);
        const { count: pendingDrivers } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_approved', false);
        
        const today = new Date().toISOString().split('T')[0];
        const { count: todayBookings } = await supabase.from('rides').select('*', { count: 'exact', head: true }).gte('created_at', today);
        
        setStats({ totalUsers: users || 0, totalDrivers: drivers || 0, totalRides: rides || 0, totalRevenue, activeRides: activeRides || 0, pendingDrivers: pendingDrivers || 0, todayBookings: todayBookings || 0 });
        
        const { data: recentData } = await supabase.from('rides').select('id, fare, status, created_at, pickup_address, drop_address, vehicle_type, user:user_id (full_name, phone)').order('created_at', { ascending: false }).limit(10);
        setRecentRides(recentData || []);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      }
    };
    
    checkAuthAndLoad();
  }, [router]);

  const getStatusBadge = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-800', accepted: 'bg-blue-100 text-blue-800', arrived: 'bg-purple-100 text-purple-800', started: 'bg-indigo-100 text-indigo-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div></Layout>;
  }

  return (
    <>
      <Head><title>Admin Dashboard | Maa Saraswati Travels</title></Head>
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            <StatsCard title="Users" value={stats.totalUsers} icon="👥" color="blue" />
            <StatsCard title="Drivers" value={stats.totalDrivers} icon="🚗" color="orange" />
            <StatsCard title="Rides" value={stats.totalRides} icon="🚕" color="purple" />
            <StatsCard title="Revenue" value={`₹${stats.totalRevenue}`} icon="💰" color="green" />
            <StatsCard title="Active" value={stats.activeRides} icon="🔄" color="yellow" />
            <StatsCard title="Pending Drivers" value={stats.pendingDrivers} icon="⏳" color="red" />
            <StatsCard title="Today" value={stats.todayBookings} icon="📅" color="pink" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-orange-50 dark:bg-gray-700"><h2 className="text-xl font-semibold">Recent Bookings</h2></div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">ID</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Pickup</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Fare</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentRides.map(ride => (
                    <tr key={ride.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-mono">{ride.id?.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm">{ride.user?.full_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate">{ride.pickup_address}</td>
                      <td className="px-6 py-4 text-sm font-medium">₹{ride.fare}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ride.status)}`}>{ride.status}</span></td>
                      <td className="px-6 py-4 text-sm">{new Date(ride.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}