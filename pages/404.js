// pages/404.js - EXCELLENT PRODUCTION READY
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function Custom404() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Page Not Found | Maa Saraswati Travels</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-8xl mb-6"
          >
            🚐
          </motion.div>
          <h1 className="text-7xl font-bold text-white mb-2">404</h1>
          <p className="text-2xl text-white/80 mb-2">Page Not Found</p>
          <p className="text-white/60 mb-6">The page you're looking for doesn't exist or has been moved.</p>
          
          <div className="flex flex-col gap-3">
            <Link href="/" className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Go to Homepage
            </Link>
            <Link href="/contact" className="inline-block border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all">
              Contact Support
            </Link>
          </div>
          
          <p className="text-white/40 text-sm mt-6">Redirecting to home in {countdown} seconds...</p>
        </motion.div>
      </div>
    </>
  );
}