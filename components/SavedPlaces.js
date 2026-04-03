// components/SavedPlaces.js - CREATE NEW FILE
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SavedPlaces({ userId, onSelectLocation }) {
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', address: '', lat: '', lng: '' });

  useEffect(() => {
    if (userId) {
      fetchSavedPlaces();
    }
  }, [userId]);

  const fetchSavedPlaces = async () => {
    const { data } = await supabase
      .from('saved_places')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setSavedPlaces(data || []);
  };

  const savePlace = async () => {
    if (!newPlace.name || !newPlace.address) {
      toast.error('Please enter place name and address');
      return;
    }

    const { error } = await supabase
      .from('saved_places')
      .insert({
        user_id: userId,
        name: newPlace.name,
        address: newPlace.address,
        lat: newPlace.lat,
        lng: newPlace.lng,
        created_at: new Date().toISOString()
      });

    if (!error) {
      toast.success('Place saved successfully!');
      setShowAddModal(false);
      setNewPlace({ name: '', address: '', lat: '', lng: '' });
      fetchSavedPlaces();
    }
  };

  const deletePlace = async (id) => {
    const { error } = await supabase
      .from('saved_places')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Place deleted');
      fetchSavedPlaces();
    }
  };

  const popularPlaces = [
    { name: '🏠 Home', icon: '🏠' },
    { name: '💼 Office', icon: '💼' },
    { name: '✈️ Airport', icon: '✈️' },
    { name: '🚉 Railway Station', icon: '🚉' },
    { name: '🛕 Mahakaleshwar Temple', icon: '🛕' },
    { name: '🛕 Omkareshwar Temple', icon: '🛕' },
    { name: '🏛️ Khajuraho', icon: '🏛️' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span>⭐</span> Saved Places
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-orange-400 text-sm hover:text-orange-300"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {popularPlaces.map((place, idx) => (
          <button
            key={idx}
            onClick={() => onSelectLocation(place.name)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-sm transition flex items-center gap-1"
          >
            <span>{place.icon}</span> {place.name}
          </button>
        ))}
      </div>

      {savedPlaces.length > 0 && (
        <div className="mt-3 space-y-2">
          {savedPlaces.map((place) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center bg-white/5 rounded-lg p-2"
            >
              <button
                onClick={() => onSelectLocation(place.address)}
                className="flex-1 text-left text-white text-sm"
              >
                <div className="font-medium">{place.name}</div>
                <div className="text-xs text-white/50 truncate">{place.address}</div>
              </button>
              <button
                onClick={() => deletePlace(place.id)}
                className="text-red-400 text-sm px-2"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold mb-4">Save Place</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Place Name (e.g., Home, Office)"
                value={newPlace.name}
                onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Address"
                value={newPlace.address}
                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={savePlace}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}