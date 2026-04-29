// components/Wallet.js - EXCELLENT WITH RAZORPAY INTEGRATION
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Wallet({ userId, onBalanceUpdate }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    if (userId) {
      loadWallet();
    }
  }, [userId]);

  const loadWallet = async () => {
    setLoading(true);
    
    try {
      // Get wallet balance
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Wallet load error:', walletError);
      }

      if (wallet) {
        setBalance(wallet.balance);
      } else {
        // Create wallet if not exists
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();
        
        if (newWallet) setBalance(0);
      }

      // Get transactions
      const { data: transactionsData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Load wallet error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
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

  const handleAddMoney = async () => {
    const amount = selectedAmount || parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum recharge amount is ₹100');
      return;
    }

    setAdding(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Payment gateway failed to load');
        setAdding(false);
        return;
      }

      // Create order
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId }),
      });
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'Maa Saraswati Travels',
        description: `Wallet Recharge - ₹${amount}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          // Verify payment and update wallet
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              amount,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          const verifyData = await verifyResponse.json();
          
          if (verifyData.success) {
            setBalance(verifyData.newBalance);
            if (onBalanceUpdate) onBalanceUpdate(verifyData.newBalance);
            toast.success(`₹${amount} added to wallet`);
            setAddAmount('');
            setSelectedAmount(null);
            setShowAddModal(false);
            loadWallet();
          } else {
            toast.error(verifyData.error || 'Payment verification failed');
          }
        },
        prefill: {
          name: 'Maa Saraswati Travels User',
        },
        theme: { color: '#F97316' },
        modal: {
          ondismiss: () => {
            setAdding(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Add money error:', error);
      toast.error(error.message || 'Failed to add money');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white/30 rounded w-24 mb-2"></div>
          <div className="h-8 bg-white/30 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 text-sm">Wallet Balance</p>
            <p className="text-4xl font-bold">₹{balance.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            + Add Money
          </button>
        </div>

        {transactions.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b border-white/20">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-white/60">{formatDate(tx.created_at)}</p>
                </div>
                <span className={`font-semibold ${tx.type === 'credit' ? 'text-green-300' : 'text-red-300'}`}>
                  {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                </span>
              </div>
            ))}
            {transactions.length > 5 && (
              <p className="text-center text-xs text-white/60 pt-2">+{transactions.length - 5} more transactions</p>
            )}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add Money to Wallet</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setAddAmount(amt.toString());
                    }}
                    className={`py-2 rounded-lg transition ${
                      selectedAmount === amt
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <input
                type="number"
                placeholder="Enter amount (₹)"
                value={addAmount}
                onChange={(e) => {
                  setAddAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg mb-4 focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />

              <button
                onClick={handleAddMoney}
                disabled={adding}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition"
              >
                {adding ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  `Add ₹${selectedAmount || addAmount || 0}`
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                🔒 Secure payment powered by Razorpay
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}