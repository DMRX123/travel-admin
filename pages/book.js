// pages/book.js - OPTIMIZED PRODUCTION READY
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLoadScript } from '@react-google-maps/api';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import toast from 'react-hot-toast';

const libraries = ["places"];

export default function BookRide() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [distance, setDistance] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && !directionsService) {
      setDirectionsService(new google.maps.DirectionsService());
      setDirectionsRenderer(new google.maps.DirectionsRenderer());
    }
  }, [isLoaded]);

  useEffect(() => {
    if (map && directionsRenderer) {
      directionsRenderer.setMap(map);
    }
  }, [map, directionsRenderer]);

  const calculateDistance = useCallback(async () => {
    if (!pickupCoords || !dropCoords || !directionsService) {
      toast.error('Please select valid pickup and drop locations');
      return;
    }

    setCalculating(true);
    
    const request = {
      origin: { lat: pickupCoords.lat, lng: pickupCoords.lng },
      destination: { lat: dropCoords.lat, lng: dropCoords.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        const legs = result.routes[0].legs[0];
        const distInKm = legs.distance.value / 1000;
        setDistance(distInKm);
        
        if (directionsRenderer) {
          directionsRenderer.setDirections(result);
        }
        if (map && result.routes[0].bounds) {
          map.fitBounds(result.routes[0].bounds);
        }
        
        toast.success(`Distance: ${distInKm.toFixed(1)} km`);
      } else {
        toast.error('Could not calculate route');
      }
      setCalculating(false);
    });
  }, [pickupCoords, dropCoords, directionsService, map]);

  const handleProceed = () => {
    if (!pickup || !drop || distance === 0) {
      toast.error('Please calculate distance first');
      return;
    }
    router.push(`/confirm-booking?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&pickupLat=${pickupCoords?.lat}&pickupLng=${pickupCoords?.lng}&dropLat=${dropCoords?.lat}&dropLng=${dropCoords?.lng}&distance=${distance}`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Book a Ride | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Maa Saraswati Travels
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Book a Ride</h1>
              
              <div className="space-y-4 mb-6">
                <PlacesAutocomplete
                  placeholder="📍 Pickup Location"
                  value={pickup}
                  onChange={setPickup}
                  onSelect={(address, lat, lng) => {
                    setPickup(address);
                    setPickupCoords({ lat, lng });
                  }}
                />
                <PlacesAutocomplete
                  placeholder="📍 Drop Location"
                  value={drop}
                  onChange={setDrop}
                  onSelect={(address, lat, lng) => {
                    setDrop(address);
                    setDropCoords({ lat, lng });
                  }}
                />
              </div>

              <button
                onClick={calculateDistance}
                disabled={calculating || !pickupCoords || !dropCoords}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50"
              >
                {calculating ? 'Calculating...' : 'Calculate Distance & Proceed'}
              </button>

              {distance > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Distance</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{distance.toFixed(1)} km</p>
                    </div>
                    <button onClick={handleProceed} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                      Select Vehicle →
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Map */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 h-[450px] overflow-hidden">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">🗺️ Route Preview</div>
              <div 
                ref={(el) => {
                  if (el && !map && window.google) {
                    setMap(new google.maps.Map(el, {
                      center: { lat: 23.2599, lng: 77.4126 },
                      zoom: 6,
                      styles: document.documentElement.classList.contains('dark') ? [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }] : undefined,
                    }));
                  }
                }}
                className="w-full h-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}