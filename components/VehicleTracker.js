import { useState } from 'react';
import { motion } from 'framer-motion';

export default function VehicleTracker({ vehicles = [], onSelect }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const vehicleIcons = {
    car: '🚗',
    bike: '🏍️',
    bus: '🚌',
    tempo: '🚐',
    default: '🚙',
  };

  const statusColors = {
    available: 'bg-green-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span className="animate-pulse">📍</span> Live Vehicle Tracking
      </h3>
      
      <div className="space-y-3">
        {vehicles.map((vehicle) => (
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
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-mono">{vehicle.eta} min</p>
                <p className="text-xs text-gray-400 capitalize">{vehicle.status}</p>
              </div>
            </div>
            
            {/* Animated progress bar for ETA */}
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${100 - (vehicle.eta / 30) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      {selectedVehicle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl"
        >
          <p className="text-white text-sm">📍 Vehicle {selectedVehicle.number} is {selectedVehicle.eta} minutes away</p>
          <div className="flex gap-2 mt-2">
            <button className="text-orange-400 text-sm">Track Live →</button>
            <button className="text-orange-400 text-sm">Call Driver</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}