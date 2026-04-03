// components/CancelRideModal.js
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const cancelReasons = [
  { id: 'changed_plan', label: 'Changed my plan', icon: '📅' },
  { id: 'booked_elsewhere', label: 'Booked with another service', icon: '🚗' },
  { id: 'long_waiting', label: 'Driver taking too long', icon: '⏰' },
  { id: 'wrong_location', label: 'Wrong pickup/drop location', icon: '📍' },
  { id: 'price_issue', label: 'Price too high', icon: '💰' },
  { id: 'emergency', label: 'Emergency', icon: '🆘' },
  { id: 'other', label: 'Other', icon: '📝' },
];

export default function CancelRideModal({ isOpen, onClose, rideId, onCancelled }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    const finalReason = selectedReason === 'other' ? otherReason : selectedReason;
    if (selectedReason === 'other' && !otherReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setCancelling(true);

    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancellation_reason: finalReason,
          cancelled_by: 'user',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', rideId);

      if (error) throw error;

      // Log cancellation for analytics
      await fetch('/api/log-cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, reason: finalReason })
      });

      toast.success('Ride cancelled successfully');
      onCancelled?.();
      onClose();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel ride');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">❌</div>
              <h2 className="text-2xl font-bold text-gray-800">Cancel Ride</h2>
              <p className="text-gray-500 text-sm mt-1">Please tell us why you're cancelling</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cancelReasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    selectedReason === reason.id
                      ? 'bg-orange-50 border-2 border-orange-500'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{reason.icon}</span>
                  <span className="flex-1 font-medium">{reason.label}</span>
                  {selectedReason === reason.id && (
                    <span className="text-orange-500 text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>

            {selectedReason === 'other' && (
              <textarea
                placeholder="Please describe your reason..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows={3}
                className="w-full mt-4 p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            )}

            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 flex items-start gap-2">
                <span>⚠️</span>
                <span>Cancellation charges may apply as per policy. Free cancellation within 5 minutes of booking.</span>
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}