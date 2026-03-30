import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';

// Tourist destinations data
const destinationsData = {
  // Madhya Pradesh
  'ujjain-mahakaleshwar': {
    name: 'Ujjain Mahakaleshwar',
    state: 'Madhya Pradesh',
    temple: 'Mahakaleshwar Jyotirlinga',
    distance: { fromIndore: 55, fromBhopal: 190, fromDelhi: 800 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'One of the 12 Jyotirlingas, famous for Bhasma Aarti',
  },
  'omkareshwar': {
    name: 'Omkareshwar',
    state: 'Madhya Pradesh',
    temple: 'Omkareshwar Jyotirlinga',
    distance: { fromIndore: 77, fromBhopal: 235, fromUjjain: 133 },
    bestTime: 'October to March',
    duration: '1-2 days',
    description: 'Island-shaped Jyotirlinga on Narmada river',
  },
  'khajuraho': {
    name: 'Khajuraho',
    state: 'Madhya Pradesh',
    attraction: 'Khajuraho Temples (UNESCO)',
    distance: { fromJhansi: 175, fromBhopal: 385 },
    bestTime: 'October to February',
    duration: '2-3 days',
    description: 'Famous for ancient Hindu and Jain temples',
  },
  'bandhavgarh': {
    name: 'Bandhavgarh National Park',
    state: 'Madhya Pradesh',
    attraction: 'Tiger Safari',
    distance: { fromJabalpur: 165, fromKatni: 100 },
    bestTime: 'October to June',
    duration: '2-3 days',
    description: 'Highest tiger density in India',
  },

  // Uttar Pradesh
  'ayodhya': {
    name: 'Ayodhya',
    state: 'Uttar Pradesh',
    temple: 'Ram Janmabhoomi',
    distance: { fromLucknow: 135, fromPrayagraj: 165, fromDelhi: 650 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'Birthplace of Lord Ram, sacred city',
  },
  'kashi': {
    name: 'Kashi (Varanasi)',
    state: 'Uttar Pradesh',
    temple: 'Kashi Vishwanath Temple',
    distance: { fromLucknow: 320, fromPrayagraj: 120, fromDelhi: 800 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'The spiritual capital of India, Ganga Aarti',
  },
  'prayagraj': {
    name: 'Prayagraj (Allahabad)',
    state: 'Uttar Pradesh',
    attraction: 'Triveni Sangam',
    distance: { fromLucknow: 200, fromVaranasi: 120, fromDelhi: 700 },
    bestTime: 'October to March',
    duration: '1-2 days',
    description: 'Confluence of Ganga, Yamuna, Saraswati',
  },
  'mathura-vrindavan': {
    name: 'Mathura-Vrindavan',
    state: 'Uttar Pradesh',
    temple: 'Krishna Janmabhoomi',
    distance: { fromAgra: 60, fromDelhi: 150 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'Birthplace of Lord Krishna',
  },
  'chitrakoot': {
    name: 'Chitrakoot',
    state: 'Uttar Pradesh',
    attraction: 'Ram Ghat',
    distance: { fromPrayagraj: 125, fromKhajuraho: 150 },
    bestTime: 'October to March',
    duration: '1-2 days',
    description: 'Where Lord Ram spent 11 years in exile',
  },

  // Gujarat
  'somnath': {
    name: 'Somnath Temple',
    state: 'Gujarat',
    temple: 'Somnath Jyotirlinga',
    distance: { fromAhmedabad: 400, fromRajkot: 200, fromDwarka: 230 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'First Jyotirlinga, on Arabian Sea coast',
  },
  'dwarka': {
    name: 'Dwarka',
    state: 'Gujarat',
    temple: 'Dwarkadhish Temple',
    distance: { fromAhmedabad: 440, fromRajkot: 230, fromSomnath: 230 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'Kingdom of Lord Krishna',
  },
  'statue-of-unity': {
    name: 'Statue of Unity',
    state: 'Gujarat',
    attraction: 'World\'s tallest statue',
    distance: { fromAhmedabad: 200, fromVadodara: 90 },
    bestTime: 'October to March',
    duration: '1-2 days',
    description: 'Statue of Sardar Vallabhbhai Patel',
  },
  'gir': {
    name: 'Gir National Park',
    state: 'Gujarat',
    attraction: 'Asiatic Lions',
    distance: { fromAhmedabad: 360, fromRajkot: 160 },
    bestTime: 'December to March',
    duration: '2-3 days',
    description: 'Only place to see Asiatic lions',
  },
  'rann-of-kutch': {
    name: 'Rann of Kutch',
    state: 'Gujarat',
    attraction: 'White Desert',
    distance: { fromAhmedabad: 400, fromBhuj: 80 },
    bestTime: 'November to February',
    duration: '2-3 days',
    description: 'Famous Rann Utsav, white salt desert',
  },

  // Maharashtra
  'shirdi': {
    name: 'Shirdi',
    state: 'Maharashtra',
    temple: 'Sai Baba Temple',
    distance: { fromMumbai: 240, fromPune: 200, fromNashik: 90 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'Holy place of Sai Baba',
  },
  'trimbakeshwar': {
    name: 'Trimbakeshwar',
    state: 'Maharashtra',
    temple: 'Trimbakeshwar Jyotirlinga',
    distance: { fromMumbai: 170, fromNashik: 30, fromPune: 200 },
    bestTime: 'October to March',
    duration: '1-2 days',
    description: 'Jyotirlinga, origin of Godavari river',
  },
  'mahabaleshwar': {
    name: 'Mahabaleshwar',
    state: 'Maharashtra',
    attraction: 'Hill Station',
    distance: { fromPune: 120, fromMumbai: 260 },
    bestTime: 'October to June',
    duration: '2-3 days',
    description: 'Beautiful hill station, strawberry farms',
  },
  'ajanta-ellora': {
    name: 'Ajanta-Ellora Caves',
    state: 'Maharashtra',
    attraction: 'UNESCO World Heritage',
    distance: { fromAurangabad: 30, fromMumbai: 330 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'Ancient Buddhist caves, rock-cut temples',
  },
  'lonavala': {
    name: 'Lonavala',
    state: 'Maharashtra',
    attraction: 'Hill Station',
    distance: { fromMumbai: 83, fromPune: 64 },
    bestTime: 'October to May',
    duration: '1-2 days',
    description: 'Popular weekend getaway, waterfalls',
  },
};

export default function TouristDestinationPage() {
  const router = useRouter();
  const { destination } = router.query;
  const dest = destinationsData[destination];
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');

  if (!dest || !destination) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleSearch = () => {
    if (pickup && drop) {
      router.push(`/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=sedan`);
    }
  };

  return (
    <>
      <Head>
        <title>{dest.name} Tour Package | Taxi Service | Maa Saraswati Travels</title>
        <meta name="description" content={`Book {dest.name} tour package at best prices. ${dest.description}. ${dest.bestTime} is best time to visit. Professional drivers, clean cars, 24/7 service.`} />
        <meta name="keywords" content={`${dest.name} tour, ${dest.name} taxi, ${dest.name} darshan, ${dest.state} tourism, ${dest.temple || dest.attraction} tour`} />
        <link rel="canonical" href={`https://maasaraswatitravels.com/tour/${destination}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">{dest.name} Tour Package</h1>
          <p className="text-gray-600 mb-8">{dest.description}</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-orange-600">Book {dest.name} Taxi</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={`Pickup Location (${dest.state})`}
                    className="w-full p-3 border rounded-lg"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={`Drop: ${dest.name}`}
                    className="w-full p-3 border rounded-lg"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                  />
                  <select className="w-full p-3 border rounded-lg">
                    <option value="sedan">Sedan (4 seats) - ₹15/km</option>
                    <option value="suv">SUV (6 seats) - ₹20/km</option>
                    <option value="luxury">Luxury (4 seats) - ₹30/km</option>
                    <option value="tempo">Tempo Traveller (12 seats) - ₹25/km</option>
                  </select>
                  <button
                    onClick={handleSearch}
                    className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold hover:bg-orange-600"
                  >
                    Get Fare & Book
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Tour Information</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Best Time to Visit</p>
                    <p className="font-bold text-orange-600">{dest.bestTime}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Suggested Duration</p>
                    <p className="font-bold text-orange-600">{dest.duration}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">State</p>
                    <p className="font-bold text-orange-600">{dest.state}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Main Attraction</p>
                    <p className="font-bold text-orange-600">{dest.temple || dest.attraction}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">Package Includes:</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>✓ AC Car with Professional Driver</li>
                    <li>✓ All Toll and Parking Charges</li>
                    <li>✓ Driver Allowance Included</li>
                    <li>✓ 24/7 Customer Support</li>
                    <li>✓ Free Cancellation up to 1 hour</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="font-bold text-xl mb-3">Distance from Major Cities</h3>
                <ul className="space-y-2">
                  {Object.entries(dest.distance).map(([city, dist]) => (
                    <li key={city} className="flex justify-between border-b pb-2">
                      <span>From {city.charAt(0).toUpperCase() + city.slice(1)}</span>
                      <span className="font-semibold">{dist} km</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-xl mb-3">Nearby Attractions</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Main Temple/Sightseeing</li>
                  <li>✓ Local Markets</li>
                  <li>✓ Nearby Temples</li>
                  <li>✓ Scenic Viewpoints</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Need Help Planning Your {dest.name} Trip?</h3>
            <p className="mb-4">Call us for customized tour packages</p>
            <a href="tel:+919876543210" className="inline-block bg-white text-orange-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100">
              📞 Call Now
            </a>
          </div>
        </div>
      </div>
    </>
  );
}