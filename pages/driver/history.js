import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';

export default function DriverHistory() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState([]);
  const [filter, setFilter] = useState('all');

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

      await fetchRides(session.user.id);
    };

    const fetchRides = async (userId) => {
      setLoading(true);
      let query = supabase
        .from('rides')
        .select('*')
        .eq('driver_id', userId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (!error) {
        setRides(data || []);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router, filter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Ride History | Driver Dashboard | Maa Saraswati Travels</title>
      </Head>

      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <header className={`shadow-md sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/driver/dashboard" className={`text-2xl hover:text-orange-500 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>←</Link>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Ride History</h1>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-3 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Rides</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {rides.length === 0 ? (
              <div className={`rounded-xl p-8 text-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                No rides found
              </div>
            ) : (
              rides.map((ride) => (
                <div key={ride.id} className={`rounded-xl shadow p-4 hover:shadow-md transition ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ride.status)}`}>
                          {ride.status}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(ride.created_at)}</span>
                      </div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>📍 {ride.pickup_address}</p>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>→ {ride.drop_address}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>📏 {ride.distance} km</span>
                        <span className="text-green-600">💰 ₹{ride.fare}</span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>🚗 {ride.vehicle_type}</span>
                        {ride.payment_method && <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>💳 {ride.payment_method}</span>}
                      </div>
                      {ride.otp_code && ride.status === 'accepted' && (
                        <div className={`mt-2 text-xs font-mono inline-block px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          OTP: {ride.otp_code}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {ride.status === 'completed' && (
                        <div className="text-green-600 font-semibold">Earned ₹{ride.driver_earning || ride.fare}</div>
                      )}
                      {ride.status === 'cancelled' && (
                        <div className="text-red-600">Cancelled</div>
                      )}
                      {ride.status === 'accepted' && (
                        <div className="text-blue-600">Accepted</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}