import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useLoadScript } from '@react-google-maps/api';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import VehicleTracker from '../components/VehicleTracker';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NotificationBell from '../components/NotificationBell';
import VoiceSearch from '../components/VoiceSearch';
import ThemeToggle from '../components/ThemeToggle';
import SavedPlaces from '../components/SavedPlaces';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import ReferralCard from '../components/ReferralCard';
import LiveChat from '../components/LiveChat';
import { supabase } from '../lib/supabase';

const libraries = ["places"];

const vehicleRates = {
  auto: 10,
  sedan: 15,
  suv: 20,
  luxury: 30,
  tempo: 25,
};

const mpDestinations = [
  { name: "Ujjain Mahakaleshwar", city: "Ujjain", slug: "ujjain-mahakaleshwar", type: "Jyotirlinga", icon: "🕉️", lat: 23.1798, lng: 75.7883, color: "from-orange-500 to-red-500" },
  { name: "Omkareshwar", city: "Khandwa", slug: "omkareshwar", type: "Jyotirlinga", icon: "🕉️", lat: 22.2453, lng: 76.1511, color: "from-purple-500 to-pink-500" },
  { name: "Khajuraho", city: "Chhatarpur", slug: "khajuraho", type: "UNESCO Temple", icon: "🏛️", lat: 24.8318, lng: 79.9199, color: "from-amber-500 to-orange-500" },
  { name: "Bandhavgarh", city: "Umaria", slug: "bandhavgarh", type: "National Park", icon: "🐅", lat: 23.6898, lng: 80.9624, color: "from-green-500 to-emerald-500" },
  { name: "Sanchi Stupa", city: "Raisen", slug: "sanchi-stupa", type: "Buddhist Site", icon: "🕊️", lat: 23.4794, lng: 77.7396, color: "from-blue-500 to-cyan-500" },
  { name: "Pachmarhi", city: "Hoshangabad", slug: "pachmarhi", type: "Hill Station", icon: "⛰️", lat: 22.4684, lng: 78.4346, color: "from-teal-500 to-green-500" },
  { name: "Ayodhya", city: "Ayodhya", slug: "ayodhya", type: "Temple", icon: "🛕", lat: 26.8015, lng: 82.2022, color: "from-red-500 to-orange-500" },
  { name: "Varanasi", city: "Varanasi", slug: "kashi", type: "Spiritual", icon: "🕉️", lat: 25.3176, lng: 82.9739, color: "from-yellow-500 to-orange-500" },
  { name: "Mathura-Vrindavan", city: "Mathura", slug: "mathura-vrindavan", type: "Pilgrimage", icon: "🙏", lat: 27.4924, lng: 77.6737, color: "from-blue-500 to-indigo-500" },
];

const popularRoutes = [
  { from: "Indore", to: "Ujjain", price: "₹850", distance: "55 km", time: "1.5 hours" },
  { from: "Indore", to: "Omkareshwar", price: "₹1,150", distance: "77 km", time: "2 hours" },
  { from: "Bhopal", to: "Sanchi", price: "₹700", distance: "46 km", time: "1 hour" },
  { from: "Jabalpur", to: "Bandhavgarh", price: "₹2,500", distance: "165 km", time: "3.5 hours" },
  { from: "Khajuraho", to: "Orchha", price: "₹300", distance: "18 km", time: "30 min" },
  { from: "Bhopal", to: "Ujjain", price: "₹2,850", distance: "190 km", time: "4 hours" },
  { from: "Delhi", to: "Jaipur", price: "₹2,500", distance: "280 km", time: "5 hours" },
  { from: "Mumbai", to: "Pune", price: "₹1,800", distance: "150 km", time: "2.5 hours" },
  { from: "Delhi", to: "Agra", price: "₹2,000", distance: "230 km", time: "3.5 hours" },
  { from: "Ahmedabad", to: "Statue of Unity", price: "₹2,200", distance: "200 km", time: "3.5 hours" },
  { from: "Pune", to: "Mahabaleshwar", price: "₹1,800", distance: "120 km", time: "2.5 hours" },
  { from: "Mumbai", to: "Shirdi", price: "₹3,600", distance: "240 km", time: "4.5 hours" },
];

export default function HomePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [vehicle, setVehicle] = useState('sedan');
  const [distance, setDistance] = useState(0);
  const [fare, setFare] = useState(0);
  const [duration, setDuration] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [showFare, setShowFare] = useState(false);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [map, setMap] = useState(null);
  const [showVehicleTracker, setShowVehicleTracker] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');

  const { isLoaded, loadError } = useLoadScript({
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else {
          setUserName(session.user.email?.split('@')[0] || 'User');
        }
      }
    };
    getUser();
  }, []);

  const calculateDistanceAndFare = async () => {
    if (!pickupCoords || !dropCoords || !directionsService) {
      toast.error('Please select valid pickup and drop locations from suggestions');
      return;
    }

    setCalculating(true);
    
    const request = {
      origin: { lat: pickupCoords.lat, lng: pickupCoords.lng },
      destination: { lat: dropCoords.lat, lng: dropCoords.lng },
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        const route = result.routes[0];
        const legs = route.legs[0];
        const distInKm = legs.distance.value / 1000;
        const timeInMinutes = legs.duration.value / 60;
        
        setDistance(distInKm);
        setDuration(`${Math.floor(timeInMinutes)} min`);
        
        const rate = vehicleRates[vehicle] || 15;
        const calculatedFare = distInKm * rate;
        setFare(calculatedFare);
        setShowFare(true);
        
        if (directionsRenderer) {
          directionsRenderer.setDirections(result);
        }
        
        if (map && result.routes[0].bounds) {
          map.fitBounds(result.routes[0].bounds);
        }
        
        toast.success(`Fare calculated: ₹${calculatedFare.toFixed(2)}`);
      } else {
        console.error('Directions request failed due to ' + status);
        toast.error('Could not calculate route. Please check locations.');
      }
      setCalculating(false);
    });
  };

  const handleSearch = () => {
    if (!pickup || !drop) {
      toast.error('Please enter pickup and drop locations');
      return;
    }
    if (!fare || fare === 0) {
      toast.error('Please calculate fare first');
      return;
    }
    router.push(`/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=${vehicle}&distance=${distance}&fare=${fare}`);
  };

  const handleCreateTrip = () => {
    router.push('/trip/create');
  };

  if (loadError) return <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">Error loading maps. Please check your API key.</div>;
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div><p className="ml-4 text-white">Loading Google Maps...</p></div>;

  return (
    <>
      <Head>
        <title>Maa Saraswati Travels - Best Taxi Service in India | Book Cab Online</title>
        <meta name="description" content="Book taxi for Ujjain Mahakaleshwar, Omkareshwar, Khajuraho, Ayodhya, Varanasi. Real-time fare, GPS tracking, professional drivers. 24/7 service. Book now!" />
        <meta name="keywords" content="MP Tourism, Ujjain taxi, Omkareshwar taxi, Khajuraho taxi, Bandhavgarh taxi, Mahakaleshwar darshan, Ayodhya taxi, Varanasi taxi, taxi booking app" />
        <meta name="author" content="Maa Saraswati Travels" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <link rel="canonical" href="https://maasaraswatitravels.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Maa Saraswati Travels",
              "image": "https://maasaraswatitravels.com/logo.png",
              "description": "Best taxi service in India. Book cabs for Ujjain, Omkareshwar, Khajuraho, Ayodhya, Varanasi and more.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Indore",
                "addressRegion": "Madhya Pradesh",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "22.7196",
                "longitude": "75.8577"
              },
              "openingHours": "Mo-Su 00:00-23:59",
              "telephone": "+919876543210",
              "priceRange": "₹₹",
              "sameAs": [
                "https://www.facebook.com/maasaraswatitravels",
                "https://www.instagram.com/maasaraswatitravels"
              ]
            })
          }}
        />
      </Head>

      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-gray-100 via-gray-50 to-white'
      }`}>
        <header className={`sticky top-0 z-50 border-b ${
          theme === 'dark' 
            ? 'bg-white/10 backdrop-blur-xl border-white/10' 
            : 'bg-white/80 backdrop-blur-xl border-gray-200'
        }`}>
          <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-pulse">🚐</span>
              <h1 className={`text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent`}>
                Maa Saraswati Travels
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/trip/create" className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600 transition shadow-lg text-sm font-medium flex items-center gap-1">
                ✨ Create Trip
              </Link>
              <NotificationBell />
              <LanguageSwitcher />
              <a href="tel:+919876543210" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition shadow-lg text-sm font-medium flex items-center gap-1">
                📞 24/7 Support
              </a>
            </div>
          </div>
        </header>

        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              <h1 className={`text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent`}>
                Book Your Ride Instantly
              </h1>
              <p className={`text-xl ${theme === 'dark' ? 'text-white/80' : 'text-gray-600'}`}>
                Real-time fare • GPS tracking • Professional drivers • 24/7 service
              </p>
            </motion.div>

            {/* Voice Search and Theme Toggle */}
            <div className="flex justify-between items-center mb-4">
              <VoiceSearch onResult={(query) => {
                setPickup(query);
                toast.success(`Searching for: ${query}`);
              }} />
              <ThemeToggle />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${
                  theme === 'dark' 
                    ? 'bg-white/10 backdrop-blur-xl border-white/20' 
                    : 'bg-white shadow-xl border-gray-200'
                } rounded-2xl p-6 md:p-8 border`}
              >
                <h2 className={`text-2xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Book a Ride
                </h2>
                
                {/* Saved Places Component */}
                {userId && (
                  <div className="mb-4">
                    <SavedPlaces 
                      userId={userId} 
                      onSelectLocation={(location) => {
                        setPickup(location);
                        toast.success(`📍 ${location} selected`);
                      }} 
                    />
                  </div>
                )}
                
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

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {Object.entries(vehicleRates).map(([key, rate]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setVehicle(key)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        vehicle === key 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                          : theme === 'dark'
                            ? 'bg-white/10 text-white/80 hover:bg-white/20'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-2xl">{key === 'auto' ? '🛺' : key === 'sedan' ? '🚗' : key === 'suv' ? '🚙' : key === 'luxury' ? '🚘' : '🚐'}</div>
                      <div className="font-semibold text-sm capitalize">{key}</div>
                      <div className="text-xs">₹{rate}/km</div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={calculateDistanceAndFare}
                    disabled={calculating || !pickupCoords || !dropCoords}
                    className={`flex-1 ${
                      theme === 'dark'
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } py-3 rounded-xl font-semibold transition disabled:opacity-50`}
                  >
                    {calculating ? 'Calculating...' : 'Calculate Fare'}
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={!fare || fare === 0}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition disabled:opacity-50"
                  >
                    Book Now →
                  </button>
                </div>

                {showFare && fare > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={theme === 'dark' ? 'text-white/80' : 'text-gray-600'}>Estimated Fare</p>
                        <p className="text-3xl font-bold text-green-400">₹{fare.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className={theme === 'dark' ? 'text-white/80' : 'text-gray-600'}>Distance: {distance.toFixed(1)} km</p>
                        <p className={theme === 'dark' ? 'text-white/80' : 'text-gray-600'}>Duration: {duration}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${
                  theme === 'dark'
                    ? 'bg-white/10 backdrop-blur-xl border-white/20'
                    : 'bg-white shadow-xl border-gray-200'
                } rounded-2xl p-4 border h-[500px] overflow-hidden`}
              >
                <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                  📍 Route Preview
                </div>
                <div 
                  ref={(el) => {
                    if (el && !map && window.google) {
                      const newMap = new window.google.maps.Map(el, {
                        center: { lat: 23.2599, lng: 77.4126 },
                        zoom: 6,
                        styles: theme === 'dark' ? [
                          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                          { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                          { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                        ] : undefined,
                      });
                      setMap(newMap);
                    }
                  }}
                  className="w-full h-full rounded-xl"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Rest of the sections remain the same */}
        <section className="py-16 bg-white/5">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`text-3xl md:text-4xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              Explore Sacred India
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mpDestinations.map((dest, i) => (
                <motion.div
                  key={dest.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link href={`/tour/${dest.slug}`}>
                    <div className={`bg-gradient-to-r ${dest.color} rounded-2xl p-6 text-white text-center hover:shadow-2xl transition-all cursor-pointer`}>
                      <div className="text-5xl mb-3 animate-bounce">{dest.icon}</div>
                      <h3 className="text-xl font-bold">{dest.name}</h3>
                      <p className="text-white/80 text-sm">{dest.city}</p>
                      <p className="text-xs mt-2">{dest.type}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`text-3xl md:text-4xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              Popular Routes
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularRoutes.map((route, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link href={`/route/${route.from.toLowerCase()}-to-${route.to.toLowerCase()}`}>
                    <div className={`${
                      theme === 'dark'
                        ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } rounded-xl p-4 transition-all cursor-pointer`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            {route.from} → {route.to}
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                            {route.distance} | {route.time}
                          </div>
                        </div>
                        <div className="text-orange-400 font-bold">{route.price}</div>
                      </div>
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white/5">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`text-3xl md:text-4xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              Why Choose Us?
            </motion.h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: "🚗", title: "500+ Cars", desc: "Wide range of vehicles", color: "from-blue-500 to-cyan-500" },
                { icon: "⭐", title: "4.8 Rating", desc: "5000+ happy customers", color: "from-yellow-500 to-orange-500" },
                { icon: "💰", title: "Best Price", desc: "No hidden charges", color: "from-green-500 to-emerald-500" },
                { icon: "🕐", title: "24/7 Support", desc: "Always available", color: "from-red-500 to-pink-500" },
                { icon: "🔒", title: "GPS Tracked", desc: "Safe & secure rides", color: "from-purple-500 to-indigo-500" },
                { icon: "👨‍✈️", title: "Pro Drivers", desc: "Experienced & verified", color: "from-orange-500 to-red-500" },
                { icon: "🧹", title: "Clean Cars", desc: "Hygiene certified", color: "from-teal-500 to-green-500" },
                { icon: "📱", title: "Easy Booking", desc: "Book in 30 seconds", color: "from-pink-500 to-rose-500" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`${
                    theme === 'dark'
                      ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } rounded-2xl p-6 text-center transition-all`}
                >
                  <div className={`text-5xl mb-3 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>{feature.icon}</div>
                  <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`text-3xl md:text-4xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            >
              What Our Customers Say
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Rahul Sharma', city: 'Indore', text: 'Excellent service for Mahakaleshwar darshan! Driver was punctual and very knowledgeable.', rating: 5, avatar: 'R' },
                { name: 'Priya Patel', city: 'Bhopal', text: 'Best taxi service in MP. Booked for Khajuraho tour, everything was perfect.', rating: 5, avatar: 'P' },
                { name: 'Amit Kumar', city: 'Ujjain', text: 'Very professional service. Clean cars, fair pricing. Highly recommend!', rating: 5, avatar: 'A' },
                { name: 'Sneha Gupta', city: 'Delhi', text: 'Booked for Ayodhya trip. Driver was very friendly and helped with local info.', rating: 5, avatar: 'S' },
                { name: 'Vikram Singh', city: 'Mumbai', text: 'Great experience! On-time pickup, comfortable car, reasonable rates.', rating: 5, avatar: 'V' },
                { name: 'Neha Verma', city: 'Lucknow', text: 'The multi-stop trip feature is amazing! Planned my entire tour easily.', rating: 5, avatar: 'N' },
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${
                    theme === 'dark'
                      ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } rounded-2xl p-6 transition-all`}
                >
                  <div className="flex text-yellow-500 mb-3">{'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}</div>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {testimonial.name}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                        {testimonial.city}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
          <div className="container mx-auto px-4 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Ready for Your Journey?
            </motion.h2>
            <p className="text-xl text-white/90 mb-8">Book your ride now and experience the best travel service in India</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:+919876543210" className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all">
                📞 Call Now: +91 98765 43210
              </a>
              <button onClick={() => router.push('/book')} className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-all">
                Book Online →
              </button>
            </div>
          </div>
        </section>

        <footer className={`py-12 border-t ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4"><span className="text-2xl">🚐</span><h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Maa Saraswati Travels</h3></div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Your trusted travel partner since 2015. India Tourism Partner.</p>
              </div>
              <div>
                <h4 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>About Us</Link></li>
                  <li><Link href="/trip/create" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Create Trip</Link></li>
                  <li><Link href="/contact" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Contact</Link></li>
                  <li><Link href="/terms" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Terms & Conditions</Link></li>
                  <li><Link href="/privacy" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Privacy Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Popular Destinations</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/tour/ujjain-mahakaleshwar" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Ujjain Mahakaleshwar</Link></li>
                  <li><Link href="/tour/omkareshwar" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Omkareshwar</Link></li>
                  <li><Link href="/tour/khajuraho" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Khajuraho</Link></li>
                  <li><Link href="/tour/ayodhya" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Ayodhya</Link></li>
                  <li><Link href="/tour/kashi" className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition`}>Varanasi</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Contact Info</h4>
                <ul className="space-y-2 text-sm">
                  <li className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>📞 +91 98765 43210</li>
                  <li className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>✉️ support@maasaraswatitravels.com</li>
                  <li className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>📍 Indore, Madhya Pradesh</li>
                  <li className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>🕐 24/7 - Always Open</li>
                </ul>
                <div className="flex gap-3 mt-4">
                  <a href="#" className={`px-3 py-2 rounded-lg transition ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>📱 Google Play</a>
                  <a href="#" className={`px-3 py-2 rounded-lg transition ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>🍎 App Store</a>
                </div>
              </div>
            </div>
            <div className={`border-t mt-8 pt-8 text-center text-sm ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
              <p>&copy; 2024 Maa Saraswati Travels. All rights reserved. Designed for your travel comfort.</p>
            </div>
          </div>
        </footer>

        {userId && (
          <>
            <div className="fixed left-6 bottom-6 z-40 w-72">
              <ReferralCard userId={userId} />
            </div>
            <LiveChat userId={userId} userName={userName} />
          </>
        )}
      </div>
    </>
  );
}