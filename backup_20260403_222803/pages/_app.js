import { useEffect, useState } from 'react';
import { initMonitoring } from '../lib/monitoring';
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
import * as ga from '../lib/analytics';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initMonitoring();
  }, []);
  
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
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
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
                    gtag('config', '${ga.GA_TRACKING_ID}');
                  `,
                }}
              />
            </Head>
            <Toaster position="top-right" />
            <Component {...pageProps} />
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;