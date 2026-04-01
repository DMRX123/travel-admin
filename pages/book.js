import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase'; // Make sure this import path is correct for your project
import ScheduledRideModal from '../components/ScheduledRideModal';
import Wallet from '../components/Wallet';

export default function BookRide() {
  const router = useRouter();
  const { pickup, drop, vehicle, distance, fare, tripType, days, stops } = router.query;
  const [isBooking, setIsBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    // Load saved user data from localStorage
    const savedName = localStorage.getItem('user_name');
    const savedPhone = localStorage.getItem('user_phone');
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

  // Add this useEffect to load wallet balance
  useEffect(() => {
    const loadWallet = async () => {
      if (phone) {
        // First get user by phone number
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phone)
          .single();
        
        if (userData) {
          const { data } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userData.id)
            .single();
          if (data) setWalletBalance(data.balance);
        }
      }
    };
    loadWallet();
  }, [phone]);

  const handleSendOtp = async () => {
    if (!name || !phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setResendDisabled(true);
    setOtpTimer(60);
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        toast.success(`OTP sent to ${phone}`);
        // For demo: show OTP in console, in production remove this
        console.log('OTP for testing:', data.otp);
      } else {
        toast.error(data.error || 'Failed to send OTP');
        setResendDisabled(false);
        setOtpTimer(0);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Network error. Please try again.');
      setResendDisabled(false);
      setOtpTimer(0);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      
      if (response.ok) {
        setVerified(true);
        toast.success('Phone verified successfully!');
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_phone', phone);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const handleResendOtp = () => {
    if (!resendDisabled) {
      handleSendOtp();
    }
  };

  const handleBooking = async () => {
    if (!verified) {
      toast.error('Please verify your phone number first');
      return;
    }
    
    setIsBooking(true);
    
    try {
      const parsedStops = stops ? JSON.parse(stops) : [];
      
      // If using wallet, deduct balance
      let finalFare = parseFloat(fare);
      if (useWallet && walletBalance > 0) {
        finalFare = Math.max(0, finalFare - Math.min(finalFare, walletBalance));
      }
      
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup,
          drop,
          vehicle,
          fare: finalFare,
          distance: parseFloat(distance),
          name,
          phone,
          paymentMethod: useWallet ? 'wallet' : paymentMethod,
          tripType: tripType || 'oneway',
          days: days ? parseInt(days) : 1,
          stops: parsedStops,
          useWallet,
          walletDeduction: useWallet ? Math.min(parseFloat(fare), walletBalance) : 0,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setBookingId(data.bookingId);
        toast.success('Booking confirmed!');
        router.push(`/booking-success?id=${data.bookingId}`);
      } else {
        toast.error(data.error || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const getVehicleDisplayName = () => {
    const vehicleMap = {
      auto: 'Auto Rickshaw',
      sedan: 'Sedan',
      suv: 'SUV',
      luxury: 'Luxury',
      tempo: 'Tempo Traveller'
    };
    const selectedVehicle = typeof vehicle === 'string' ? vehicle : 'sedan';
    return vehicleMap[selectedVehicle] || 'Sedan';
  };

  const parseStopsList = () => {
    if (!stops) return [];
    try {
      return JSON.parse(stops);
    } catch {
      return [];
    }
  };

  const stopsList = parseStopsList();

  return (
    <>
      <Head>
        <title>Confirm Booking | Maa Saraswati Travels</title>
        <meta name="description" content="Confirm your taxi booking. Best prices, professional drivers, 24/7 service." />
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
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Confirm Your Booking</h1>
            
            <div className="space-y-4 mb-8 p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-between"><span className="font-semibold">📍 Pickup:</span> <span>{pickup || 'Not specified'}</span></div>
              <div className="flex justify-between"><span className="font-semibold">📍 Drop:</span> <span>{drop || 'Not specified'}</span></div>
              {stopsList.length > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold">🗺️ Stops:</span>
                  <span>{stopsList.join(' → ')}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="font-semibold">🚗 Vehicle:</span> <span>{getVehicleDisplayName()}</span></div>
              <div className="flex justify-between"><span className="font-semibold">📏 Distance:</span> <span>{distance} km</span></div>
              {tripType === 'multiday' && (
                <div className="flex justify-between"><span className="font-semibold">📅 Days:</span> <span>{days} days</span></div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-2xl text-orange-600">💰 Total Fare:</span>
                <span className="text-2xl font-bold text-orange-600">₹{fare}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Details</h2>

              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="flex gap-2 flex-wrap">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength="10"
                />

                {!otpSent ? (
                  <button 
                    onClick={handleSendOtp} 
                    disabled={resendDisabled}
                    className="bg-orange-500 text-white px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    Send OTP
                  </button>
                ) : !verified ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      className="w-28 p-3 border rounded-lg text-center text-lg font-mono"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength="6"
                    />
                    <button 
                      onClick={handleVerifyOtp} 
                      className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600"
                    >
                      Verify
                    </button>
                    <button 
                      onClick={handleResendOtp} 
                      disabled={resendDisabled}
                      className="text-orange-500 text-sm hover:underline disabled:opacity-50"
                    >
                      {resendDisabled ? `Resend in ${otpTimer}s` : 'Resend'}
                    </button>
                  </div>
                ) : (
                  <span className="text-green-600 font-semibold p-3 flex items-center">✓ Verified</span>
                )}
              </div>

              <h2 className="text-xl font-semibold mt-4">Payment Method</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'cash', label: '💵 Cash', desc: 'Pay to driver' },
                  { value: 'upi', label: '📱 UPI', desc: 'Google Pay, PhonePe' },
                  { value: 'card', label: '💳 Card', desc: 'Credit/Debit Card' },
                  { value: 'wallet', label: '👛 Wallet', desc: 'Prepaid balance' },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-3 border rounded-lg text-left transition ${
                      paymentMethod === method.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{method.label}</div>
                    <div className="text-xs text-gray-500">{method.desc}</div>
                  </button>
                ))}
              </div>

              {/* Add after payment method selection, before confirm button */}
              {verified && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <Wallet userId={phone} />
                  
                  {walletBalance >= parseFloat(fare) && (
                    <label className="flex items-center gap-2 mt-3">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm">Pay ₹{Math.min(parseFloat(fare), walletBalance)} from wallet</span>
                    </label>
                  )}
                  
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-3 text-orange-500 text-sm hover:underline"
                  >
                    📅 Schedule for later
                  </button>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={isBooking || !verified}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold mt-6 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition"
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add at bottom before closing div */}
      <ScheduledRideModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        pickup={pickup}
        drop={drop}
        vehicle={vehicle}
        fare={fare}
        distance={distance}
      />
    </>
  );
}