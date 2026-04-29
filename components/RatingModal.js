// components/RatingModal.js - EXCELLENT PRODUCTION READY
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const REVIEW_TEMPLATES = [
  { rating: 5, text: "Excellent service! Driver was very professional." },
  { rating: 4, text: "Good service, on-time pickup." },
  { rating: 3, text: "Average experience. Could be better." },
  { rating: 2, text: "Not satisfied with the service." },
  { rating: 1, text: "Very poor experience." },
];

export default function RatingModal({ isOpen, onClose, rideId, driverId, onRated }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    if (rating > 0) {
      const template = REVIEW_TEMPLATES.find(t => t.rating === rating);
      if (template && !review) {
        setShowTemplate(true);
      }
    }
  }, [rating, review]);

  const applyTemplate = (templateText) => {
    setReview(templateText);
    setShowTemplate(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      // Check if already rated
      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('ride_id', rideId)
        .maybeSingle();

      if (existing) {
        toast.error('You have already rated this ride');
        onClose();
        return;
      }

      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: rideId,
          driver_id: driverId,
          rating: rating,
          review: review.trim() || null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update ride as rated
      await supabase
        .from('rides')
        .update({ rated: true })
        .eq('id', rideId);

      // Update driver's average rating
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating')
        .eq('driver_id', driverId);

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        await supabase
          .from('drivers')
          .update({ rating: parseFloat(avgRating.toFixed(1)) })
          .eq('id', driverId);
      }

      toast.success('Thank you for your feedback!');
      if (onRated) onRated();
      onClose();
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">⭐</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rate Your Ride</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your feedback helps us improve</p>
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-5xl transition-all duration-150 hover:scale-110 focus:outline-none"
                >
                  {(hoverRating || rating) >= star ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            <div className="text-center mb-4">
              <p className="text-sm font-medium">
                {rating === 5 && "🌟 Excellent! You loved the service"}
                {rating === 4 && "😊 Good! Almost perfect"}
                {rating === 3 && "👍 Average! Could be better"}
                {rating === 2 && "😟 Not satisfied"}
                {rating === 1 && "😡 Very dissatisfied"}
                {rating === 0 && "Tap a star to rate"}
              </p>
            </div>

            <textarea
              placeholder="Share your experience with the driver (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
            />

            {showTemplate && rating > 0 && !review && (
              <button
                onClick={() => applyTemplate(REVIEW_TEMPLATES.find(t => t.rating === rating)?.text)}
                className="text-sm text-orange-500 hover:text-orange-600 mb-3 block"
              >
                💡 Use suggested review
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                Maybe Later
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </span>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}