// pages/track-ride.js - UPDATED with OTP display
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
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchRide = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rides')
        .select('*, user:user_id(*), driver:driver_id(*)')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Ride not found');
        router.push('/');
        return;
      }

      setRide(data);
      setLoading(false);

      // Track driver location if assigned
      if (data.driver_id) {
        const unsubscribe = trackDriverLocation(data.driver_id, (location) => {
          setDriverLocation(location);
          
          if (location) {
            const distance = calculateDistance(
              data.pickup_lat, data.pickup_lng,
              location.lat, location.lng
            );
            const time = Math.ceil(distance / 30 * 60);
            setDistanceRemaining(distance.toFixed(1));
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
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ride Not Found</h1>
          <Link href="/" className="text-orange-500 mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Track Your Ride | Maa Saraswati Travels</title>
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
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Ride Status</h1>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor()}`}>
                {ride?.status || 'Pending'}
              </span>
            </div>
            
            <div className="text-center py-4">
              <div className="relative">
                <div className="w-24 h-24 mx-auto">
                  {ride?.status === 'pending' && <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>}
                  {ride?.status === 'accepted' && <div className="text-6xl animate-bounce">🚗</div>}
                  {ride?.status === 'arrived' && <div className="text-6xl animate-pulse">📍</div>}
                  {ride?.status === 'started' && <div className="text-6xl">🚘</div>}
                  {ride?.status === 'completed' && <div className="text-6xl">✅</div>}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-4 font-medium">{getStatusMessage()}</p>
              
              {timeRemaining && ride?.status === 'accepted' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-blue-600 dark:text-blue-400">🕐 Estimated arrival: {timeRemaining} minutes</p>
                  <p className="text-sm text-blue-500 dark:text-blue-300">📍 Distance: {distanceRemaining} km away</p>
                </div>
              )}

              {/* OTP Display for User */}
              {ride?.status === 'accepted' && ride?.otp_code && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">Share this OTP with your driver:</p>
                  <p className="text-3xl font-mono font-bold text-yellow-700 dark:text-yellow-400 mt-1">{ride.otp_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ride Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Ride Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-500">📍</span>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pickup Location</p>
                  <p className="text-gray-800 dark:text-gray-200">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500">📍</span>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Drop Location</p>
                  <p className="text-gray-800 dark:text-gray-200">{ride.drop_address}</p>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                <span className="font-semibold text-gray-800 dark:text-white">Total Fare</span>
                <span className="text-xl font-bold text-orange-600 dark:text-orange-400">₹{ride.fare}</span>
              </div>
            </div>
          </div>

          {/* Driver Details */}
          {ride.driver && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Driver Details</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍✈️</span>
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-800 dark:text-white">{ride.driver.full_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{ride.driver.vehicle_number}</p>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">{ride.driver.vehicle_type}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <a href={`tel:${ride.driver.phone}`} className="flex-1 bg-green-500 text-white text-center py-2 rounded-lg hover:bg-green-600 transition">
                  📞 Call Driver
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link href="/" className="flex-1 bg-orange-500 text-white text-center py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
              Book Another Ride
            </Link>
            <Link href="/contact" className="flex-1 border border-orange-500 text-orange-500 text-center py-3 rounded-xl font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
              Need Help?
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}