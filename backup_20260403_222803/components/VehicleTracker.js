import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackDriverLocation, updateRideStatus, database } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { ref, onValue } from 'firebase/database';

export default function VehicleTracker({ rideId, driverId, onSelect }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rideStatus, setRideStatus] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  // Track specific ride if rideId provided
  useEffect(() => {
    if (rideId && database) {
      const rideRef = ref(database, `rides/${rideId}`);
      const unsubscribe = onValue(rideRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRideStatus(data);
        }
      });
      return () => unsubscribe();
    }
  }, [rideId]);

  // Track specific driver if driverId provided
  useEffect(() => {
    if (driverId && database) {
      const driverRef = ref(database, `drivers/${driverId}/location`);
      const unsubscribe = onValue(driverRef, (snapshot) => {
        const location = snapshot.val();
        if (location) {
          setDriverLocation(location);
        }
      });
      return () => unsubscribe();
    }
  }, [driverId]);

  // Fetch nearby drivers if no specific ride/driver
  useEffect(() => {
    if (rideId || driverId) {
      setLoading(false);
      return;
    }

    const fetchNearbyDrivers = async () => {
      if (!navigator.geolocation) {
        setLoading(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Fetch drivers within 10km using Supabase RPC
        const { data: drivers, error } = await supabase.rpc('find_nearby_drivers', {
          lat: latitude,
          lng: longitude,
          radius_km: 10
        });
        
        if (drivers && !error) {
          setVehicles(drivers.map(d => ({
            id: d.id,
            number: d.vehicle_number,
            driver: d.full_name,
            type: d.vehicle_type,
            status: d.is_online ? 'available' : 'offline',
            eta: Math.floor(Math.random() * 15) + 5,
            rating: d.rating || 4.5,
            phone: d.phone,
            last_lat: d.last_lat,
            last_lng: d.last_lng,
          })));
        }
        setLoading(false);
      }, (error) => {
        console.error('Location error:', error);
        setLoading(false);
      });
    };

    fetchNearbyDrivers();
  }, [rideId, driverId]);

  const vehicleIcons = {
    auto: '🛺',
    sedan: '🚗',
    suv: '🚙',
    luxury: '🚘',
    tempo: '🚐',
    default: '🚙',
  };

  const statusColors = {
    available: 'bg-green-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
    assigned: 'bg-orange-500',
    accepted: 'bg-blue-500',
    arrived: 'bg-purple-500',
    started: 'bg-indigo-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const statusText = {
    pending: 'Waiting for driver',
    accepted: 'Driver assigned',
    arrived: 'Driver arrived',
    started: 'Ride started',
    completed: 'Ride completed',
    cancelled: 'Cancelled',
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // If tracking a specific ride
  if (rideId) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="animate-pulse">📍</span> 
          Your Ride Status
        </h3>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${
            rideStatus?.status === 'completed' ? 'bg-green-500/20 border-green-500/30' :
            rideStatus?.status === 'accepted' ? 'bg-blue-500/20 border-blue-500/30' :
            rideStatus?.status === 'started' ? 'bg-indigo-500/20 border-indigo-500/30' :
            'bg-orange-500/20 border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  rideStatus?.status === 'completed' ? 'bg-green-500' :
                  rideStatus?.status === 'accepted' ? 'bg-blue-500' :
                  rideStatus?.status === 'started' ? 'bg-indigo-500' :
                  'bg-orange-500'
                }`}></div>
                <span className="text-white font-semibold capitalize">
                  {statusText[rideStatus?.status] || rideStatus?.status || 'Finding driver...'}
                </span>
              </div>
              {rideStatus?.driverId && (
                <button className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600">
                  📞 Call Driver
                </button>
              )}
            </div>
            
            {rideStatus?.status === 'accepted' && (
              <div className="mt-3 text-sm text-white/80">
                <p>Driver is on the way to your pickup location</p>
                {driverLocation && (
                  <p className="text-xs text-orange-400 mt-1">
                    Driver is {Math.floor(Math.random() * 5) + 1} minutes away
                  </p>
                )}
              </div>
            )}
            
            {rideStatus?.status === 'started' && (
              <div className="mt-3 text-sm text-white/80">
                <p>Your ride has started! You're on your way to destination.</p>
              </div>
            )}
            
            {rideStatus?.status === 'completed' && (
              <div className="mt-3 text-sm text-green-400">
                <p>✓ Ride completed successfully. Thank you for choosing Maa Saraswati Travels!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If tracking a specific driver
  if (driverId && driverLocation) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="animate-pulse">📍</span> 
          Driver Location
        </h3>
        <div className="text-center p-4 bg-orange-500/20 rounded-xl">
          <div className="text-4xl mb-2">🚗</div>
          <p className="text-white">Driver is currently at:</p>
          <p className="text-orange-400 text-sm mt-1">
            Lat: {driverLocation.lat?.toFixed(4)}, Lng: {driverLocation.lng?.toFixed(4)}
          </p>
          <a 
            href={`https://maps.google.com/?q=${driverLocation.lat},${driverLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
          >
            View on Map →
          </a>
        </div>
      </div>
    );
  }

  // Default: Show nearby vehicles
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span className="animate-pulse">📍</span> 
        Nearby Vehicles
      </h3>
      
      <div className="space-y-3">
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            No vehicles available nearby
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-white/10 rounded-xl p-4 cursor-pointer transition-all ${
                selectedVehicle?.id === vehicle.id ? 'border-2 border-orange-500' : ''
              }`}
              onClick={() => {
                setSelectedVehicle(vehicle);
                onSelect?.(vehicle);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-3xl">{vehicleIcons[vehicle.type] || vehicleIcons.default}</span>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColors[vehicle.status]} animate-pulse`}></div>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{vehicle.number}</p>
                    <p className="text-xs text-gray-400">Driver: {vehicle.driver}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-xs text-gray-400">{vehicle.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-mono">{vehicle.eta} min</p>
                  <p className="text-xs text-gray-400 capitalize">{vehicle.status}</p>
                </div>
              </div>
              
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${100 - (vehicle.eta / 30) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl"
          >
            <p className="text-white text-sm">
              📍 Vehicle {selectedVehicle.number} is {selectedVehicle.eta} minutes away
            </p>
            <div className="flex gap-2 mt-2">
              <a 
                href={`https://maps.google.com/?q=${selectedVehicle.last_lat},${selectedVehicle.last_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 text-sm hover:underline"
              >
                Track Live →
              </a>
              <a 
                href={`tel:${selectedVehicle.phone}`}
                className="text-orange-400 text-sm hover:underline"
              >
                Call Driver
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}