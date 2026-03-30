import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';

export default function RoutePage() {
  const router = useRouter();
  const { from, to } = router.query;
  const fromCity = from?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Delhi';
  const toCity = to?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Jaipur';
  const routeName = `${fromCity} to ${toCity}`;

  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  const routeData = {
    'Delhi to Jaipur': { distance: 280, fare: 4200, time: '5-6 hours' },
    'Delhi to Agra': { distance: 230, fare: 3450, time: '3-4 hours' },
    'Delhi to Haridwar': { distance: 220, fare: 3300, time: '4-5 hours' },
    'Mumbai to Pune': { distance: 150, fare: 2250, time: '2-3 hours' },
    'Bangalore to Mysore': { distance: 140, fare: 2100, time: '2-3 hours' },
  };

  const routeInfo = routeData[routeName] || { distance: 200, fare: 3000, time: '4-5 hours' };

  const handleSearch = () => {
    if (pickup && drop) {
      router.push(`/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=sedan`);
    }
  };

  return (
    <>
      <Head>
        <title>{routeName} Taxi | Best Cab Service | Maa Saraswati Travels</title>
        <meta name="description" content={`Book ${routeName} taxi at best prices. ${routeInfo.distance} km, ${routeInfo.time} journey. Professional drivers, clean cars, 24/7 service. Book now!`} />
        <meta name="keywords" content={`${routeName} taxi, ${routeName} cab, ${fromCity} to ${toCity} taxi, outstation taxi ${fromCity} to ${toCity}`} />
        <link rel="canonical" href={`https://maasaraswatitravels.com/route/${from}-to-${to}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">{routeName} Taxi Service</h1>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-orange-600">Book {routeName} Taxi</h2>
                <div className="space-y-4">
                  <input type="text" placeholder={`Pickup in ${fromCity}`} className="w-full p-3 border rounded-lg" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                  <input type="text" placeholder={`Drop in ${toCity}`} className="w-full p-3 border rounded-lg" value={drop} onChange={(e) => setDrop(e.target.value)} />
                  <button onClick={handleSearch} className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold hover:bg-orange-600">Get Fare & Book</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Route Information</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Distance</p>
                    <p className="text-2xl font-bold text-orange-600">{routeInfo.distance} km</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Estimated Fare</p>
                    <p className="text-2xl font-bold text-orange-600">₹{routeInfo.fare}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Travel Time</p>
                    <p className="text-2xl font-bold text-orange-600">{routeInfo.time}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Vehicle Options</p>
                    <p className="text-xl font-bold text-orange-600">Sedan/SUV/Luxury</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">What&apos;s Included:</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>✓ Professional, verified driver</li>
                    <li>✓ Clean, sanitized car</li>
                    <li>✓ GPS tracking for safety</li>
                    <li>✓ 24/7 customer support</li>
                    <li>✓ Toll charges included</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="font-bold text-xl mb-3">Why Choose Us?</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">✓ Best price guarantee</li>
                  <li className="flex items-center gap-2">✓ No hidden charges</li>
                  <li className="flex items-center gap-2">✓ Instant booking confirmation</li>
                  <li className="flex items-center gap-2">✓ 24/7 customer support</li>
                  <li className="flex items-center gap-2">✓ Free cancellation up to 1 hour</li>
                </ul>
              </div>

              <div className="bg-orange-50 rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-xl mb-3">Need Help?</h3>
                <p className="text-gray-600 mb-4">Call us anytime for assistance</p>
                <a href="tel:+919876543210" className="block text-center bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">📞 +91 98765 43210</a>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Popular Routes from {fromCity}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Jaipur', 'Agra', 'Haridwar', 'Chandigarh', 'Lucknow', 'Amritsar', 'Shimla', 'Manali'].map(city => (
                <Link key={city} href={`/route/${from?.toLowerCase()}-to-${city.toLowerCase()}`} className="bg-gray-100 p-2 rounded-lg text-center hover:bg-orange-100 transition">
                  {fromCity} → {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}