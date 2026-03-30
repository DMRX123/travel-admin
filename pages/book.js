import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function BookRide() {
  const router = useRouter();
  const { pickup, drop, vehicle } = router.query;
  const [isBooking, setIsBooking] = useState(false);
  const [fare, setFare] = useState(0);
  const [distance, setDistance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const vehicleRates = {
      auto: 10,
      sedan: 15,
      suv: 20,
      luxury: 30,
      tempo: 25,
    };

    const calculateFare = () => {
      if (pickup && drop) {
        const simulatedDistance = Math.floor(Math.random() * 50) + 10;
        setDistance(simulatedDistance);

        const selectedVehicle = typeof vehicle === 'string' ? vehicle : 'sedan';

        // ✅ FIXED (removed TypeScript assertion)
        const rate = vehicleRates[selectedVehicle] || 15;

        setFare(simulatedDistance * rate);
      }
    };

    calculateFare();
  }, [pickup, drop, vehicle]);

  const handleSendOtp = () => {
    if (!name || !phone) {
      alert('Please enter your name and phone number');
      return;
    }
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtp(generatedOtp);
    setOtpSent(true);
    alert(`OTP sent to ${phone}: ${generatedOtp}`);
  };

  const handleVerifyOtp = () => {
    if (otp === '1234') {
      setVerified(true);
      alert('Phone verified successfully!');
    } else {
      alert('Invalid OTP');
    }
  };

  const handleBooking = async () => {
    if (!verified) {
      alert('Please verify your phone number first');
      return;
    }
    
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      alert('Booking confirmed! Driver will contact you shortly.');
      router.push('/booking-success');
    }, 2000);
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

    // ✅ FIXED (removed TypeScript assertion)
    return vehicleMap[selectedVehicle] || 'Sedan';
  };

  return (
    <>
      <Head>
        <title>Book Your Ride | Maa Saraswati Travels</title>
        <meta name="description" content="Book your taxi ride instantly. Best prices, professional drivers, 24/7 service." />
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
              <div className="flex justify-between"><span className="font-semibold">🚗 Vehicle:</span> <span>{getVehicleDisplayName()}</span></div>
              <div className="flex justify-between"><span className="font-semibold">📏 Distance:</span> <span>{distance} km</span></div>
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
                className="w-full p-3 border rounded-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="flex gap-2 flex-wrap">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="flex-1 p-3 border rounded-lg"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                {!otpSent ? (
                  <button onClick={handleSendOtp} className="bg-orange-500 text-white px-4 rounded-lg hover:bg-orange-600">
                    Send OTP
                  </button>
                ) : !verified ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="OTP"
                      className="w-24 p-3 border rounded-lg"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={handleVerifyOtp} className="bg-green-500 text-white px-4 rounded-lg hover:bg-green-600">
                      Verify
                    </button>
                  </div>
                ) : (
                  <span className="text-green-600 font-semibold p-3">✓ Verified</span>
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
    </>
  );
}