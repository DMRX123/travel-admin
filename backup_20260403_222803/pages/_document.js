// pages/_document.js - Updated version
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="hi">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="author" content="Maa Saraswati Travels" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="rating" content="General" />
        <meta name="revisit-after" content="1 days" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Maa Saraswati Travels" />
        <meta property="og:title" content="Maa Saraswati Travels - Best Taxi Service in India" />
        <meta property="og:description" content="Book taxi for Ujjain, Omkareshwar, Khajuraho, Ayodhya, Varanasi. Real-time fare, GPS tracking, professional drivers. 24/7 service." />
        <meta property="og:url" content="https://maasaraswatitravels.com" />
        <meta property="og:image" content="https://maasaraswatitravels.com/og-image.jpg" />
        <meta property="og:locale" content="hi_IN" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@maasaraswatitravels" />
        <meta name="twitter:title" content="Maa Saraswati Travels - Best Taxi Service" />
        <meta name="twitter:description" content="Book your ride instantly. Best prices, professional drivers, 24/7 support." />
        <meta name="twitter:image" content="https://maasaraswatitravels.com/twitter-image.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://maasaraswatitravels.com" />
        
        {/* Alternate Languages */}
        <link rel="alternate" hrefLang="en" href="https://maasaraswatitravels.com" />
        <link rel="alternate" hrefLang="hi" href="https://maasaraswatitravels.com/hi" />
        <link rel="alternate" hrefLang="x-default" href="https://maasaraswatitravels.com" />
        
        {/* Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#F97316" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="preconnect" href="https://api.supabase.co" />
        
        {/* Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "LocalBusiness",
                  "@id": "https://maasaraswatitravels.com/#localbusiness",
                  "name": "Maa Saraswati Travels",
                  "url": "https://maasaraswatitravels.com",
                  "logo": "https://maasaraswatitravels.com/logo.png",
                  "image": "https://maasaraswatitravels.com/og-image.jpg",
                  "description": "Best taxi service in India. Book cabs for Ujjain, Omkareshwar, Khajuraho, Ayodhya, Varanasi and more. Professional drivers, GPS tracking, 24/7 service.",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Sector 18",
                    "addressLocality": "Noida",
                    "addressRegion": "Uttar Pradesh",
                    "postalCode": "201301",
                    "addressCountry": "IN"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": "28.5355",
                    "longitude": "77.3910"
                  },
                  "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                  },
                  "telephone": "+919876543210",
                  "email": "support@maasaraswatitravels.com",
                  "priceRange": "₹₹",
                  "sameAs": [
                    "https://www.facebook.com/maasaraswatitravels",
                    "https://www.instagram.com/maasaraswatitravels",
                    "https://twitter.com/maasaraswatitravels"
                  ],
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "1250"
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://maasaraswatitravels.com/#website",
                  "url": "https://maasaraswatitravels.com",
                  "name": "Maa Saraswati Travels",
                  "description": "Best taxi service in India",
                  "publisher": {
                    "@id": "https://maasaraswatitravels.com/#localbusiness"
                  }
                }
              ]
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}