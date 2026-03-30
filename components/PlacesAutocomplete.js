import { useState } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlacesAutocomplete({ 
  placeholder, 
  value, 
  onChange, 
  onSelect,
  icon = "📍",
  className = ""
}) {
  const [isFocused, setIsFocused] = useState(false);
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'in' },
      types: ['geocode', 'establishment'],
    },
    debounce: 300,
  });

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();
    onChange(address);
    
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      if (onSelect) {
        onSelect(address, lat, lng);
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">{icon}</span>
        <input
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          disabled={!ready}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all"
        />
      </div>
      
      <AnimatePresence>
        {isFocused && status === 'OK' && data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {data.map(({ place_id, description }) => (
              <button
                key={place_id}
                onClick={() => handleSelect(description)}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span className="text-gray-400">📍</span>
                <span>{description}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}