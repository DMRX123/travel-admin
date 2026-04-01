import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function RatingModal({ isOpen, onClose, rideId, driverId, onRated }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      // Save rating to database
      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: rideId,
          driver_id: driverId,
          rating: rating,
          review: review,
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
          .update({ rating: avgRating })
          .eq('id', driverId);
      }

      toast.success('Thank you for your feedback!');
      onRated?.();
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Rate Your Ride</h2>
        
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              {(hoverRating || rating) >= star ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Share your experience with the driver..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-orange-500"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}