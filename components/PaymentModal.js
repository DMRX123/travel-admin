import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: any) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking'>('card');

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    const isScriptLoaded = await loadRazorpayScript();
    
    if (!isScriptLoaded) {
      alert('Payment gateway failed to load. Please try again.');
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: 'INR',
      name: 'Maa Saraswati Travels',
      description: `Booking #${bookingId}`,
      image: '/logo.png',
      order_id: bookingId,
      handler: function (response: any) {
        onSuccess(response.razorpay_payment_id);
        onClose();
      },
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notes: {
        booking_id: bookingId,
      },
      theme: {
        color: '#F97316',
      },
      modal: {
        ondismiss: function() {
          onFailure('Payment cancelled by user');
          setLoading(false);
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    setLoading(false);
  };

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Pay ₹{amount}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
            </div>

            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as any)}
                  className={`w-full p-4 rounded-xl border transition-all flex items-center gap-3 ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{method.name}</p>
                    <p className="text-xs text-gray-400">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <span className="text-orange-500">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>Pay ₹{amount}</>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              🔒 Secure payment powered by Razorpay. Your card details are encrypted.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}