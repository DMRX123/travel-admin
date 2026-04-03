import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ReferralCard({ userId }) {
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadReferralData();
    }
  }, [userId]);

  const loadReferralData = async () => {
    setLoading(true);
    
    try {
      // Get user's referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        // Generate new referral code
        const newCode = userId.substring(0, 8).toUpperCase();
        await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', userId);
        setReferralCode(newCode);
      }

      // Get referral stats
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      if (!referralsError && referrals) {
        setReferralCount(referrals.length);
        setReferralEarnings(referrals.length * 100);
      }
    } catch (error) {
      console.error('Load referral error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    const referralLink = `https://maasaraswatitravels.com?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    toast.success('Referral link copied!');
  };

  const shareOnWhatsApp = () => {
    const message = `Book your ride with Maa Saraswati Travels! Use my referral code: ${referralCode} and get ₹100 off on your first ride. Download the app: https://maasaraswatitravels.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="animate-pulse">
          <div className="h-20 bg-white/30 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
      <div className="text-center mb-4">
        <span className="text-5xl">🎁</span>
        <h3 className="text-xl font-bold mt-2">Refer & Earn</h3>
        <p className="text-white/80 text-sm">Get ₹100 for each friend who books a ride</p>
      </div>

      <div className="bg-white/20 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-white/70">Your Referral Code</p>
            <p className="text-2xl font-mono font-bold">{referralCode}</p>
          </div>
          <button
            onClick={copyReferralCode}
            className="bg-white/30 px-4 py-2 rounded-lg hover:bg-white/40 transition text-sm"
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{referralCount}</p>
          <p className="text-xs text-white/70">Friends Referred</p>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">₹{referralEarnings}</p>
          <p className="text-xs text-white/70">Total Earned</p>
        </div>
      </div>

      <button
        onClick={shareOnWhatsApp}
        className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
      >
        <span>📱</span> Share on WhatsApp
      </button>
    </div>
  );
}