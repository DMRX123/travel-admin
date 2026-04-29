// pages/track-ride.js - OPTIMIZED PRODUCTION READY
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { trackDriverLocation } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function TrackRide() {
  const router = useRouter();
  const { id } = router.query;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchRide = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rides')
        .select('*, user:user_id(*), driver:driver_id(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast.error('Ride not found');
        router.push('/');
        return;
      }

      setRide(data);
      setLoading(false);

      if (data.driver_id) {
        const unsubscribe = trackDriverLocation(data.driver_id, (location) => {
          setDriverLocation(location);
          if (location && data.pickup_lat && data.pickup_lng) {
            const distance = calculateDistance(data.pickup_lat, data.pickup_lng, location.lat, location.lng);
            const time = Math.ceil(distance / 30 * 60);
            setTimeRemaining(time);
          }
        });
        return () => unsubscribe();
      }
    };

    fetchRide();
  }, [id, router]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getStatusMessage = () => {
    switch (ride?.status) {
      case 'pending': return 'Looking for a driver near you...';
      case 'accepted': return 'Driver is on the way to your pickup location';
      case 'arrived': return 'Your driver has arrived!';
      case 'started': return 'Your ride has started!';
      case 'completed': return 'Ride completed! Thank you for choosing us.';
      case 'cancelled': return 'This ride has been cancelled.';
      default: return 'Tracking your ride...';
    }
  };

  const getStatusColor = () => {
    switch (ride?.status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'arrived': return 'bg-purple-500';
      case 'started': return 'bg-green-500';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!ride) return null;

  return (
    <>
      <Head>
        <title>Track Your Ride | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Maa Saraswati Travels
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Ride Status</h1>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor()}`}>{ride.status}</span>
            </div>
            
            <div className="text-center py-4">
              <div className="relative">
                <div className="w-24 h-24 mx-auto">
                  {ride.status === 'pending' && <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>}
                  {ride.status === 'accepted' && <div className="text-6xl animate-bounce">🚗</div>}
                  {ride.status === 'arrived' && <div className="text-6xl animate-pulse">📍</div>}
                  {ride.status === 'started' && <div className="text-6xl">🚘</div>}
                  {ride.status === 'completed' && <div className="text-6xl">✅</div>}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-4 font-medium">{getStatusMessage()}</p>
              
              {timeRemaining && ride.status === 'accepted' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-blue-600 dark:text-blue-400">🕐 Estimated arrival: {timeRemaining} minutes</p>
                </div>
              )}

              {ride.otp_code && ride.status === 'accepted' && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-yellow-600 dark:text-yellow-400">Share this OTP with driver:</p>
                  <p className="text-2xl font-mono font-bold">{ride.otp_code}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Ride Details</h2>
            <div className="space-y-3">
              <div className="flex gap-3"><span className="text-green-500">📍</span><div><p className="text-sm text-gray-500">Pickup</p><p>{ride.pickup_address}</p></div></div>
              <div className="flex gap-3"><span className="text-red-500">📍</span><div><p className="text-sm text-gray-500">Drop</p><p>{ride.drop_address}</p></div></div>
              <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Total Fare</span><span className="text-xl font-bold text-orange-600">₹{ride.fare}</span></div>
            </div>
          </div>

          {ride.driver && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Driver Details</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center text-2xl">👨‍✈️</div>
                <div><p className="font-semibold text-lg">{ride.driver.full_name}</p><p className="text-gray-500">{ride.driver.vehicle_number}</p></div>
              </div>
              <a href={`tel:${ride.driver.phone}`} className="mt-4 block bg-green-500 text-white text-center py-2 rounded-lg hover:bg-green-600">📞 Call Driver</a>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/" className="flex-1 bg-orange-500 text-white text-center py-3 rounded-xl font-semibold">Book Another Ride</Link>
            <Link href="/contact" className="flex-1 border border-orange-500 text-orange-500 text-center py-3 rounded-xl font-semibold">Need Help?</Link>
          </div>
        </div>
      </div>
    </>
  );
}