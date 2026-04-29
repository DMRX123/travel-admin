// pages/confirm-booking.js - OPTIMIZED PRODUCTION READY
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { isValidPhone, isValidName, isValidOTP } from '../lib/validators';


const VEHICLE_RATES = {
  bike: { name: 'Bike', icon: '🏍️', baseFare: 20, perKm: 8 },
  auto: { name: 'Auto', icon: '🛺', baseFare: 30, perKm: 12 },
  sedan: { name: 'Sedan', icon: '🚗', baseFare: 60, perKm: 15 },
  suv: { name: 'SUV', icon: '🚙', baseFare: 80, perKm: 20 },
  luxury: { name: 'Luxury', icon: '🚘', baseFare: 120, perKm: 30 },
  tempo: { name: 'Tempo', icon: '🚐', baseFare: 150, perKm: 25 },
};

export default function ConfirmBooking() {
  const router = useRouter();
  const { pickup, drop, pickupLat, pickupLng, dropLat, dropLng, distance, vehicle: vehicleParam } = router.query;
  
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleParam || 'sedan');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isBooking, setIsBooking] = useState(false);
  const [fare, setFare] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const dist = parseFloat(distance) || 0;
  const vehicle = VEHICLE_RATES[selectedVehicle] || VEHICLE_RATES.sedan;
  
  useEffect(() => {
    const calculatedFare = vehicle.baseFare + (dist * vehicle.perKm);
    const minFare = { bike: 25, auto: 35, sedan: 50, suv: 70, luxury: 100, tempo: 150 };
    const finalFare = Math.max(calculatedFare, minFare[selectedVehicle] || 50);
    setFare(Math.round(finalFare));
  }, [dist, selectedVehicle, vehicle.baseFare, vehicle.perKm]);

  useEffect(() => {
    const savedName = localStorage.getItem('user_name');
    const savedPhone = localStorage.getItem('user_phone');
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

const handleSendOtp = async () => {
  if (!name || !isValidName(name)) {
    toast.error('Please enter a valid name');
    return;
  }
  
  if (!phone || !isValidPhone(phone)) {
    toast.error('Please enter a valid 10-digit phone number');
    return;
  }

    setOtpTimer(60);
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });
      
      if (response.ok) {
        setOtpSent(true);
        toast.success(`OTP sent to ${phone}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send OTP');
        setOtpTimer(0);
      }
    } catch (error) {
      toast.error('Network error');
      setOtpTimer(0);
    }
  };

const handleVerifyOtp = async () => {
  if (!otp || !isValidOTP(otp)) {
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
        toast.success('Phone verified!');
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_phone', phone);
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const handleBooking = async () => {
    if (!verified) {
      toast.error('Please verify your phone number');
      return;
    }
    
    setIsBooking(true);
    
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: decodeURIComponent(pickup || ''),
          drop: decodeURIComponent(drop || ''),
          vehicleType: selectedVehicle,
          pickupLat: parseFloat(pickupLat),
          pickupLng: parseFloat(pickupLng),
          dropLat: parseFloat(dropLat),
          dropLng: parseFloat(dropLng),
          distance: dist,
          name,
          phone,
          paymentMethod,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Booking confirmed!');
        router.push(`/booking-success?id=${data.bookingId}`);
      } else {
        toast.error(data.error || 'Booking failed');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsBooking(false);
    }
  };

  const vehicles = Object.entries(VEHICLE_RATES);

  return (
    <>
      <Head>
        <title>Confirm Booking | Maa Saraswati Travels</title>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Confirm Your Booking</h1>
            
            {/* Vehicle Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Vehicle</label>
              <div className="grid grid-cols-3 gap-2">
                {vehicles.map(([key, v]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedVehicle(key)}
                    className={`p-3 rounded-xl text-center transition-all ${selectedVehicle === key ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    <div className="text-2xl">{v.icon}</div>
                    <div className="text-sm font-semibold">{v.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Summary */}
            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg mb-6">
              <div className="flex justify-between"><span className="font-semibold">📍 Pickup:</span><span className="text-right">{decodeURIComponent(pickup || '')}</span></div>
              <div className="flex justify-between"><span className="font-semibold">📍 Drop:</span><span className="text-right">{decodeURIComponent(drop || '')}</span></div>
              <div className="flex justify-between"><span className="font-semibold">📏 Distance:</span><span>{dist.toFixed(1)} km</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="font-semibold text-xl">💰 Total Fare:</span><span className="text-2xl font-bold text-orange-600">₹{fare}</span></div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Contact Details</h2>
              <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={name} onChange={(e) => setName(e.target.value)} />
              
              <div className="flex gap-2 flex-wrap">
                <input type="tel" placeholder="Phone Number" className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength="10" />
                {!otpSent ? (
                  <button onClick={handleSendOtp} disabled={otpTimer > 0} className="bg-orange-500 text-white px-4 rounded-lg disabled:opacity-50">Send OTP</button>
                ) : !verified ? (
                  <div className="flex gap-2 flex-1">
                    <input type="text" placeholder="OTP" className="w-28 p-3 border rounded-lg text-center font-mono" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" />
                    <button onClick={handleVerifyOtp} className="bg-green-500 text-white px-4 rounded-lg">Verify</button>
                  </div>
                ) : (
                  <span className="text-green-600 font-semibold p-3">✓ Verified</span>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Payment Method</h2>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'upi', 'card'].map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`p-3 border rounded-lg text-center capitalize ${paymentMethod === method ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                    {method === 'cash' && '💵 Cash'}
                    {method === 'upi' && '📱 UPI'}
                    {method === 'card' && '💳 Card'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleBooking} disabled={isBooking || !verified} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
              {isBooking ? 'Booking...' : `Confirm & Pay ₹${fare}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}