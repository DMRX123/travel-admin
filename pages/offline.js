// pages/offline.js - EXCELLENT PRODUCTION READY
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
      setChecking(false);
    };
    
    checkConnection();
    
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Offline | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-7xl mb-6"
          >
            📡
          </motion.div>
          
          {isOnline && !checking ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Connection Restored! ✅</h1>
              <p className="text-white/70 mb-4">Redirecting you to the app...</p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
              <p className="text-white/70 mb-6">No internet connection detected. Please check your network and try again.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  🔄 Retry Connection
                </button>
                <p className="text-white/40 text-sm">
                  Once connection is restored, you'll be redirected automatically.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}