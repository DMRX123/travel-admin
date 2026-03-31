import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function BookingSuccess() {
  const router = useRouter();
  const { id } = router.query;
  const [bookingId, setBookingId] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setBookingId(id);
      fetchBookingDetails(id);
    } else {
      const generateId = () => {
        const generatedId = 'MS' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        setBookingId(generatedId);
      };
      generateId();
      setLoading(false);
    }
  }, [id]);

  const fetchBookingDetails = async (rideId) => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();
      
      if (!error && data) {
        setBookingDetails(data);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Booking Confirmed | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h1>
            <p className="text-gray-600 mt-2">Your ride has been successfully booked</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Booking ID</p>
            <p className="text-xl font-bold text-orange-600 font-mono">{bookingId}</p>
          </div>

          {bookingDetails && (
            <div className="space-y-3 mb-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pickup:</span>
                <span className="font-semibold text-right">{bookingDetails.pickup_address}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Drop:</span>
                <span className="font-semibold text-right">{bookingDetails.drop_address}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Vehicle:</span>
                <span className="font-semibold capitalize">{bookingDetails.vehicle_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fare:</span>
                <span className="font-semibold text-green-600">₹{bookingDetails.fare}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className="text-green-600 font-semibold capitalize">{bookingDetails.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Driver will contact in:</span>
                <span className="font-semibold">5-10 minutes</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/" className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition">
              Back to Home
            </Link>
            <button
              onClick={handlePrint}
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Download Invoice
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            A confirmation SMS has been sent to your registered mobile number.
          </p>
        </div>
      </div>
    </>
  );
}