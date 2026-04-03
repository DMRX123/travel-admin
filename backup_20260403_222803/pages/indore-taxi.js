import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';

export default function CityTaxiPage() {
  const router = useRouter();
  const { city } = router.query;
  const cityName = city ? city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Delhi';
  
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  const handleSearch = () => {
    if (pickup && drop) {
      router.push(`/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=sedan`);
    }
  };

  return (
    <>
      <Head>
        <title>{cityName} Taxi Service | Best Cab Rental in {cityName} | Maa Saraswati Travels</title>
        <meta name="description" content={`Book ${cityName} taxi, cab, car rental online. Local and outstation rides at best prices. 24/7 service, professional drivers, clean cars. ${cityName} to airport, railway station, and city tours.`} />
        <meta name="keywords" content={`${cityName} taxi, ${cityName} cab, ${cityName} car rental, taxi service ${cityName}, outstation taxi ${cityName}, airport taxi ${cityName}`} />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content={cityName} />
        <link rel="canonical" href={`https://maasaraswatitravels.com/${city}-taxi`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">{cityName} Taxi Service</h1>
          <p className="text-gray-600 mb-8">Best taxi service in {cityName}. Affordable rates, professional drivers, 24/7 availability. Book your ride now!</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-orange-600">Book Your Ride</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Pickup Location" className="w-full p-3 border rounded-lg" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                <input type="text" placeholder="Drop Location" className="w-full p-3 border rounded-lg" value={drop} onChange={(e) => setDrop(e.target.value)} />
                <button onClick={handleSearch} className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold hover:bg-orange-600">Get Fare & Book</button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-xl mb-3">Popular Routes from {cityName}</h3>
                <ul className="space-y-2">
                  {cityName === 'Delhi' && (
                    <>
                      <li><Link href="/route/delhi-to-jaipur" className="text-orange-600 hover:underline">Delhi to Jaipur Taxi - ₹2,500</Link></li>
                      <li><Link href="/route/delhi-to-agra" className="text-orange-600 hover:underline">Delhi to Agra Taxi - ₹2,000</Link></li>
                      <li><Link href="/route/delhi-to-haridwar" className="text-orange-600 hover:underline">Delhi to Haridwar Taxi - ₹3,000</Link></li>
                      <li><Link href="/route/delhi-airport" className="text-orange-600 hover:underline">Delhi Airport Taxi - ₹500</Link></li>
                    </>
                  )}
                  {cityName === 'Mumbai' && (
                    <>
                      <li><Link href="/route/mumbai-to-pune" className="text-orange-600 hover:underline">Mumbai to Pune Taxi - ₹1,800</Link></li>
                      <li><Link href="/route/mumbai-to-nashik" className="text-orange-600 hover:underline">Mumbai to Nashik Taxi - ₹2,200</Link></li>
                      <li><Link href="/route/mumbai-airport" className="text-orange-600 hover:underline">Mumbai Airport Taxi - ₹400</Link></li>
                    </>
                  )}
                  <li><Link href={`/${city}-to-jaipur`} className="text-orange-600 hover:underline">{cityName} to Jaipur Taxi</Link></li>
                  <li><Link href={`/${city}-to-agra`} className="text-orange-600 hover:underline">{cityName} to Agra Taxi</Link></li>
                  <li><Link href={`/${city}-airport`} className="text-orange-600 hover:underline">{cityName} Airport Taxi</Link></li>
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-xl mb-3">Fare Chart</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b"><td className="py-2">Auto Rickshaw</td><td className="text-right">₹10/km</td><td className="text-right text-gray-500">3 seats</td></tr>
                    <tr className="border-b"><td className="py-2">Sedan (4 seats)</td><td className="text-right">₹15/km</td><td className="text-right text-gray-500">Best for couples</td></tr>
                    <tr className="border-b"><td className="py-2">SUV (6 seats)</td><td className="text-right">₹20/km</td><td className="text-right text-gray-500">Family trips</td></tr>
                    <tr className="border-b"><td className="py-2">Luxury (4 seats)</td><td className="text-right">₹30/km</td><td className="text-right text-gray-500">Premium experience</td></tr>
                    <tr><td className="py-2">Tempo (12 seats)</td><td className="text-right">₹25/km</td><td className="text-right text-gray-500">Group travel</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Why Choose Maa Saraswati Travels in {cityName}?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3"><span className="text-2xl">✓</span><div><strong>Professional Drivers</strong><p className="text-gray-600">Experienced and verified local drivers</p></div></div>
              <div className="flex items-start gap-3"><span className="text-2xl">✓</span><div><strong>Clean & Hygienic Cars</strong><p className="text-gray-600">Sanitized vehicles for your safety</p></div></div>
              <div className="flex items-start gap-3"><span className="text-2xl">✓</span><div><strong>24/7 Customer Support</strong><p className="text-gray-600">Round-the-clock assistance</p></div></div>
            </div>
          </div>

          <div className="mt-8 bg-orange-50 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Need a ride in {cityName}?</h3>
            <p className="mb-4">Book now and get instant confirmation!</p>
            <Link href="/book" className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600">Book Now</Link>
          </div>
        </div>
      </div>
    </>
  );
}