// components/WhatsAppShare.js - EXCELLENT PRODUCTION READY
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function WhatsAppShare({ rideId, pickup, drop, fare, driverName, driverPhone, bookingDate }) {
  const [sharing, setSharing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('en-IN');
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const generateMessage = (type = 'self') => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maasaraswatitravels.com';
    const trackingLink = `${appUrl}/track-ride?id=${rideId}`;
    
    if (type === 'driver') {
      return `🚕 *Maa Saraswati Travels* 🚕\n\n` +
        `*Ride Details:*\n` +
        `📍 Pickup: ${pickup?.substring(0, 60)}\n` +
        `📍 Drop: ${drop?.substring(0, 60)}\n` +
        `💰 Fare: ₹${fare}\n` +
        `📅 Date: ${formatDate(bookingDate)}\n` +
        `🔢 Ride ID: ${rideId}\n\n` +
        `*Driver:* ${driverName || 'Assigned soon'}\n` +
        `*Contact:* ${driverPhone || 'Will be shared after assignment'}\n\n` +
        `Thank you for choosing Maa Saraswati Travels! 🙏`;
    }
    
    if (type === 'family') {
      return `🚕 *Ride Update - Maa Saraswati Travels*\n\n` +
        `I have booked a ride. Here are the details:\n` +
        `📍 From: ${pickup?.substring(0, 50)}\n` +
        `📍 To: ${drop?.substring(0, 50)}\n` +
        `💰 Fare: ₹${fare}\n` +
        `🔢 Ride ID: ${rideId}\n\n` +
        `🔗 *Track Live:* ${trackingLink}\n\n` +
        `Share this link to track my ride live!`;
    }
    
    // Default message
    return `🚕 *Maa Saraswati Travels* 🚕\n\n` +
      `✅ *Ride Booked Successfully!*\n\n` +
      `📋 *Ride Details:*\n` +
      `📍 Pickup: ${pickup?.substring(0, 60)}\n` +
      `📍 Drop: ${drop?.substring(0, 60)}\n` +
      `💰 Fare: ₹${fare}\n` +
      `🚗 Vehicle: ${driverName ? 'Assigned' : 'Searching for driver...'}\n` +
      `🔢 Ride ID: ${rideId}\n\n` +
      `📞 *Support:* +91 98765 43210\n` +
      `📍 *Track:* ${trackingLink}\n\n` +
      `Thank you for choosing Maa Saraswati Travels! 🙏`;
  };

  const shareOnWhatsApp = async (type = 'self') => {
    setSharing(true);
    const message = generateMessage(type);
    const phoneNumber = type === 'driver' && driverPhone ? driverPhone : '';
    const whatsappUrl = phoneNumber 
      ? `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    try {
      window.open(whatsappUrl, '_blank');
      toast.success('Opening WhatsApp...');
      setShowOptions(false);
    } catch (error) {
      toast.error('Failed to open WhatsApp');
    } finally {
      setSharing(false);
    }
  };

  const copyTrackingLink = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/track-ride?id=${rideId}`;
    navigator.clipboard.writeText(link);
    toast.success('Tracking link copied!');
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={sharing}
        className="w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-[#20b859] transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span className="text-xl">📱</span>
        {sharing ? 'Opening WhatsApp...' : 'Share on WhatsApp'}
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            <button
              onClick={() => shareOnWhatsApp('self')}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
            >
              <span className="text-xl">📱</span>
              <div><p className="font-semibold">Share with Self</p><p className="text-xs text-gray-500">Save ride details</p></div>
            </button>
            <button
              onClick={() => shareOnWhatsApp('family')}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
            >
              <span className="text-xl">👨‍👩‍👧‍👦</span>
              <div><p className="font-semibold">Share with Family</p><p className="text-xs text-gray-500">Share live tracking</p></div>
            </button>
            {driverPhone && (
              <button
                onClick={() => shareOnWhatsApp('driver')}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
              >
                <span className="text-xl">🚗</span>
                <div><p className="font-semibold">Message Driver</p><p className="text-xs text-gray-500">Send ride details to driver</p></div>
              </button>
            )}
            <button
              onClick={copyTrackingLink}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
            >
              <span className="text-xl">🔗</span>
              <div><p className="font-semibold">Copy Tracking Link</p><p className="text-xs text-gray-500">Share manually</p></div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}