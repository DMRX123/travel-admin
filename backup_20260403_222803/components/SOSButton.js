import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function SOSButton({ rideId, userId, userLocation }) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && isPressed) {
      sendSOS();
    }
    return () => clearTimeout(timer);
  }, [countdown, isPressed]);

  const sendSOS = async () => {
    setSending(true);
    
    try {
      // Get user details
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userId)
        .single();

      // Get ride details
      const { data: ride } = await supabase
        .from('rides')
        .select('pickup_address, drop_address, driver_id, status')
        .eq('id', rideId)
        .single();

      // Log SOS in database
      await supabase
        .from('sos_alerts')
        .insert({
          user_id: userId,
          ride_id: rideId,
          location_lat: userLocation?.lat,
          location_lng: userLocation?.lng,
          status: 'active',
          created_at: new Date().toISOString()
        });

      // Send notification to admin
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          title: '🚨 SOS ALERT!',
          body: `${profile?.full_name} has triggered SOS! Ride: ${ride?.pickup_address?.substring(0, 30)}`,
          data: { type: 'sos', rideId, userId, location: userLocation }
        }),
      });

      // Send SMS if configured
      if (process.env.NEXT_PUBLIC_SMS_API_KEY) {
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: profile?.phone,
            message: `🚨 SOS ALERT! ${profile?.full_name} needs help. Location: https://maps.google.com/?q=${userLocation?.lat},${userLocation?.lng}`
          }),
        });
      }

      toast.success('SOS alert sent! Help is on the way.');
    } catch (error) {
      console.error('SOS error:', error);
      toast.error('Failed to send SOS. Please call emergency services.');
    } finally {
      setSending(false);
      setIsPressed(false);
      setCountdown(0);
    }
  };

  const handlePress = () => {
    if (sending) return;
    setIsPressed(true);
    setCountdown(3);
  };

  const handleCancel = () => {
    setIsPressed(false);
    setCountdown(0);
    toast('SOS cancelled', { icon: '✅' });
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isPressed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-xl p-3 text-center whitespace-nowrap"
          >
            <p className="text-white text-sm">Press and hold to cancel</p>
            <div className="w-16 h-16 rounded-full border-4 border-red-500 mx-auto mt-2 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{countdown}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onMouseDown={handlePress}
        onMouseUp={handleCancel}
        onMouseLeave={handleCancel}
        onTouchStart={handlePress}
        onTouchEnd={handleCancel}
        disabled={sending}
        className={`w-16 h-16 rounded-full bg-red-600 shadow-lg flex items-center justify-center transition-all ${
          isPressed ? 'scale-90 bg-red-700' : 'hover:scale-105 animate-pulse'
        } ${sending ? 'opacity-50' : ''}`}
      >
        {sending ? (
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
        ) : (
          <span className="text-3xl">🆘</span>
        )}
      </button>
      <p className="text-center text-xs text-white/70 mt-1">SOS</p>
    </div>
  );
}