// components/PlacesAutocomplete.js - EXCELLENT PRODUCTION READY
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

export default function PlacesAutocomplete({ 
  placeholder, 
  value, 
  onChange, 
  onSelect,
  icon = "📍",
  className = "",
  disabled = false,
  required = false
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  
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
    cache: 24 * 60 * 60, // Cache for 24 hours
  });

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue && !isFocused) {
      setValue(value, false);
    }
  }, [value, inputValue, isFocused, setValue]);

  const handleSelect = useCallback(async (address) => {
    setValue(address, false);
    clearSuggestions();
    onChange(address);
    setIsLoading(true);
    
    try {
      const results = await getGeocode({ address });
      if (results && results[0]) {
        const { lat, lng } = await getLatLng(results[0]);
        const formattedAddress = results[0].formatted_address || address;
        if (onSelect) {
          onSelect(formattedAddress, lat, lng);
        }
      }
    } catch (error) {
      console.error('Geocode error:', error);
      if (onSelect) {
        onSelect(address, null, null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setValue, clearSuggestions, onChange, onSelect]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && status === 'OK' && data.length > 0) {
      e.preventDefault();
      handleSelect(data[0].description);
    }
  };

  const getPlaceholderText = () => {
    if (isLoading) return 'Getting location...';
    if (!ready) return 'Loading places...';
    return placeholder;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl z-10">{icon}</span>
        <input
          ref={inputRef}
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || !ready || isLoading}
          placeholder={getPlaceholderText()}
          required={required}
          className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {isFocused && !isLoading && status === 'OK' && data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          >
            {data.map(({ place_id, description }, index) => (
              <button
                key={place_id}
                onClick={() => handleSelect(description)}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="text-gray-400">📍</span>
                <span className="flex-1 text-sm">{description}</span>
                {index === 0 && <span className="text-xs text-orange-500">Recommended</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}