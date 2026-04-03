// components/RecurringRideList.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RecurringRideList({ userId }) {
  const [recurringRides, setRecurringRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchRecurringRides();
    }
  }, [userId]);

  const fetchRecurringRides = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('recurring_rides')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setRecurringRides(data || []);
    setLoading(false);
  };

  const cancelRecurringRide = async (id) => {
    const { error } = await supabase
      .from('recurring_rides')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (!error) {
      toast.success('Recurring ride cancelled');
      fetchRecurringRides();
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'daily': return '📅 Daily';
      case 'weekly': return '📆 Weekly';
      case 'monthly': return '📇 Monthly';
      default: return '🔄';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (recurringRides.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
        <span className="text-4xl mb-2 block">🔄</span>
        <p className="text-white/70">No recurring rides scheduled</p>
        <p className="text-white/50 text-sm mt-1">Schedule your daily/weekly commute</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span>🔄</span> Your Recurring Rides
      </h3>
      
      {recurringRides.map((ride) => (
        <motion.div
          key={ride.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-orange-400">
                  {getFrequencyIcon(ride.frequency)}
                </span>
                <span className="text-xs text-white/50">
                  Started: {new Date(ride.start_date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-white text-sm font-medium">📍 {ride.pickup_address?.substring(0, 40)}...</p>
              <p className="text-white/60 text-sm">→ {ride.drop_address?.substring(0, 40)}...</p>
              <div className="flex gap-3 mt-2 text-xs text-white/50">
                <span>🚗 {ride.vehicle_type}</span>
                <span>💰 ₹{ride.fare}</span>
                <span>🕐 {ride.schedule_time}</span>
              </div>
            </div>
            <button
              onClick={() => cancelRecurringRide(ride.id)}
              className="text-red-400 hover:text-red-300 text-sm px-2"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}