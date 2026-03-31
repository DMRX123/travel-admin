import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRides, setActiveRides] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/driver/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'driver') {
        await supabase.auth.signOut();
        router.replace('/driver/login');
        return;
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setDriver({ ...profile, ...driverData });
      setIsOnline(driverData?.is_online || false);
      await loadData(session.user.id);
      setLoading(false);
    };

    const loadData = async (userId) => {
      const { data: rides } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', userId)
        .in('status', ['pending', 'accepted', 'arrived', 'started']);
      setActiveRides(rides || []);

      const today = new Date().toISOString().split('T')[0];
      const { data: todayRides } = await supabase
        .from('rides')
        .select('fare')
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', today);
      const todayTotal = todayRides?.reduce((sum, r) => sum + r.fare, 0) || 0;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: weekRides } = await supabase
        .from('rides')
        .select('fare')
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', weekAgo);
      const weekTotal = weekRides?.reduce((sum, r) => sum + r.fare, 0) || 0;

      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: monthRides } = await supabase
        .from('rides')
        .select('fare')
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', monthAgo);
      const monthTotal = monthRides?.reduce((sum, r) => sum + r.fare, 0) || 0;

      setEarnings({ today: todayTotal, week: weekTotal, month: monthTotal });
    };

    checkAuth();
  }, [router]);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: newStatus })
      .eq('id', driver?.id);

    if (!error) {
      setIsOnline(newStatus);
      toast.success(newStatus ? 'You are now online' : 'You are now offline');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Driver Dashboard | Maa Saraswati Travels</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <h1 className="text-xl font-bold text-gray-800">Maa Saraswati Travels - Driver</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <button
                onClick={toggleOnlineStatus}
                className={`px-4 py-2 rounded-lg text-white ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.replace('/driver/login');
                }}
                className="text-gray-600 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">Today&apos;s Earnings</p>
              <p className="text-3xl font-bold text-green-600">₹{earnings.today}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">This Week</p>
              <p className="text-3xl font-bold text-orange-600">₹{earnings.week}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">This Month</p>
              <p className="text-3xl font-bold text-blue-600">₹{earnings.month}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow mb-8">
            <div className="px-6 py-4 border-b bg-orange-50">
              <h2 className="text-xl font-semibold text-gray-800">Ride Requests</h2>
            </div>
            <div className="p-6">
              {activeRides.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isOnline ? 'No ride requests yet. Waiting for customers...' : 'Go online to receive ride requests'}
                </p>
              ) : (
                <div className="space-y-4">
                  {activeRides.map((ride) => (
                    <div key={ride.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">📍 {ride.pickup_address}</p>
                          <p className="text-sm text-gray-500 mt-1">→ {ride.drop_address}</p>
                          <p className="text-sm text-gray-500 mt-2">Fare: ₹{ride.fare} | Distance: {ride.distance} km</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Accept</button>
                          <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/driver/earnings" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
              <div className="text-3xl mb-2">💰</div><p className="font-semibold">Earnings</p>
            </Link>
            <Link href="/driver/history" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
              <div className="text-3xl mb-2">📋</div><p className="font-semibold">Ride History</p>
            </Link>
            <Link href="/driver/profile" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
              <div className="text-3xl mb-2">👤</div><p className="font-semibold">My Profile</p>
            </Link>
            <Link href="/driver/vehicle" className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
              <div className="text-3xl mb-2">🚐</div><p className="font-semibold">Vehicle Details</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}