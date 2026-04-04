import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import '../styles/globals.css';
import '../styles/dark.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '../context/LanguageContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import * as ga from '../lib/analytics';
import { initMonitoring } from '../lib/monitoring';

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  // Initialize monitoring
  useEffect(() => {
    initMonitoring();
  }, []);

  // Google Analytics - Track page views
  useEffect(() => {
    const handleRouteChange = (url) => {
      ga.pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('✅ Service Worker registered:', reg))
        .catch((err) => console.log('❌ Service Worker registration failed:', err));
    }
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check authentication session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Session loaded, can be used by auth provider
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
        <LoadingSpinner size="lg" text="Loading Maa Saraswati Travels..." fullScreen={false} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <Head>
              <meta charSet="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
              <meta name="theme-color" content="#F97316" />
              <meta name="color-scheme" content="light dark" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
              <meta name="apple-mobile-web-app-title" content="MST Travels" />
              <meta name="application-name" content="Maa Saraswati Travels" />
              <meta name="msapplication-TileColor" content="#F97316" />
              
              {/* PWA Manifest */}
              <link rel="manifest" href="/manifest.json" />
              <link rel="apple-touch-icon" href="/icons/icon-192.png" />
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
              <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
              
              {/* Preconnect for performance */}
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://maps.googleapis.com" />
              <link rel="preconnect" href="https://api.supabase.co" />
              
              {/* Google Fonts */}
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
              
              {/* Google Analytics */}
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${ga.GA_TRACKING_ID}`}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${ga.GA_TRACKING_ID}', {
                      page_path: window.location.pathname,
                      send_page_view: true
                    });
                  `,
                }}
              />
            </Head>
            
            {/* Toast Notifications Container */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
                success: {
                  duration: 3000,
                  iconTheme: { color: '#10B981' },
                },
                error: {
                  duration: 4000,
                  iconTheme: { color: '#EF4444' },
                },
                loading: {
                  duration: 2000,
                  iconTheme: { color: '#F97316' },
                },
              }}
            />
            
            {/* Offline Warning Banner */}
            {!isOnline && (
              <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-medium animate-slide-down">
                ⚠️ You are offline. Please check your internet connection.
              </div>
            )}
            
            {/* Main Application */}
            <Component {...pageProps} />
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;