// components/RideSharing.js - CREATE NEW FILE
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RideSharing({ currentRideId, userId }) {
  const [shareRequests, setShareRequests] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [sharePrice, setSharePrice] = useState(0);

  useEffect(() => {
    if (currentRideId) {
      fetchShareRequests();
    }
  }, [currentRideId]);

  const fetchShareRequests = async () => {
    const { data } = await supabase
      .from('ride_shares')
      .select('*, user:user_id(*)')
      .eq('ride_id', currentRideId)
      .eq('status', 'pending');
    
    setShareRequests(data || []);
  };

  const offerRideShare = async () => {
    if (seatsAvailable < 1) {
      toast.error('Please select at least 1 seat');
      return;
    }

    const { error } = await supabase
      .from('ride_shares')
      .insert({
        ride_id: currentRideId,
        user_id: userId,
        seats_available: seatsAvailable,
        price_per_seat: sharePrice,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (!error) {
      toast.success(`Ride share offered! ${seatsAvailable} seats available`);
      setShowShareModal(false);
      fetchShareRequests();
    }
  };

  const acceptShareRequest = async (requestId) => {
    const { error } = await supabase
      .from('ride_shares')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (!error) {
      toast.success('Share request accepted!');
      fetchShareRequests();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>👥</span> Ride Sharing / Carpool
        </h2>
        <button
          onClick={() => setShowShareModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
        >
          + Offer Share
        </button>
      </div>

      {shareRequests.length > 0 ? (
        <div className="space-y-3">
          {shareRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-xl p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{request.user?.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">
                    {request.seats_available} seats • ₹{request.price_per_seat}/seat
                  </p>
                </div>
                <button
                  onClick={() => acceptShareRequest(request.id)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No share requests yet. Offer your ride to save money!
        </p>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-4">Offer Ride Share</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Seats Available</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={seatsAvailable}
                  onChange={(e) => setSeatsAvailable(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price per Seat (₹)</label>
                <input
                  type="number"
                  min="50"
                  value={sharePrice}
                  onChange={(e) => setSharePrice(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={offerRideShare}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg"
                >
                  Offer Share
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}