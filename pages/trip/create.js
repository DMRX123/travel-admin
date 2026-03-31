import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useLoadScript } from '@react-google-maps/api';
import PlacesAutocomplete from '../../components/PlacesAutocomplete';
import toast from 'react-hot-toast';

const libraries = ["places"];

export default function CreateTrip() {
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [vehicle, setVehicle] = useState('sedan');
  const [tripType, setTripType] = useState('oneway');
  const [days, setDays] = useState(1);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [directionsService, setDirectionsService] = useState(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const vehicleRates = {
    auto: 10,
    sedan: 15,
    suv: 20,
    luxury: 30,
    tempo: 25,
  };

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

  const addStop = () => {
    setStops([...stops, { name: '', coords: null, order: stops.length + 1 }]);
  };

  const removeStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops.map((stop, i) => ({ ...stop, order: i + 1 })));
  };

  const updateStop = (index, name, coords) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], name, coords };
    setStops(newStops);
  };

  const calculateTrip = async () => {
    if (!directionsService || stops.length < 2) {
      toast.error('Please add at least 2 stops');
      return;
    }

    setCalculating(true);
    
    const validStops = stops.filter(s => s.coords);
    if (validStops.length < 2) {
      toast.error('Please select valid locations for all stops');
      setCalculating(false);
      return;
    }

    let totalDist = 0;
    let waypoints = [];
    
    for (let i = 0; i < validStops.length - 1; i++) {
      const origin = validStops[i].coords;
      const destination = validStops[i + 1].coords;
      
      const request = {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      };
      
      const result = await new Promise((resolve) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result.routes[0].legs[0].distance.value / 1000);
          } else {
            resolve(0);
          }
        });
      });
      
      totalDist += result;
      
      if (i > 0 && i < validStops.length - 2) {
        waypoints.push({
          location: { lat: validStops[i].coords.lat, lng: validStops[i].coords.lng },
          stopover: true,
        });
      }
    }
    
    setTotalDistance(totalDist);
    
    // Calculate fare with vehicle rate and night stay charges
    const rate = vehicleRates[vehicle] || 15;
    let fare = totalDist * rate;
    
    // Add night stay charges for multi-day trips
    if (tripType === 'multiday' && days > 1) {
      fare += days * 500; // ₹500 per night for driver stay
    }
    
    setTotalFare(fare);
    
    // Show route on map
    if (validStops.length >= 2 && directionsRenderer) {
      const request = {
        origin: { lat: validStops[0].coords.lat, lng: validStops[0].coords.lng },
        destination: { lat: validStops[validStops.length - 1].coords.lat, lng: validStops[validStops.length - 1].coords.lng },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      };
      
      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          if (map && result.routes[0].bounds) {
            map.fitBounds(result.routes[0].bounds);
          }
        }
      });
    }
    
    setCalculating(false);
    toast.success(`Trip calculated! Total: ${totalDist.toFixed(1)} km`);
  };

  const handleBook = () => {
    if (totalFare === 0) {
      toast.error('Please calculate fare first');
      return;
    }
    
    router.push({
      pathname: '/book',
      query: {
        pickup: stops[0]?.name,
        drop: stops[stops.length - 1]?.name,
        vehicle,
        distance: totalDistance,
        fare: totalFare,
        tripType,
        days,
        stops: JSON.stringify(stops.map(s => s.name)),
      }
    });
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
        <title>Create Custom Trip | Maa Saraswati Travels</title>
        <meta name="description" content="Plan your custom tour with multiple stops. Visit Ujjain, Omkareshwar, Khajuraho and more in one trip." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <header className="bg-white/10 backdrop-blur-xl sticky top-0 z-50 border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <button onClick={() => router.back()} className="text-white flex items-center gap-2">
              ← Back
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-white mb-8"
          >
            Create Your Custom Trip
          </motion.h1>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold text-white mb-4">Trip Stops</h2>
              
              <div className="space-y-4 mb-6">
                {stops.map((stop, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold mt-3">
                      {stop.order}
                    </div>
                    <div className="flex-1">
                      <PlacesAutocomplete
                        placeholder={`Stop ${stop.order}: Location`}
                        value={stop.name}
                        onChange={(val) => updateStop(index, val, null)}
                        onSelect={(address, lat, lng) => updateStop(index, address, { lat, lng })}
                        icon={index === 0 ? "🚀" : index === stops.length - 1 ? "🏁" : "📍"}
                      />
                    </div>
                    {stops.length > 2 && (
                      <button
                        onClick={() => removeStop(index)}
                        className="mt-3 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addStop}
                className="w-full border border-dashed border-white/30 rounded-xl py-3 text-white/70 hover:bg-white/10 transition"
              >
                + Add Stop
              </button>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-white/80 text-sm block mb-2">Vehicle Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(vehicleRates).map(([key, rate]) => (
                      <button
                        key={key}
                        onClick={() => setVehicle(key)}
                        className={`p-2 rounded-xl text-center transition-all ${
                          vehicle === key 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        <div className="text-xl">
                          {key === 'auto' ? '🛺' : key === 'sedan' ? '🚗' : key === 'suv' ? '🚙' : key === 'luxury' ? '🚘' : '🚐'}
                        </div>
                        <div className="text-xs capitalize">{key}</div>
                        <div className="text-[10px]">₹{rate}/km</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-sm block mb-2">Trip Type</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTripType('oneway')}
                      className={`flex-1 p-3 rounded-xl transition ${
                        tripType === 'oneway' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      One Way
                    </button>
                    <button
                      onClick={() => setTripType('multiday')}
                      className={`flex-1 p-3 rounded-xl transition ${
                        tripType === 'multiday' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      Multi-Day Tour
                    </button>
                  </div>
                </div>

                {tripType === 'multiday' && (
                  <div>
                    <label className="text-white/80 text-sm block mb-2">Number of Days</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={calculateTrip}
                  disabled={calculating || stops.length < 2}
                  className="flex-1 bg-white/20 text-white py-3 rounded-xl font-semibold hover:bg-white/30 disabled:opacity-50"
                >
                  {calculating ? 'Calculating...' : 'Calculate Trip'}
                </button>
                <button
                  onClick={handleBook}
                  disabled={totalFare === 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl disabled:opacity-50"
                >
                  Book Now
                </button>
              </div>

              {totalFare > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/80">Total Distance</p>
                      <p className="text-xl font-bold text-white">{totalDistance.toFixed(1)} km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80">Total Fare</p>
                      <p className="text-2xl font-bold text-green-400">₹{totalFare.toFixed(2)}</p>
                    </div>
                  </div>
                  {tripType === 'multiday' && days > 1 && (
                    <p className="text-xs text-white/60 mt-2">*Includes ₹{days * 500} driver night stay charges</p>
                  )}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 h-[500px]"
            >
              <div className="text-white text-sm mb-2">🗺️ Trip Route Preview</div>
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
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}