import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import RatingModal from '../components/RatingModal';
import { downloadInvoice } from '../components/InvoicePDF';

export default function BookingSuccess() {
  const router = useRouter();
  const { id } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rideDetails, setRideDetails] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/booking/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setBooking(data);
        } else {
          console.error('Failed to fetch booking');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [id]);

  // Add this useEffect for fetching ride details
  useEffect(() => {
    const fetchDetails = async () => {
      if (id) {
        const { data: ride } = await supabase
          .from('rides')
          .select('*, user:user_id(*), driver:driver_id(*)')
          .eq('id', id)
          .single();
        if (ride) {
          setRideDetails(ride);
          if (ride.driver_id) {
            const { data: driver } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', ride.driver_id)
              .single();
            setDriverDetails(driver);
          }
        }
      }
    };
    fetchDetails();
  }, [id]);

  const getVehicleDisplayName = (vehicle) => {
    const vehicleMap = {
      auto: 'Auto Rickshaw',
      sedan: 'Sedan',
      suv: 'SUV',
      luxury: 'Luxury',
      tempo: 'Tempo Traveller'
    };
    return vehicleMap[vehicle] || 'Sedan';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find your booking details.</p>
            <Link href="/" className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Booking Confirmed | Maa Saraswati Travels</title>
        <meta name="description" content="Your taxi booking has been confirmed. Track your ride and get driver details." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Maa Saraswati Travels
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Booking Confirmed! 🎉</h1>
              <p className="text-gray-600 mt-2">Your ride has been booked successfully</p>
            </div>

            {/* Booking ID */}
            <div className="bg-orange-50 p-4 rounded-lg text-center mb-6">
              <p className="text-sm text-gray-600">Booking ID</p>
              <p className="text-2xl font-mono font-bold text-orange-600">{booking.id}</p>
            </div>

            {/* Ride Details */}
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold border-b pb-2">Ride Details</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">📍 Pickup Location</p>
                  <p className="font-medium">{booking.pickup}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">📍 Drop Location</p>
                  <p className="font-medium">{booking.drop}</p>
                </div>
                {booking.stops && booking.stops.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">🗺️ Stops</p>
                    <p className="font-medium">{booking.stops.join(' → ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">🚗 Vehicle Type</p>
                  <p className="font-medium">{getVehicleDisplayName(booking.vehicle)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">📏 Distance</p>
                  <p className="font-medium">{booking.distance} km</p>
                </div>
                {booking.tripType === 'multiday' && (
                  <div>
                    <p className="text-sm text-gray-500">📅 Trip Duration</p>
                    <p className="font-medium">{booking.days} days</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">💰 Fare</p>
                  <p className="text-xl font-bold text-orange-600">₹{booking.fare}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">💳 Payment Method</p>
                  <p className="font-medium capitalize">{booking.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Driver Details - If assigned */}
            {booking.driver && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold border-b pb-2">Driver Details</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👨‍✈️</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{booking.driver.name}</p>
                      <p className="text-gray-600">{booking.driver.phone}</p>
                      {booking.driver.vehicleNumber && (
                        <p className="text-sm text-gray-500">Vehicle: {booking.driver.vehicleNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Support */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600">Contact our 24/7 customer support:</p>
              <div className="flex gap-3 mt-2">
                <a href="tel:+919876543210" className="text-orange-600 font-medium">📞 +91 98765 43210</a>
                <span className="text-gray-300">|</span>
                <a href="mailto:support@maasaraswatitravels.com" className="text-orange-600 font-medium">📧 support@maasaraswatitravels.com</a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link href="/track-ride?id={booking.id}" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold text-center hover:from-orange-600 hover:to-red-600 transition">
                Track Your Ride
              </Link>
              
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => downloadInvoice(rideDetails, rideDetails?.user, driverDetails)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600"
                >
                  📄 Download Invoice
                </button>
                {rideDetails?.status === 'completed' && !rideDetails?.rated && (
                  <button
                    onClick={() => setShowRating(true)}
                    className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600"
                  >
                    ⭐ Rate Driver
                  </button>
                )}
              </div>
              
              <Link href="/" className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg font-semibold text-center hover:bg-orange-50 transition">
                Book Another Ride
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add RatingModal at end */}
      <RatingModal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        rideId={id}
        driverId={rideDetails?.driver_id}
        onRated={() => setRideDetails({ ...rideDetails, rated: true })}
      />
    </>
  );
}