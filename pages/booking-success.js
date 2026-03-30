import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function BookingSuccess() {
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    const generateId = () => {
      const id = 'MS' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      setBookingId(id);
    };
    generateId();
  }, []);

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
            <p className="text-xl font-bold text-orange-600">{bookingId}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span className="text-green-600 font-semibold">Confirmed</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Driver will contact you in:</span>
              <span className="font-semibold">5-10 minutes</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/" className="block w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition">
              Back to Home
            </Link>
            <button
              onClick={() => window.print()}
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