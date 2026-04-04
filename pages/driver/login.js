import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function DriverLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.user_type === 'driver') {
          router.replace('/driver/dashboard');
        }
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        throw new Error('Invalid email or password');
      }

      if (!data?.user) {
        throw new Error('Login failed');
      }

      // Check if user is driver
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, is_active')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('Driver profile not found');
      }

      if (profile.user_type !== 'driver') {
        await supabase.auth.signOut();
        throw new Error('Invalid driver credentials');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('Your account is disabled');
      }

      // Check if driver is approved
      const { data: driverData } = await supabase
        .from('drivers')
        .select('is_approved')
        .eq('id', data.user.id)
        .single();

      if (!driverData?.is_approved) {
        await supabase.auth.signOut();
        throw new Error('Your application is pending approval');
      }

      toast.success('Login successful!');
      
      setTimeout(() => {
        window.location.href = '/driver/dashboard';
      }, 500);
      
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Driver Login | Maa Saraswati Travels</title>
      </Head>
      
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-orange-500 to-red-600'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className={`rounded-2xl shadow-2xl p-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center mb-8">
              <div className="text-5xl mb-3 animate-bounce">🚗</div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Driver Login
              </h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Maa Saraswati Travels
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className={`w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900'
                  }`}
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900'
                    }`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center space-y-2">
              <Link 
                href="/" 
                className={`block text-sm transition-colors ${
                  theme === 'dark' ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                ← Back to Website
              </Link>
              <Link 
                href="/driver/register" 
                className={`block text-sm transition-colors ${
                  theme === 'dark' ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
                }`}
              >
                New Driver? Register Here
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}