// pages/index.js - OPTIMIZED PRODUCTION READY
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useLoadScript } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { supabase, calculateFare, getSurgeMultiplier, VEHICLE_TYPES } from '../lib/supabase';

const libraries = ["places"];

// Static data for performance
const destinations = [
  { name: "Ujjain Mahakaleshwar", slug: "ujjain-mahakaleshwar", icon: "🕉️", color: "from-orange-500 to-red-500" },
  { name: "Omkareshwar", slug: "omkareshwar", icon: "🕉️", color: "from-purple-500 to-pink-500" },
  { name: "Khajuraho", slug: "khajuraho", icon: "🏛️", color: "from-amber-500 to-orange-500" },
  { name: "Ayodhya", slug: "ayodhya", icon: "🛕", color: "from-red-500 to-orange-500" },
  { name: "Varanasi", slug: "kashi", icon: "🕉️", color: "from-yellow-500 to-orange-500" },
];

const features = [
  { icon: "🚗", title: "500+ Cars", desc: "Wide range of vehicles" },
  { icon: "⭐", title: "4.8 Rating", desc: "5000+ happy customers" },
  { icon: "💰", title: "Best Price", desc: "No hidden charges" },
  { icon: "🕐", title: "24/7 Support", desc: "Always available" },
];

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [vehicle, setVehicle] = useState('sedan');
  const [distance, setDistance] = useState(0);
  const [fare, setFare] = useState(0);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [showFare, setShowFare] = useState(false);
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

  const calculateDistanceAndFare = useCallback(async () => {
    if (!pickupCoords || !dropCoords || !directionsService) {
      toast.error(t('selectValidLocations'));
      return;
    }

    setCalculating(true);
    
    const request = {
      origin: { lat: pickupCoords.lat, lng: pickupCoords.lng },
      destination: { lat: dropCoords.lat, lng: dropCoords.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, async (result, status) => {
      if (status === 'OK') {
        const legs = result.routes[0].legs[0];
        const distInKm = legs.distance.value / 1000;
        
        setDistance(distInKm);
        
        const surge = await getSurgeMultiplier('default', vehicle);
        setSurgeMultiplier(surge);
        
        const calculatedFare = calculateFare(vehicle, distInKm, surge);
        setFare(calculatedFare);
        setShowFare(true);
        
        if (directionsRenderer) {
          directionsRenderer.setDirections(result);
        }
        
        if (map && result.routes[0].bounds) {
          map.fitBounds(result.routes[0].bounds);
        }
        
        toast.success(`${t('fare')}: ₹${calculatedFare}`);
      } else {
        toast.error('Could not calculate route');
      }
      setCalculating(false);
    });
  }, [pickupCoords, dropCoords, directionsService, vehicle, map, t]);

  const handleBook = () => {
    if (!pickup || !drop) {
      toast.error(t('selectValidLocations'));
      return;
    }
    if (!fare || fare === 0) {
      toast.error('Please calculate fare first');
      return;
    }
    router.push(`/confirm-booking?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=${vehicle}&distance=${distance}&fare=${fare}&surge=${surgeMultiplier}&pickupLat=${pickupCoords?.lat}&pickupLng=${pickupCoords?.lng}&dropLat=${dropCoords?.lat}&dropLng=${dropCoords?.lng}`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Maa Saraswati Travels - Best Taxi Service in India</title>
        <meta name="description" content="Book taxi for Ujjain, Omkareshwar, Khajuraho, Ayodhya, Varanasi. Real-time fare, GPS tracking, professional drivers." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://maasaraswatitravels.com" />
      </Head>

      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-100 via-gray-50 to-white'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'bg-white/10 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-gray-200'}`}>
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚐</span>
              <h1 className={`text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent`}>
                Maa Saraswati Travels
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
              <a href="tel:+919876543210" className="hidden md:flex bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm hover:bg-orange-600">
                📞 24/7 Support
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <h1 className={`text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent`}>
                Book Your Ride Instantly
              </h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                Real-time fare • GPS tracking • Professional drivers • 24/7 service
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className={`${theme === 'dark' ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white shadow-xl border-gray-200'} rounded-2xl p-6 border`}>
                <h2 className={`text-xl font-bold mb-5 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Book a Ride</h2>
                
                <div className="space-y-4 mb-5">
                  <PlacesAutocomplete placeholder="📍 Pickup Location" value={pickup} onChange={setPickup} onSelect={(addr, lat, lng) => { setPickup(addr); setPickupCoords({ lat, lng }); }} />
                  <PlacesAutocomplete placeholder="📍 Drop Location" value={drop} onChange={setDrop} onSelect={(addr, lat, lng) => { setDrop(addr); setDropCoords({ lat, lng }); }} />
                </div>

                {/* Vehicle Selection */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-5">
                  {Object.entries(VEHICLE_TYPES).map(([key, v]) => (
                    <button key={key} onClick={() => setVehicle(v.id)} className={`p-2 rounded-xl text-center transition-all ${vehicle === v.id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : theme === 'dark' ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                      <div className="text-xl">{v.icon}</div>
                      <div className="text-xs font-semibold capitalize">{v.name}</div>
                      <div className="text-[10px]">₹{v.perKm}/km</div>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button onClick={calculateDistanceAndFare} disabled={calculating || !pickupCoords || !dropCoords} className={`flex-1 ${theme === 'dark' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'} py-2.5 rounded-xl font-semibold disabled:opacity-50`}>
                    {calculating ? '...' : 'Calculate Fare'}
                  </button>
                  <button onClick={handleBook} disabled={!fare || fare === 0} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50">
                    Book Now →
                  </button>
                </div>

                {/* Fare Display */}
                {showFare && fare > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">Estimated Fare</p>
                        {surgeMultiplier > 1 && <span className="text-xs bg-red-500 px-1 rounded">⚡{surgeMultiplier}x</span>}
                        <p className="text-2xl font-bold text-green-400">₹{fare}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>Distance: {distance.toFixed(1)} km</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Map */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className={`${theme === 'dark' ? 'bg-white/10 backdrop-blur-xl border-white/20' : 'bg-white shadow-xl border-gray-200'} rounded-2xl p-4 border h-[450px] overflow-hidden`}>
                <div ref={(el) => {
                  if (el && !map && window.google) {
                    setMap(new google.maps.Map(el, {
                      center: { lat: 23.2599, lng: 77.4126 },
                      zoom: 6,
                      styles: theme === 'dark' ? [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }] : undefined,
                    }));
                  }
                }} className="w-full h-full rounded-xl" />
              </motion.div>
            </div>
          </div>
        </main>

        {/* Destinations Section */}
        <section className="py-12 bg-white/5">
          <div className="container mx-auto px-4">
            <h2 className={`text-2xl md:text-3xl font-bold text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Explore Sacred India</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {destinations.map((dest) => (
                <Link key={dest.slug} href={`/tour/${dest.slug}`}>
                  <div className={`bg-gradient-to-r ${dest.color} rounded-xl p-4 text-white text-center hover:shadow-xl transition cursor-pointer`}>
                    <div className="text-3xl mb-2">{dest.icon}</div>
                    <p className="text-sm font-semibold">{dest.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className={`text-2xl md:text-3xl font-bold text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Why Choose Us?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <div key={i} className={`${theme === 'dark' ? 'bg-white/10' : 'bg-white shadow'} rounded-xl p-4 text-center`}>
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`py-8 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>&copy; 2025 Maa Saraswati Travels. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}