import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Wallet({ userId, onBalanceUpdate }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadWallet();
    }
  }, [userId]);

  const loadWallet = async () => {
    setLoading(true);
    
    try {
      // Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Wallet load error:', walletError);
      }

      if (wallet) {
        setBalance(wallet.balance);
      } else {
        // Create wallet if not exists
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();
        
        if (!createError && newWallet) {
          setBalance(newWallet.balance || 0);
        }
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

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
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
      // In production, integrate Razorpay here
      // For demo, simulate success
      
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: balance + amount })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'credit',
          description: 'Wallet recharge',
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (txError) throw txError;

      setBalance(balance + amount);
      onBalanceUpdate?.(balance + amount);
      toast.success(`₹${amount} added to wallet`);
      setAddAmount('');
      setShowAddModal(false);
      loadWallet();
    } catch (error) {
      console.error('Add money error:', error);
      toast.error('Failed to add money');
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
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-white/80 text-sm">Wallet Balance</p>
          <p className="text-4xl font-bold">₹{balance}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition text-sm"
        >
          + Add Money
        </button>
      </div>

      {transactions.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto">
          {transactions.map((tx) => (
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
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Add Money to Wallet</h2>
            <input
              type="number"
              placeholder="Enter amount (₹)"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-lg mb-4 focus:ring-2 focus:ring-orange-500"
            />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAddAmount(amt.toString())}
                  className="py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                disabled={adding}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {adding ? 'Processing...' : 'Add Money'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}