import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { updateDriverLocation, updateRideStatus, trackRide } from '../../lib/firebase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DriverBadges from '../../components/DriverBadges';

export default function DriverDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRides, setActiveRides] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [currentRide, setCurrentRide] = useState(null);
  const [locationInterval, setLocationInterval] = useState(null);

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
      
      // Start location tracking if online
      if (driverData?.is_online) {
        startLocationTracking(session.user.id);
      }
      
      await loadData(session.user.id);
      
      // Subscribe to real-time ride requests
      const subscription = supabase
        .channel('driver-rides')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'rides', filter: `status=eq.pending` },
          (payload) => {
            if (isOnline) {
              toast.success('New ride request!');
              loadData(session.user.id);
            }
          }
        )
        .subscribe();
      
      setLoading(false);
      
      return () => {
        subscription.unsubscribe();
        if (locationInterval) clearInterval(locationInterval);
      };
    };

    const loadData = async (userId) => {
      // Get pending ride requests
      const { data: pendingRides } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setActiveRides(pendingRides || []);

      // Get today's earnings
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRides } = await supabase
        .from('rides')
        .select('fare')
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', today);
      const todayTotal = todayRides?.reduce((sum, r) => sum + (r.fare || 0), 0) || 0;

      // Get current ride with rating
      const { data: current } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', userId)
        .in('status', ['accepted', 'arrived', 'started', 'completed'])
        .single();
      
      setCurrentRide(current);
      
      setEarnings(prev => ({ ...prev, today: todayTotal }));
    };

    const startLocationTracking = (userId) => {
      if (!navigator.geolocation) return;
      
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
        }, (error) => {
          console.error('Location error:', error);
        }, { enableHighAccuracy: true, maximumAge: 5000 });
      }, 10000); // Update every 10 seconds
      
      setLocationInterval(interval);
    };

    checkAuth();
  }, [router, isOnline]);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: newStatus })
      .eq('id', driver?.id);

    if (!error) {
      setIsOnline(newStatus);
      if (newStatus) {
        startLocationTracking(driver?.id);
        toast.success('You are now online');
      } else {
        if (locationInterval) clearInterval(locationInterval);
        toast.success('You are now offline');
      }
    }
  };

  const acceptRide = async (ride) => {
    const { error } = await supabase
      .from('rides')
      .update({ 
        driver_id: driver.id, 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', ride.id);

    if (!error) {
      // Initialize ride tracking in Firebase
      await fetch('/api/init-ride-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: ride.id,
          driverId: driver.id,
          pickup: { lat: ride.pickup_lat, lng: ride.pickup_lng },
          drop: { lat: ride.drop_lat, lng: ride.drop_lng }
        }),
      });
      
      toast.success('Ride accepted!');
      loadData(driver.id);
      setCurrentRide(ride);
    }
  };

  const updateRideStatus = async (newStatus) => {
    if (!currentRide) return;
    
    const updates = { status: newStatus };
    if (newStatus === 'started') {
      updates.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', currentRide.id);

    if (!error) {
      await updateRideStatus(currentRide.id, newStatus);
      toast.success(`Ride ${newStatus}`);
      
      if (newStatus === 'completed') {
        setCurrentRide(null);
      }
      loadData(driver.id);
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
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
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
          {/* Earnings Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">Today's Earnings</p>
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

          {/* Driver Badges Section */}
          <div className="mb-8">
            <DriverBadges driverStats={{
              totalRides: driver?.total_trips || 0,
              rating: driver?.rating || 0,
              totalEarnings: driver?.earnings || 0,
              onTimeRate: 95,
              safetyRating: 100
            }} />
          </div>

          {/* Current Ride Section */}
          {currentRide && (
            <div className="bg-white rounded-xl shadow mb-8">
              <div className="px-6 py-4 border-b bg-green-50">
                <h2 className="text-xl font-semibold text-gray-800">Current Ride</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <p><strong>📍 Pickup:</strong> {currentRide.pickup_address}</p>
                  <p><strong>📍 Drop:</strong> {currentRide.drop_address}</p>
                  <p><strong>💰 Fare:</strong> ₹{currentRide.fare}</p>
                  <p><strong>📏 Distance:</strong> {currentRide.distance} km</p>
                  
                  {currentRide?.rating && (
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={star <= currentRide.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">({currentRide.rating})</span>
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-4">
                    {currentRide.status === 'accepted' && (
                      <button
                        onClick={() => updateRideStatus('arrived')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        Arrived at Pickup
                      </button>
                    )}
                    {currentRide.status === 'arrived' && (
                      <button
                        onClick={() => updateRideStatus('started')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                      >
                        Start Ride
                      </button>
                    )}
                    {currentRide.status === 'started' && (
                      <button
                        onClick={() => updateRideStatus('completed')}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                      >
                        Complete Ride
                      </button>
                    )}
                    <button
                      onClick={() => updateRideStatus('cancelled')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Cancel Ride
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ride Requests Section */}
          <div className="bg-white rounded-xl shadow">
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
                          <p className="text-xs text-orange-500 mt-1">Trip Type: {ride.trip_type || 'One Way'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptRide(ride)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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