// components/RecurringRideModal.js
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function RecurringRideModal({ isOpen, onClose, pickup, drop, vehicle, fare, distance }) {
  const [frequency, setFrequency] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [time, setTime] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const weekDays = [
    { value: 'monday', label: 'Mon', short: 'M' },
    { value: 'tuesday', label: 'Tue', short: 'T' },
    { value: 'wednesday', label: 'Wed', short: 'W' },
    { value: 'thursday', label: 'Thu', short: 'T' },
    { value: 'friday', label: 'Fri', short: 'F' },
    { value: 'saturday', label: 'Sat', short: 'S' },
    { value: 'sunday', label: 'Sun', short: 'S' },
  ];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSchedule = async () => {
    if (!startDate || !time) {
      toast.error('Please select start date and time');
      return;
    }

    if (frequency === 'weekly' && selectedDays.length === 0) {
      toast.error('Please select at least one day for weekly schedule');
      return;
    }

    setScheduling(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Please login to schedule recurring rides');
        setScheduling(false);
        return;
      }

      // Calculate number of occurrences
      let occurrences = [];
      const startDateTime = new Date(`${startDate}T${time}`);
      const endDateTime = endDate ? new Date(endDate) : null;
      
      if (frequency === 'daily') {
        let currentDate = new Date(startDateTime);
        while (!endDateTime || currentDate <= endDateTime) {
          occurrences.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
          if (occurrences.length > 100) break;
        }
      } else if (frequency === 'weekly') {
        let currentDate = new Date(startDateTime);
        while (!endDateTime || currentDate <= endDateTime) {
          const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
          if (selectedDays.includes(dayName)) {
            const scheduledTime = new Date(currentDate);
            scheduledTime.setHours(startDateTime.getHours(), startDateTime.getMinutes());
            occurrences.push(new Date(scheduledTime));
          }
          currentDate.setDate(currentDate.getDate() + 1);
          if (occurrences.length > 100) break;
        }
      } else if (frequency === 'monthly') {
        let currentDate = new Date(startDateTime);
        while (!endDateTime || currentDate <= endDateTime) {
          occurrences.push(new Date(currentDate));
          currentDate.setMonth(currentDate.getMonth() + 1);
          if (occurrences.length > 12) break;
        }
      }

      // Create recurring ride record
      const { data: recurringRide, error: recurringError } = await supabase
        .from('recurring_rides')
        .insert({
          user_id: session.user.id,
          pickup_address: pickup,
          drop_address: drop,
          vehicle_type: vehicle,
          fare: fare,
          distance: distance,
          frequency: frequency,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime ? endDateTime.toISOString() : null,
          selected_days: selectedDays,
          schedule_time: time,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (recurringError) throw recurringError;

      // Create individual scheduled rides
      for (const occ of occurrences) {
        await supabase
          .from('rides')
          .insert({
            user_id: session.user.id,
            pickup_address: pickup,
            drop_address: drop,
            vehicle_type: vehicle,
            fare: fare,
            distance: distance,
            status: 'scheduled',
            scheduled_for: occ.toISOString(),
            recurring_id: recurringRide.id,
            created_at: new Date().toISOString()
          });
      }

      toast.success(`${occurrences.length} rides scheduled successfully!`);
      onClose();
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule recurring rides');
    } finally {
      setScheduling(false);
    }
  };

  if (!isOpen) return null;

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Schedule Recurring Ride</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4">
              {/* Frequency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'daily', label: 'Daily', icon: '📅' },
                    { value: 'weekly', label: 'Weekly', icon: '📆' },
                    { value: 'monthly', label: 'Monthly', icon: '📇' },
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      onClick={() => setFrequency(freq.value)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        frequency === freq.value
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xl">{freq.icon}</div>
                      <div className="text-sm font-medium">{freq.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Days Selection */}
              {frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                  <div className="flex gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`w-10 h-10 rounded-full transition-all ${
                          selectedDays.includes(day.value)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* End Date (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  min={startDate || minDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
              </div>

              {/* Summary */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-2">Schedule Summary</p>
                <div className="space-y-1 text-sm">
                  <p>📍 Pickup: {pickup?.substring(0, 50)}...</p>
                  <p>📍 Drop: {drop?.substring(0, 50)}...</p>
                  <p>💰 Fare: ₹{fare}</p>
                  <p>🕐 Time: {time || 'Not set'}</p>
                  <p>📅 Frequency: {frequency.charAt(0).toUpperCase() + frequency.slice(1)}</p>
                  {frequency === 'weekly' && (
                    <p>📆 Days: {selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1,3)).join(', ')}</p>
                  )}
                </div>
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
                {scheduling ? 'Scheduling...' : 'Schedule Recurring Ride'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}