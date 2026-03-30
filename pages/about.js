import Head from 'next/head';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | Maa Saraswati Travels - Your Trusted Travel Partner</title>
        <meta name="description" content="Maa Saraswati Travels - Since 2015, providing reliable taxi services across India. Professional drivers, clean cars, 24/7 service. Book your ride today!" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">About Maa Saraswati Travels</h1>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🚐</div>
              <p className="text-xl text-gray-600">Your Trusted Travel Partner Since 2015</p>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-3 text-orange-600">Our Story</h2>
                <p className="text-gray-600 leading-relaxed">Maa Saraswati Travels was founded in 2015 with a simple mission: to provide reliable, affordable, and safe taxi services across India. What started as a small fleet of 5 cars has now grown to over 500 vehicles serving thousands of happy customers every month.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3 text-orange-600">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed">To provide the best travel experience with professional drivers, clean vehicles, and transparent pricing. We believe in making travel convenient, safe, and enjoyable for everyone.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3 text-orange-600">Why Choose Us?</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div><strong>500+ Fleet</strong><p className="text-gray-500">Wide range of vehicles</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div><strong>Professional Drivers</strong><p className="text-gray-500">Experienced & verified</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div><strong>24/7 Support</strong><p className="text-gray-500">Round-the-clock assistance</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div><strong>Best Price Guarantee</strong><p className="text-gray-500">No hidden charges</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div><strong>GPS Tracking</strong><p className="text-gray-500">Safe & secure rides</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div><strong>Clean Cars</strong><p className="text-gray-500">Hygiene certified</p></div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3 text-orange-600">Our Presence</h2>
                <p className="text-gray-600">We operate in 15+ major cities across India including Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Jaipur, Ahmedabad, and more.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition">
              Book Your Ride Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}