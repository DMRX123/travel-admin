// pages/booking-success.js - EXCELLENT PRODUCTION READY
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import RatingModal from '../components/RatingModal';
import WhatsAppShare from '../components/WhatsAppShare';
import CancelRideModal from '../components/CancelRideModal';

export default function BookingSuccess() {
  const router = useRouter();
  const { id } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('idle');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/booking/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setBooking(data);
        } else {
          toast.error('Booking not found');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [id, router]);

  const downloadInvoice = async () => {
    setDownloadStatus('loading');
    try {
      const response = await fetch(`/api/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: id, email: booking?.user?.email })
      });
      const data = await response.json();
      
      if (data.html) {
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id?.substring(0, 8)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Invoice downloaded');
      } else {
        toast.error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadStatus('idle');
    }
  };

  const getVehicleDisplayName = (vehicle) => {
    const map = { auto: 'Auto Rickshaw', bike: 'Bike', sedan: 'Sedan', suv: 'SUV', luxury: 'Luxury', tempo: 'Tempo Traveller' };
    return map[vehicle] || 'Sedan';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <>
      <Head>
        <title>Booking Confirmed | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Maa Saraswati Travels
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8"
          >
            {/* Success Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
              >
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Booking Confirmed! 🎉</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your ride has been booked successfully</p>
            </div>

            {/* Booking ID */}
            <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
              <p className="text-2xl font-mono font-bold text-orange-600 dark:text-orange-400">{booking.id}</p>
            </div>

            {/* Ride Details */}
            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 dark:text-white">Ride Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-sm text-gray-500">📍 Pickup</p><p className="font-medium text-gray-800 dark:text-gray-200">{booking.pickup}</p></div>
                <div><p className="text-sm text-gray-500">📍 Drop</p><p className="font-medium text-gray-800 dark:text-gray-200">{booking.drop}</p></div>
                <div><p className="text-sm text-gray-500">🚗 Vehicle</p><p className="font-medium capitalize">{getVehicleDisplayName(booking.vehicle)}</p></div>
                <div><p className="text-sm text-gray-500">📏 Distance</p><p className="font-medium">{booking.distance} km</p></div>
                <div><p className="text-sm text-gray-500">💳 Payment</p><p className="font-medium capitalize">{booking.paymentMethod || 'Cash'}</p></div>
                <div><p className="text-sm text-gray-500">📅 Booked on</p><p className="font-medium">{formatDate(booking.createdAt)}</p></div>
                <div className="col-span-2 pt-2 border-t"><div className="flex justify-between"><span className="font-semibold text-lg">Total Fare</span><span className="text-2xl font-bold text-orange-600">₹{booking.fare}</span></div></div>
              </div>
            </div>

            {/* Driver Details */}
            {booking.driver && (
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-semibold border-b pb-2 text-gray-800 dark:text-white">Driver Details</h2>
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-2xl">👨‍✈️</div>
                  <div><p className="font-semibold text-lg">{booking.driver.name}</p><p className="text-gray-600 dark:text-gray-400">{booking.driver.phone}</p><p className="text-sm text-gray-500">{booking.driver.vehicleNumber}</p></div>
                </div>
              </div>
            )}

            {/* Support */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Need Help?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contact our 24/7 customer support:</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <a href="tel:+919876543210" className="text-orange-600 dark:text-orange-400 font-medium">📞 +91 98765 43210</a>
                <a href="mailto:support@maasaraswatitravels.com" className="text-orange-600 dark:text-orange-400 font-medium">✉️ support@maasaraswatitravels.com</a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link href={`/track-ride?id=${booking.id}`} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold text-center hover:shadow-lg transition">
                Track Your Ride
              </Link>
              
              <div className="flex gap-3">
                <button onClick={downloadInvoice} disabled={downloadStatus === 'loading'} className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50">
                  {downloadStatus === 'loading' ? '...' : '📄 Download Invoice'}
                </button>
                {booking.status === 'completed' && !booking.rated && (
                  <button onClick={() => setShowRating(true)} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600">
                    ⭐ Rate Driver
                  </button>
                )}
              </div>

              {booking.status === 'pending' && (
                <button onClick={() => setShowCancelModal(true)} className="w-full border border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  Cancel Ride
                </button>
              )}

              <WhatsAppShare rideId={booking.id} pickup={booking.pickup} drop={booking.drop} fare={booking.fare} driverName={booking.driver?.name} driverPhone={booking.driver?.phone} bookingDate={booking.createdAt} />

              <Link href="/" className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg font-semibold text-center hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
                Book Another Ride
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <CancelRideModal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} rideId={id} onCancelled={() => { setShowCancelModal(false); router.push('/'); }} />
      <RatingModal isOpen={showRating} onClose={() => setShowRating(false)} rideId={id} driverId={booking.driver?.id} onRated={() => setBooking({ ...booking, rated: true })} />
    </>
  );
}