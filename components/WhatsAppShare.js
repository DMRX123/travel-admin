// components/WhatsAppShare.js - CREATE NEW FILE
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function WhatsAppShare({ rideId, pickup, drop, fare, driverName, driverPhone }) {
  const [sharing, setSharing] = useState(false);

  const shareOnWhatsApp = () => {
    const message = `🚕 *Maa Saraswati Travels* 🚕\n\n` +
      `✅ *Ride Booked Successfully!*\n\n` +
      `📋 *Ride Details:*\n` +
      `📍 Pickup: ${pickup}\n` +
      `📍 Drop: ${drop}\n` +
      `💰 Fare: ₹${fare}\n` +
      `🚗 Vehicle: ${driverName ? 'Assigned' : 'Searching for driver...'}\n` +
      `🔢 Ride ID: ${rideId}\n\n` +
      `📞 *Support:* +91 98765 43210\n` +
      `📍 *Track:* https://maasaraswatitravels.com/track-ride?id=${rideId}\n\n` +
      `Thank you for choosing Maa Saraswati Travels! 🙏`;

    const whatsappUrl = `https://wa.me/91${driverPhone || '9876543210'}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const shareRideWithFamily = () => {
    const familyMessage = `🚕 *Ride Update - Maa Saraswati Travels*\n\n` +
      `I have booked a ride. Here are the details:\n` +
      `📍 From: ${pickup.substring(0, 50)}\n` +
      `📍 To: ${drop.substring(0, 50)}\n` +
      `💰 Fare: ₹${fare}\n` +
      `🔗 Track Live: https://maasaraswatitravels.com/track-ride?id=${rideId}\n\n` +
      `Share this link to track my ride live!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(familyMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-3">
      <button
        onClick={shareOnWhatsApp}
        className="w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold hover:bg-[#20b859] transition flex items-center justify-center gap-2"
      >
        <span className="text-xl">📱</span>
        Share on WhatsApp
      </button>
      
      <button
        onClick={shareRideWithFamily}
        className="w-full border border-[#25D366] text-[#25D366] py-2 rounded-xl font-semibold hover:bg-[#25D366]/10 transition flex items-center justify-center gap-2"
      >
        <span>👨‍👩‍👧‍👦</span>
        Share Live Location with Family
      </button>
    </div>
  );
}