// pages/driver/dashboard.js - EXCELLENT WITH REALTIME UPDATES
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { updateDriverLocation, trackRide, updateRideStatus as updateFirebaseRideStatus } from '../../lib/firebase';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DriverBadges from '../../components/DriverBadges';
import { useTheme } from '../../context/ThemeContext';

export default function DriverDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRides, setActiveRides] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [currentRide, setCurrentRide] = useState(null);
  const [locationInterval, setLocationInterval] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [acceptingRide, setAcceptingRide] = useState(null);
  const [rideSubscription, setRideSubscription] = useState(null);
  const [requestSubscription, setRequestSubscription] = useState(null);

  // Load data function
  const loadData = useCallback(async (userId) => {
    await loadRideRequests(userId);
    await loadCurrentRide(userId);
    await loadEarnings(userId);
  }, []);

  const loadRideRequests = useCallback(async (userId) => {
    const { data: requests } = await supabase
      .from('ride_requests')
      .select(`
        *,
        ride:ride_id (
          id, pickup_address, drop_address, fare, distance, vehicle_type, created_at, otp_code
        )
      `)
      .eq('driver_id', userId)
      .eq('status', 'pending')
      .gt('timeout_at', new Date().toISOString())
      .order('created_at', { ascending: true });
    
    setRideRequests(requests || []);
  }, []);

  const loadCurrentRide = useCallback(async (userId) => {
    const { data: ride } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', userId)
      .in('status', ['accepted', 'arrived', 'started'])
      .maybeSingle();
    
    setCurrentRide(ride);
    
    // Subscribe to real-time updates for current ride
    if (ride && rideSubscription) {
      rideSubscription.unsubscribe();
    }
    
    if (ride) {
      const subscription = supabase
        .channel(`ride-${ride.id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${ride.id}` },
          (payload) => {
            if (payload.new.status !== ride.status) {
              setCurrentRide(payload.new);
              if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
                loadData(userId);
                loadEarnings(userId);
              }
            }
          }
        )
        .subscribe();
      setRideSubscription(subscription);
    }
  }, [rideSubscription, loadData]);

  const loadEarnings = useCallback(async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayRides } = await supabase
      .from('rides')
      .select('driver_earning, fare')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', today);
    
    const todayTotal = todayRides?.reduce((s, r) => s + (r.driver_earning || r.fare || 0), 0) || 0;
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: weekRides } = await supabase
      .from('rides')
      .select('driver_earning, fare')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo);
    
    const weekTotal = weekRides?.reduce((s, r) => s + (r.driver_earning || r.fare || 0), 0) || 0;
    
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: monthRides } = await supabase
      .from('rides')
      .select('driver_earning, fare')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', monthAgo);
    
    const monthTotal = monthRides?.reduce((s, r) => s + (r.driver_earning || r.fare || 0), 0) || 0;
    
    setEarnings({ today: todayTotal, week: weekTotal, month: monthTotal });
  }, []);

  // Location tracking
  const startLocationTracking = useCallback((userId) => {
    if (!navigator.geolocation) return;
    
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        
        await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latitude, lng: longitude, bearing: heading, speed: speed || 0 }),
        });
      }, (error) => {
        console.error('Location error:', error);
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    }, 10000);
    
    setLocationInterval(interval);
  }, []);

  // Auth check and initialization
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
      
      if (driverData?.is_online) {
        startLocationTracking(session.user.id);
      }
      
      await loadData(session.user.id);
      
      // Subscribe to ride requests
      const subscription = supabase
        .channel('driver-requests')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'ride_requests', filter: `driver_id=eq.${session.user.id}` },
          (payload) => {
            if (isOnline && payload.new.status === 'pending') {
              loadRideRequests(session.user.id);
              toast.success('📢 New ride request!', { duration: 8000, icon: '🚕' });
            }
          }
        )
        .subscribe();
      
      setRequestSubscription(subscription);
      setLoading(false);
    };
    
    checkAuth();
    
    return () => {
      if (locationInterval) clearInterval(locationInterval);
      if (rideSubscription) rideSubscription.unsubscribe();
      if (requestSubscription) requestSubscription.unsubscribe();
    };
  }, [router, isOnline, startLocationTracking, loadData, loadRideRequests]);

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
        toast.success('🟢 You are now online', { icon: '✅' });
      } else {
        if (locationInterval) clearInterval(locationInterval);
        toast.success('🔴 You are now offline', { icon: '⭕' });
      }
    }
  };

  const acceptRide = async (request) => {
    setAcceptingRide(request.ride_id);
    
    try {
      const response = await fetch('/api/ride-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: request.ride_id,
          driverId: driver.id,
          action: 'accept'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('✅ Ride accepted! Navigate to pickup.');
        await loadRideRequests(driver.id);
        await loadCurrentRide(driver.id);
      } else {
        toast.error(data.message || 'Ride already taken');
        await loadRideRequests(driver.id);
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('Failed to accept ride');
    } finally {
      setAcceptingRide(null);
    }
  };

  const rejectRide = async (rideId) => {
    try {
      await fetch('/api/ride-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          driverId: driver.id,
          action: 'reject'
        }),
      });
      
      toast('Ride request rejected', { icon: '👎' });
      await loadRideRequests(driver.id);
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const updateRideStatusAction = async (newStatus) => {
    if (!currentRide) return;
    
    const statusMessages = {
      arrived: { title: 'Arrived at pickup', color: 'purple' },
      started: { title: 'Ride started!', color: 'green' },
      completed: { title: 'Ride completed!', color: 'green' },
      cancelled: { title: 'Ride cancelled', color: 'red' }
    };
    
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          status: newStatus,
          [`${newStatus}_at`]: new Date().toISOString()
        })
        .eq('id', currentRide.id);
      
      if (!error) {
        toast.success(statusMessages[newStatus]?.title || `Ride ${newStatus}`);
        await updateFirebaseRideStatus(currentRide.id, newStatus);
        await loadCurrentRide(driver.id);
        if (newStatus === 'completed') {
          await loadEarnings(driver.id);
        }
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const vehicleIcons = { auto: '🛺', sedan: '🚗', suv: '🚙', luxury: '🚘', tempo: '🚐', bike: '🏍️' };

  return (
    <>
      <Head><title>Driver Dashboard | Maa Saraswati Travels</title></Head>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <header className={`shadow-md sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2"><span className="text-2xl">🚗</span><h1 className="text-xl font-bold">Driver Dashboard</h1></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span><span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span></div>
              <button onClick={toggleOnlineStatus} className={`px-4 py-2 rounded-lg text-white transition ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>{isOnline ? 'Go Offline' : 'Go Online'}</button>
              <button onClick={async () => { await supabase.auth.signOut(); router.replace('/driver/login'); }} className="text-red-500 hover:text-red-600">Logout</button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Earnings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-xl shadow p-6 bg-white dark:bg-gray-800"><p className="text-sm text-gray-500">Today's Earnings</p><p className="text-3xl font-bold text-green-600">₹{earnings.today}</p></div>
            <div className="rounded-xl shadow p-6 bg-white dark:bg-gray-800"><p className="text-sm text-gray-500">This Week</p><p className="text-3xl font-bold text-orange-600">₹{earnings.week}</p></div>
            <div className="rounded-xl shadow p-6 bg-white dark:bg-gray-800"><p className="text-sm text-gray-500">This Month</p><p className="text-3xl font-bold text-blue-600">₹{earnings.month}</p></div>
          </div>

          {/* Driver Badges */}
          <div className="mb-8"><DriverBadges driverStats={{ totalRides: driver?.total_trips || 0, rating: driver?.rating || 0, totalEarnings: driver?.earnings || 0, onTimeRate: 95, safetyRating: 100 }} /></div>

          {/* Current Ride */}
          {currentRide && (
            <div className="rounded-xl shadow mb-8 bg-white dark:bg-gray-800">
              <div className="px-6 py-4 border-b bg-green-50 dark:bg-green-900/30"><h2 className="text-xl font-semibold">Current Ride</h2></div>
              <div className="p-6 space-y-3">
                <p><strong>📍 Pickup:</strong> {currentRide.pickup_address}</p><p><strong>📍 Drop:</strong> {currentRide.drop_address}</p><p><strong>💰 Fare:</strong> ₹{currentRide.fare} | <strong>📏 Distance:</strong> {currentRide.distance} km</p>
                <p><strong>🔑 OTP:</strong> <span className="font-mono text-xl">{currentRide.otp_code}</span></p>
                <div className="flex gap-3 flex-wrap">
                  {currentRide.status === 'accepted' && <button onClick={() => updateRideStatusAction('arrived')} className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">🚩 Arrived at Pickup</button>}
                  {currentRide.status === 'arrived' && <button onClick={() => updateRideStatusAction('started')} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">▶️ Start Ride</button>}
                  {currentRide.status === 'started' && <button onClick={() => updateRideStatusAction('completed')} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">✅ Complete Ride</button>}
                  <button onClick={() => updateRideStatusAction('cancelled')} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">❌ Cancel Ride</button>
                </div>
              </div>
            </div>
          )}

          {/* Ride Requests */}
          <div className="rounded-xl shadow bg-white dark:bg-gray-800">
            <div className="px-6 py-4 border-b bg-orange-50 dark:bg-orange-900/30"><h2 className="text-xl font-semibold flex items-center gap-2">📢 Ride Requests {rideRequests.length > 0 && <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">{rideRequests.length}</span>}</h2></div>
            <div className="p-6">
              {!isOnline ? (
                <div className="text-center py-8"><p>Go online to receive ride requests</p><button onClick={toggleOnlineStatus} className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg">Go Online</button></div>
              ) : rideRequests.length === 0 ? (
                <div className="text-center py-8"><div className="text-5xl mb-3">🚗</div><p>No ride requests yet</p><p className="text-sm text-gray-500">Stay online to get requests</p></div>
              ) : (
                <div className="space-y-4">
                  {rideRequests.map((request) => (
                    <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{vehicleIcons[request.ride?.vehicle_type] || '🚗'}</span><span className="font-semibold capitalize">{request.ride?.vehicle_type} Ride</span><span className="text-orange-500 text-sm">{request.distance_to_pickup?.toFixed(1)} km away</span></div>
                          <p className="text-sm">📍 {request.ride?.pickup_address?.substring(0, 60)}...</p>
                          <p className="text-sm mt-1 text-gray-500">→ {request.ride?.drop_address?.substring(0, 60)}...</p>
                          <div className="flex gap-3 mt-2 text-sm"><span className="text-green-600">💰 ₹{request.ride?.fare}</span><span className="text-gray-500">📏 {request.ride?.distance} km</span></div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => acceptRide(request)} disabled={acceptingRide === request.ride_id} className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold disabled:opacity-50">{acceptingRide === request.ride_id ? 'Accepting...' : 'ACCEPT'}</button>
                          <button onClick={() => rejectRide(request.ride_id)} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600">REJECT</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Link href="/driver/earnings" className="rounded-xl shadow p-4 text-center hover:shadow-md transition bg-white dark:bg-gray-800"><div className="text-3xl mb-2">💰</div><p className="font-semibold">Earnings</p></Link>
            <Link href="/driver/history" className="rounded-xl shadow p-4 text-center hover:shadow-md transition bg-white dark:bg-gray-800"><div className="text-3xl mb-2">📋</div><p className="font-semibold">Ride History</p></Link>
            <Link href="/driver/profile" className="rounded-xl shadow p-4 text-center hover:shadow-md transition bg-white dark:bg-gray-800"><div className="text-3xl mb-2">👤</div><p className="font-semibold">My Profile</p></Link>
            <Link href="/driver/vehicle" className="rounded-xl shadow p-4 text-center hover:shadow-md transition bg-white dark:bg-gray-800"><div className="text-3xl mb-2">🚐</div><p className="font-semibold">Vehicle</p></Link>
          </div>
        </div>
      </div>
    </>
  );
}