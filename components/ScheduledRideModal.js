import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ScheduledRideModal({ isOpen, onClose, pickup, drop, vehicle, fare, distance }) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    setScheduling(true);

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      if (scheduledDateTime < new Date()) {
        toast.error('Please select a future date and time');
        setScheduling(false);
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Please login to schedule a ride');
        setScheduling(false);
        return;
      }

      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          user_id: session.user.id,
          pickup_address: pickup,
          drop_address: drop,
          vehicle_type: vehicle,
          fare: fare,
          distance: distance,
          status: 'scheduled',
          scheduled_for: scheduledDateTime.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule reminder notification
      const reminderTime = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000);
      if (reminderTime > new Date()) {
        await supabase
          .from('scheduled_reminders')
          .insert({
            ride_id: ride.id,
            user_id: session.user.id,
            reminder_at: reminderTime.toISOString(),
            status: 'pending'
          });
      }

      toast.success(`Ride scheduled for ${scheduledDate} at ${scheduledTime}`);
      onClose();
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule ride');
    } finally {
      setScheduling(false);
    }
  };

  if (!isOpen) return null;

  const minDate = new Date().toISOString().split('T')[0];
  const minTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Schedule Your Ride</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              min={minDate}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              min={minTime}
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">You'll receive a reminder 30 minutes before your ride.</p>
            <p className="text-xs text-gray-500 mt-2">Total Fare: ₹{fare}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={scheduling}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {scheduling ? 'Scheduling...' : 'Schedule Ride'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}