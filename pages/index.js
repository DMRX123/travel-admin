import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [vehicle, setVehicle] = useState('sedan');

  const handleSearch = () => {
    if (!pickup || !drop) {
      alert('Please enter pickup and drop locations');
      return;
    }
    router.push(`/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=${vehicle}`);
  };

  return (
    <>
      <Head>
        <title>Maa Saraswati Travels - Best Taxi Service in India | Book Cab Online</title>
        <meta name="description" content="Book taxi, cab, car rental online at best prices. Outstation, airport, local rides. 24/7 service, professional drivers, clean cars. Maa Saraswati Travels - Your trusted travel partner." />
        <meta name="keywords" content="taxi service, cab booking, car rental, outstation taxi, airport taxi, local taxi, Maa Saraswati Travels" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <link rel="canonical" href="https://maasaraswatitravels.com" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600">
{/* Header - Updated (No Public Login Links) */}
<header className="bg-white/95 shadow-lg sticky top-0 z-50">
  <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
    <div className="flex items-center gap-2">
      <span className="text-3xl">🚐</span>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
        Maa Saraswati Travels
      </h1>
    </div>
    <div className="flex gap-4">
      <a href="tel:+919876543210" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition">
        📞 24/7 Support
      </a>
    </div>
  </div>
</header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Book Your Ride Instantly</h1>
          <p className="text-xl md:text-2xl mb-4">Maa Saraswati Travels - Your Trusted Travel Partner</p>
          <p className="text-lg mb-8">Best prices • Professional drivers • Clean cars • 24/7 service</p>
          
          {/* Booking Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto text-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-center text-orange-600">Book a Ride</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="📍 Pickup Location"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
              <input
                type="text"
                placeholder="📍 Drop Location"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
              />
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
              >
                <option value="auto">Auto Rickshaw - ₹10/km (3 seats)</option>
                <option value="sedan">Sedan - ₹15/km (4 seats)</option>
                <option value="suv">SUV - ₹20/km (6 seats)</option>
                <option value="luxury">Luxury - ₹30/km (4 seats)</option>
                <option value="tempo">Tempo Traveller - ₹25/km (12 seats)</option>
              </select>
              <button
                onClick={handleSearch}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition"
              >
                Get Fare & Book Now
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose Maa Saraswati Travels?</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: "🚗", title: "500+ Cars", desc: "Wide range of vehicles" },
                { icon: "⭐", title: "4.8 Rating", desc: "5000+ happy customers" },
                { icon: "💰", title: "Best Price", desc: "No hidden charges" },
                { icon: "🕐", title: "24/7 Support", desc: "Always available" },
                { icon: "🔒", title: "Safe & Secure", desc: "GPS tracked rides" },
                { icon: "👨‍✈️", title: "Pro Drivers", desc: "Experienced & verified" },
                { icon: "🧹", title: "Clean Cars", desc: "Hygiene certified" },
                { icon: "📱", title: "Easy Booking", desc: "Book in 30 seconds" },
              ].map((feature, i) => (
                <div key={i} className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-lg transition">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Popular Routes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { from: "Delhi", to: "Jaipur", price: "₹2,500" },
                { from: "Mumbai", to: "Pune", price: "₹1,800" },
                { from: "Delhi", to: "Agra", price: "₹2,000" },
                { from: "Bangalore", to: "Mysore", price: "₹1,500" },
                { from: "Delhi", to: "Haridwar", price: "₹3,000" },
                { from: "Kolkata", to: "Digha", price: "₹2,200" },
                { from: "Chennai", to: "Pondicherry", price: "₹2,500" },
                { from: "Hyderabad", to: "Warangal", price: "₹1,800" },
              ].map((route, i) => (
                <Link key={i} href={`/route/${route.from.toLowerCase()}-to-${route.to.toLowerCase()}`} className="bg-white p-4 rounded-lg text-center hover:shadow-lg transition border border-gray-200">
                  <p className="font-semibold">{route.from} → {route.to}</p>
                  <p className="text-orange-600 font-bold">From ₹{route.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Tourist Destinations Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Explore Sacred Destinations</h2>
            <p className="text-center text-gray-600 mb-12">Book your spiritual journey to Jyotirlingas, Ram Mandir, and holy cities</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { name: 'Ujjain Mahakaleshwar', state: 'MP', slug: 'ujjain-mahakaleshwar' },
                { name: 'Omkareshwar', state: 'MP', slug: 'omkareshwar' },
                { name: 'Ayodhya', state: 'UP', slug: 'ayodhya' },
                { name: 'Kashi (Varanasi)', state: 'UP', slug: 'kashi' },
                { name: 'Somnath', state: 'Gujarat', slug: 'somnath' },
                { name: 'Dwarka', state: 'Gujarat', slug: 'dwarka' },
                { name: 'Shirdi', state: 'Maharashtra', slug: 'shirdi' },
                { name: 'Trimbakeshwar', state: 'Maharashtra', slug: 'trimbakeshwar' },
              ].map((dest) => (
                <Link
                  key={dest.slug}
                  href={`/tour/${dest.slug}`}
                  className="bg-orange-50 rounded-xl p-4 text-center hover:shadow-md transition group"
                >
                  <div className="text-3xl mb-2">🕉️</div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-orange-600">{dest.name}</h3>
                  <p className="text-xs text-gray-500">{dest.state}</p>
                </Link>
              ))}
            </div>
            
            <div className="text-center">
              <Link href="/tour" className="inline-block bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition">
                View All Destinations →
              </Link>
            </div>
          </div>
        </section>

        {/* Cities Served */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">We Serve in Top Cities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow', 'Chandigarh', 'Indore'].map(city => (
                <Link key={city} href={`/${city.toLowerCase()}-taxi`} className="bg-orange-50 p-3 rounded-lg text-center hover:bg-orange-100 transition">
                  <span className="font-medium">{city}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

{/* Reviews */}
<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">What Our Customers Say</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {[
        { name: 'Rahul Sharma', city: 'Delhi', text: 'Excellent service! Driver reached on time, car was spotless. Highly recommend Maa Saraswati Travels!', rating: 5 },
        { name: 'Priya Patel', city: 'Mumbai', text: 'Best taxi service in Mumbai. Easy booking, fair pricing, and professional drivers.', rating: 5 },
        { name: 'Amit Kumar', city: 'Bangalore', text: 'Booked for airport pickup. Driver was waiting with a name board. Very professional!', rating: 5 },
        { name: 'Neha Gupta', city: 'Jaipur', text: 'Used for Jaipur sightseeing. Great experience, knowledgeable driver.', rating: 5 },
        { name: 'Vikram Singh', city: 'Pune', text: 'On-time service, clean car, fair price. Will use again!', rating: 4 },
        { name: 'Anjali Mehta', city: 'Chennai', text: 'Very responsive customer support. Booked last minute and they arranged quickly.', rating: 5 },
      ].map((review, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
          <div className="flex text-yellow-500 mb-3">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</div>
          <p className="text-gray-600 mb-4">&quot;{review.text}&quot;</p>
          <p className="font-semibold">- {review.name}</p>
          <p className="text-sm text-gray-500">{review.city}</p>
        </div>
      ))}
    </div>
  </div>
</section>

        {/* Trust Badges */}
        <section className="bg-gradient-to-r from-orange-500 to-red-600 py-12">
          <div className="container mx-auto px-4 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Trusted by 50,000+ Happy Customers</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div>✅ 24/7 Customer Support</div>
              <div>✅ GPS Tracked Rides</div>
              <div>✅ Verified Drivers</div>
              <div>✅ Best Price Guarantee</div>
              <div>✅ Cashless Payment</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-xl mb-4">Maa Saraswati Travels</h4>
                <p className="text-gray-400">Your trusted travel partner since 2015</p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Contact Info</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>📞 +91 98765 43210</li>
                  <li>✉️ support@maasaraswatitravels.com</li>
                  <li>📍 Delhi, India</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Download App</h4>
                <div className="flex gap-4">
                  <button className="bg-black text-white px-4 py-2 rounded-lg">📱 Google Play</button>
                  <button className="bg-black text-white px-4 py-2 rounded-lg">🍎 App Store</button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
              <p>&copy; 2024 Maa Saraswati Travels. All rights reserved. Designed for your travel comfort.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}