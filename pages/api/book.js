import { useState, useEffect } from 'react';
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
  const [duration, setDuration] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [map, setMap] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showVehicles, setShowVehicles] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

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

  const calculateDistance = async () => {
    if (!pickupCoords || !dropCoords || !directionsService) {
      toast.error('Please select valid pickup and drop locations');
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
        
        if (directionsRenderer) {
          directionsRenderer.setDirections(result);
        }
        
        if (map && result.routes[0].bounds) {
          map.fitBounds(result.routes[0].bounds);
        }
        
        toast.success(`Distance: ${distInKm.toFixed(1)} km`);
      } else {
        toast.error('Could not calculate route. Please check locations.');
      }
      setCalculating(false);
    });
  };

  const findVehicles = async () => {
    if (!pickupCoords || !dropCoords) {
      toast.error('Please calculate distance first');
      return;
    }

    setLoadingVehicles(true);
    setShowVehicles(false);

    try {
      const response = await fetch('/api/find-vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          dropLat: dropCoords.lat,
          dropLng: dropCoords.lng,
          distance: distance,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVehicles(data.vehicles);
        setShowVehicles(true);
      } else {
        toast.error(data.error || 'Failed to find vehicles');
      }
    } catch (error) {
      console.error('Find vehicles error:', error);
      toast.error('Network error. Please try again.');
    }

    setLoadingVehicles(false);
  };

  const bookVehicle = async (vehicle) => {
    router.push({
      pathname: '/confirm-booking',
      query: {
        pickup: encodeURIComponent(pickup),
        drop: encodeURIComponent(drop),
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        dropLat: dropCoords.lat,
        dropLng: dropCoords.lng,
        distance: distance,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehicleType: vehicle.id,
        fare: vehicle.fare,
      }
    });
  };

  if (loadError) return <div className="min-h-screen flex items-center justify-center">Error loading maps</div>;
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading maps...</div>;

  return (
    <>
      <Head>
        <title>Book a Ride | Maa Saraswati Travels</title>
        <meta name="description" content="Book your taxi ride instantly. Best prices, professional drivers, 24/7 service." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Maa Saraswati Travels
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Booking Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h1 className="text-2xl font-bold mb-6 text-gray-800">Book a Ride</h1>
              
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

              <div className="flex gap-4 mb-6">
                <button
                  onClick={calculateDistance}
                  disabled={calculating || !pickupCoords || !dropCoords}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  {calculating ? 'Calculating...' : 'Calculate Distance'}
                </button>
                <button
                  onClick={findVehicles}
                  disabled={loadingVehicles || distance === 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition disabled:opacity-50"
                >
                  {loadingVehicles ? 'Finding...' : 'Find Vehicles'}
                </button>
              </div>

              {distance > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 text-sm">Distance</p>
                      <p className="text-2xl font-bold text-blue-600">{distance.toFixed(1)} km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Estimated Time</p>
                      <p className="text-2xl font-bold text-blue-600">{duration}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Map */}
            <div className="bg-white rounded-2xl shadow-xl p-4 h-[500px] overflow-hidden">
              <div className="text-gray-600 text-sm mb-2">🗺️ Route Preview</div>
              <div 
                ref={(el) => {
                  if (el && !map && window.google) {
                    const newMap = new window.google.maps.Map(el, {
                      center: { lat: 23.2599, lng: 77.4126 },
                      zoom: 6,
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                      ],
                    });
                    setMap(newMap);
                  }
                }}
                className="w-full h-full rounded-xl"
              />
            </div>
          </div>

          {/* Vehicles List */}
          {showVehicles && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Available Vehicles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all"
                    onClick={() => bookVehicle(vehicle)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{vehicle.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{vehicle.name}</h3>
                        <p className="text-gray-500 text-sm">{vehicle.seating_capacity} seats</p>
                        <p className="text-gray-400 text-xs">{vehicle.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-500">₹{Math.round(vehicle.fare)}</p>
                        <p className="text-xs text-gray-400">{vehicle.eta} min away</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">AC</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">GPS</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">24/7 Support</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}