// pages/track-ride.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { trackRide, trackDriverLocation } from '../lib/firebase';
import VehicleTracker from '../components/VehicleTracker';
import SOSButton from '../components/SOSButton';
import EmergencyContacts from '../components/EmergencyContacts';
import toast from 'react-hot-toast';

export default function TrackRide() {
  const router = useRouter();
  const { id } = router.query;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [unsubscribeRide, setUnsubscribeRide] = useState(null);
  const [unsubscribeDriver, setUnsubscribeDriver] = useState(null);

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
        console.error('Error fetching ride:', error);
        toast.error('Ride not found');
        router.push('/');
        return;
      }

      setRide(data);
      setLoading(false);

      // Track ride status in real-time
      const unsubRide = trackRide(id, (rideData) => {
        setRide(prev => ({ ...prev, ...rideData }));
        
        if (rideData.status === 'completed') {
          toast.success('Your ride has been completed!');
          setTimeout(() => router.push(`/booking-success?id=${id}`), 2000);
        }
      });
      setUnsubscribeRide(() => unsubRide);

      // Track driver location if assigned
      if (data.driver_id) {
        const unsubDriver = trackDriverLocation(data.driver_id, (location) => {
          setDriverLocation(location);
          
          if (userLocation && location) {
            const distance = calculateDistance(
              userLocation.lat, userLocation.lng,
              location.lat, location.lng
            );
            const time = Math.ceil(distance / 30 * 60);
            setDistanceRemaining(distance.toFixed(1));
            setTimeRemaining(time);
          }
        });
        setUnsubscribeDriver(() => unsubDriver);
      }
    };

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true }
      );
    }

    fetchRide();

    // Cleanup subscriptions
    return () => {
      if (unsubscribeRide && typeof unsubscribeRide === 'function') unsubscribeRide();
      if (unsubscribeDriver && typeof unsubscribeDriver === 'function') unsubscribeDriver();
    };
  }, [id, router]);

  const getStatusMessage = () => {
    switch (ride?.status) {
      case 'pending': return 'Looking for a driver near you...';
      case 'accepted': return 'Driver is on the way to your pickup location';
      case 'arrived': return 'Your driver has arrived at your location';
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

  const getStatusIcon = () => {
    switch (ride?.status) {
      case 'pending': return <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>;
      case 'accepted': return <div className="text-6xl animate-bounce">🚗</div>;
      case 'arrived': return <div className="text-6xl animate-pulse">📍</div>;
      case 'started': return <div className="text-6xl">🚘</div>;
      case 'completed': return <div className="text-6xl">✅</div>;
      case 'cancelled': return <div className="text-6xl">❌</div>;
      default: return <div className="text-6xl">🚕</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Ride Not Found</h1>
          <Link href="/" className="text-orange-500 mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Track Your Ride | Maa Saraswati Travels</title>
        <meta name="description" content="Track your ride in real-time with Maa Saraswati Travels" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Maa Saraswati Travels
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-800">Ride Status</h1>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor()}`}>
                {ride?.status || 'Pending'}
              </span>
            </div>
            
            <div className="text-center py-4">
              <div className="relative">
                <div className="w-24 h-24 mx-auto">
                  {getStatusIcon()}
                </div>
              </div>
              <p className="text-gray-700 mt-4 font-medium">{getStatusMessage()}</p>
              
              {timeRemaining && ride?.status === 'accepted' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-600">🕐 Estimated arrival: {timeRemaining} minutes</p>
                  <p className="text-sm text-blue-500">📍 Distance: {distanceRemaining} km away</p>
                </div>
              )}
            </div>
          </div>

          {/* Ride Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Ride Details</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-500">📍</span>
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="text-gray-800">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-500">📍</span>
                <div>
                  <p className="text-sm text-gray-500">Drop Location</p>
                  <p className="text-gray-800">{ride.drop_address}</p>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total Fare</span>
                <span className="text-xl font-bold text-orange-600">₹{ride.fare}</span>
              </div>
            </div>
          </div>

          {/* Driver Details */}
          {ride.driver && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Driver Details</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👨‍✈️</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{ride.driver.full_name}</p>
                  <p className="text-gray-500">{ride.driver.vehicle_number}</p>
                  <p className="text-gray-500 capitalize">{ride.driver.vehicle_type}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <a href={`tel:${ride.driver.phone}`} className="flex-1 bg-green-500 text-white text-center py-2 rounded-lg hover:bg-green-600">
                  📞 Call Driver
                </a>
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                  💬 Message
                </button>
              </div>
            </div>
          )}

          {/* Emergency Contacts */}
          <div className="mb-6">
            <EmergencyContacts userId={ride?.user_id} />
          </div>

          {/* SOS Button */}
          {ride?.status !== 'completed' && ride?.status !== 'cancelled' && (
            <div className="flex justify-center mb-6">
              <SOSButton 
                rideId={ride.id} 
                userId={ride.user_id} 
                userLocation={userLocation}
              />
            </div>
          )}

          {/* Vehicle Tracker */}
          {ride?.driver_id && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
              <VehicleTracker 
                rideId={ride.id} 
                driverId={ride.driver_id}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link href="/" className="flex-1 bg-orange-500 text-white text-center py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
              Book Another Ride
            </Link>
            <Link href="/contact" className="flex-1 border border-orange-500 text-orange-500 text-center py-3 rounded-xl font-semibold hover:bg-orange-50 transition">
              Need Help?
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}