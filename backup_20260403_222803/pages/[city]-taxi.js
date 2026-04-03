import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';

export default function CityTaxiPage() {
  const router = useRouter();
  const { city } = router.query;
  const cityName = city?.replace('-', ' ').toUpperCase() || 'Delhi';
  
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  return (
    <>
      <Head>
        <title>{cityName} Taxi Service | Best Cab Rental in {cityName} - Book Now</title>
        <meta name="description" content={`Book ${cityName} taxi, cab, car rental. Local and outstation rides. Best prices, 24/7 service. ${cityName} to ${cityName} airport, railway station.`} />
        <meta name="keywords" content={`${cityName} taxi, ${cityName} cab, ${cityName} car rental, taxi service ${cityName}`} />
        <link rel="canonical" href={`https://travelapp.com/${city}-taxi`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white py-4">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Travel App</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">{cityName} Taxi Service</h1>
          <p className="text-gray-600 mb-8">Best taxi service in {cityName}. Affordable rates, professional drivers, 24/7 availability.</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Book Your Ride</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Pickup Location" className="w-full p-3 border rounded-lg" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                <input type="text" placeholder="Drop Location" className="w-full p-3 border rounded-lg" value={drop} onChange={(e) => setDrop(e.target.value)} />
                <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold">Get Fare & Book</button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-xl mb-3">Popular Routes</h3>
                <ul className="space-y-2">
                  <li><Link href={`/${city}-to-jaipur`} className="text-blue-600 hover:underline">{cityName} to Jaipur Taxi</Link></li>
                  <li><Link href={`/${city}-to-agra`} className="text-blue-600 hover:underline">{cityName} to Agra Taxi</Link></li>
                  <li><Link href={`/${city}-airport`} className="text-blue-600 hover:underline">{cityName} Airport Taxi</Link></li>
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-xl mb-3">Fare Chart</h3>
                <table className="w-full">
                  <tr><td className="py-2">Sedan</td><td className="text-right">₹15/km</td></tr>
                  <tr><td className="py-2">SUV</td><td className="text-right">₹20/km</td></tr>
                  <tr><td className="py-2">Luxury</td><td className="text-right">₹30/km</td></tr>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}