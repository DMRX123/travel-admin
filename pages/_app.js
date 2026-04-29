// pages/_app.js - COMPLETE WORKING VERSION
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { initMonitoring } from '../lib/monitoring';
import * as ga from '../lib/analytics';
import { LanguageProvider } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';
import '../styles/dark.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialize monitoring
  useEffect(() => {
    initMonitoring();
    setMounted(true);
  }, []);

  // Google Analytics
  useEffect(() => {
    const handleRouteChange = (url) => {
      ga.pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  // Check auth session
  useEffect(() => {
    const checkSession = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading Maa Saraswati Travels...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <Head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
              <meta name="theme-color" content="#F97316" />
              <link rel="manifest" href="/manifest.json" />
            </Head>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Component {...pageProps} />
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;