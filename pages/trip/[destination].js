import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Complete destinations data with history and audio guide text
const destinationsData = {
  'ujjain-mahakaleshwar': {
    name: 'Ujjain Mahakaleshwar',
    state: 'Madhya Pradesh',
    temple: 'Mahakaleshwar Jyotirlinga',
    distance: { fromIndore: 55, fromBhopal: 190, fromDelhi: 800 },
    bestTime: 'October to March',
    duration: '2-3 days',
    description: 'One of the 12 Jyotirlingas, famous for Bhasma Aarti',
    history: `Mahakaleshwar Jyotirlinga is one of the most sacred Hindu temples dedicated to Lord Shiva. 
    It is located in the ancient city of Ujjain, Madhya Pradesh. The temple is situated on the banks of the holy river Kshipra.
    
    The temple complex is divided into five levels. The main idol of Mahakaleshwar is Dakshinamukhi, facing south, which is unique among the 12 Jyotirlingas.
    
    The Bhasma Aarti is the most famous ritual here, performed daily at 4 AM. The ashes from the cremation ground are used in this ritual, symbolizing the cycle of life and death.
    
    According to mythology, Lord Shiva appeared here to protect the city from demons. The temple has been mentioned in ancient texts like the Puranas and has been visited by saints like Adi Shankaracharya.`,
    audioText: `Welcome to Mahakaleshwar Temple in Ujjain. This is one of the 12 Jyotirlingas of Lord Shiva. 
    The temple is famous for its unique south-facing idol and the sacred Bhasma Aarti performed every morning at 4 AM. 
    The temple is located on the banks of the Kshipra River. Millions of devotees visit this holy place every year. 
    You can see the ancient architecture and experience the spiritual energy of this divine place.`,
    images: [
      '/images/ujjain-mahakal-1.jpg',
      '/images/ujjain-mahakal-2.jpg',
    ],
    aartiTimings: ['4:00 AM - Bhasma Aarti', '7:00 AM - Morning Aarti', '12:00 PM - Afternoon Aarti', '5:00 PM - Evening Aarti', '8:00 PM - Night Aarti'],
  },
  'omkareshwar': {
    name: 'Omkareshwar',
    state: 'Madhya Pradesh',
    temple: 'Omkareshwar Jyotirlinga',
    distance: { fromIndore: 77, fromBhopal: 235, fromUjjain: 133 },
    bestTime: 'October to March',
    duration: '1-2 days',
    description: 'Island-shaped Jyotirlinga on Narmada river',
    history: `Omkareshwar is a Hindu temple dedicated to Lord Shiva, located on an island called Mandhata in the Narmada river. 
    The shape of the island is said to be like the Hindu symbol "Om". 
    
    There are two main temples here: Omkareshwar (Lord of Om sound) and Amareshwar (Immortal Lord). 
    The temple is one of the 12 Jyotirlingas and holds great spiritual significance.`,
    audioText: `Welcome to Omkareshwar Temple. This sacred Jyotirlinga is situated on an island shaped like the sacred Om symbol. 
    The temple is on the banks of the Narmada river. The unique island shape and the powerful spiritual energy make this a must-visit pilgrimage site.`,
    images: ['/images/omkareshwar-1.jpg'],
    aartiTimings: ['5:00 AM - Morning Aarti', '12:00 PM - Afternoon Aarti', '7:00 PM - Evening Aarti'],
  },
  'khajuraho': {
    name: 'Khajuraho',
    state: 'Madhya Pradesh',
    attraction: 'Khajuraho Temples (UNESCO)',
    distance: { fromJhansi: 175, fromBhopal: 385 },
    bestTime: 'October to February',
    duration: '2-3 days',
    description: 'Famous for ancient Hindu and Jain temples',
    history: `The Khajuraho Group of Monuments is a UNESCO World Heritage Site. These temples were built by the Chandela dynasty between 950-1050 AD.
    
    Originally there were 85 temples, of which only 25 survive today. The temples are famous for their exquisite erotic sculptures and intricate architecture.
    
    The temples represent the pinnacle of North Indian temple architecture and showcase the cultural richness of medieval India.`,
    audioText: `Welcome to Khajuraho, a UNESCO World Heritage Site. These ancient temples were built between 950 and 1050 AD. 
    They are famous for their beautiful sculptures and intricate architecture. The temples showcase the artistic excellence of ancient India.`,
    images: ['/images/khajuraho-1.jpg'],
    aartiTimings: ['6:00 PM - Light & Sound Show'],
  },
  'bandhavgarh': {
    name: 'Bandhavgarh National Park',
    state: 'Madhya Pradesh',
    attraction: 'Tiger Safari',
    distance: { fromJabalpur: 165, fromKatni: 100 },
    bestTime: 'October to June',
    duration: '2-3 days',
    description: 'Highest tiger density in India',
    history: `Bandhavgarh National Park is famous for having the highest density of tigers in India. 
    The park derives its name from the ancient Bandhavgarh Fort located inside.
    
    The fort is believed to be 2000 years old and has references in the Ramayana. Lord Rama is said to have passed through this area.`,
    audioText: `Welcome to Bandhavgarh National Park. This is one of India's most famous tiger reserves. 
    You have the best chance to see wild tigers here. The park also has ancient caves and a historic fort to explore.`,
    images: ['/images/bandhavgarh-1.jpg'],
    safariTimings: ['Morning: 6:00-10:00 AM', 'Evening: 3:00-6:00 PM'],
  },
  'sanchi-stupa': {
    name: 'Sanchi Stupa',
    state: 'Madhya Pradesh',
    attraction: 'Buddhist Site',
    distance: { fromBhopal: 46, fromVidisha: 10 },
    bestTime: 'October to March',
    duration: '1 day',
    description: 'Ancient Buddhist monuments, UNESCO site',
    history: `The Great Stupa at Sanchi is one of the oldest stone structures in India, built by Emperor Ashoka in the 3rd century BCE.
    
    It is a UNESCO World Heritage Site and represents the finest example of Buddhist art and architecture. 
    The stupa contains the relics of Buddha and is a major pilgrimage site for Buddhists worldwide.`,
    audioText: `Welcome to Sanchi Stupa, a UNESCO World Heritage Site. This ancient Buddhist monument was built by Emperor Ashoka over 2000 years ago. 
    The beautiful gateways have intricate carvings depicting the life of Buddha.`,
    images: ['/images/sanchi-1.jpg'],
    timings: ['9:00 AM - 6:00 PM'],
  },
  'pachmarhi': {
    name: 'Pachmarhi',
    state: 'Madhya Pradesh',
    attraction: 'Hill Station',
    distance: { fromBhopal: 210, fromJabalpur: 190 },
    bestTime: 'October to June',
    duration: '2-3 days',
    description: 'Beautiful hill station with waterfalls',
    history: `Pachmarhi is the only hill station in Madhya Pradesh, situated at an altitude of 1067 meters. 
    It was discovered by Captain James Forsyth in 1857 and served as a summer retreat for the British.
    
    The region has ancient cave paintings dating back to the prehistoric era and is home to the Satpura Tiger Reserve.`,
    audioText: `Welcome to Pachmarhi, the Queen of Satpura. This beautiful hill station has stunning waterfalls, ancient caves, and lush green forests. 
    It's a perfect place to relax and enjoy nature.`,
    images: ['/images/pachmarhi-1.jpg'],
    attractions: ['Bee Falls', 'Pandav Caves', 'Dhoopgarh (Sunset Point)'],
  },
};

export default function TouristDestinationPage() {
  const router = useRouter();
  const { destination } = router.query;
  const dest = destinationsData[destination];
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [pickup, setPickup] = useState('');

  // Text to Speech Function
  const speakText = () => {
    if (!dest?.audioText) return;
    
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      if (currentUtterance) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(dest.audioText);
      utterance.lang = 'hi-IN'; // Hindi accent for better experience
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentUtterance(null);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentUtterance(null);
        toast.error('Audio playback failed');
      };
      
      setCurrentUtterance(utterance);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text to speech not supported in your browser');
    }
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUtterance) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentUtterance]);

  const handleBookTaxi = () => {
    if (pickup) {
      router.push(`/book?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(dest.name)}&vehicle=sedan`);
    } else {
      toast.error('Please enter pickup location');
    }
  };

  if (!dest || !destination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{dest.name} Tour | History & Complete Guide | Maa Saraswati Travels</title>
        <meta name="description" content={`${dest.history.substring(0, 160)} Best time to visit: ${dest.bestTime}. Book taxi, know temple timings, history, and complete travel guide.`} />
        <meta name="keywords" content={`${dest.name} tour, ${dest.name} history, ${dest.name} temple timings, ${dest.name} darshan, ${dest.state} tourism, ${dest.temple || dest.attraction} guide`} />
        <link rel="canonical" href={`https://maasaraswatitravels.com/tour/${destination}`} />
        
        {/* Open Graph for Social Media */}
        <meta property="og:title" content={`${dest.name} - Complete Travel Guide`} />
        <meta property="og:description" content={`${dest.description}. Best time: ${dest.bestTime}. Book your taxi now!`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://maasaraswatitravels.com/tour/${destination}`} />
        
        {/* JSON-LD Structured Data for Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TouristDestination",
              "name": dest.name,
              "description": dest.description,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": dest.name,
                "addressRegion": dest.state,
                "addressCountry": "IN"
              },
              "touristType": "Religious Site",
              "bestTime": dest.bestTime,
              "image": dest.images[0] || "https://maasaraswatitravels.com/default-image.jpg"
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-slate-900">
        <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">Maa Saraswati Travels</Link>
            <button onClick={() => router.back()} className="text-white">← Back</button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{dest.name}</h1>
            <p className="text-xl text-orange-400">{dest.state}</p>
          </motion.div>

          {/* Audio Guide Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl p-6 mb-8 border border-orange-500/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-2xl animate-pulse">
                  🔊
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Audio Guide</h3>
                  <p className="text-white/60 text-sm">Listen to the history and significance</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isPlaying ? (
                  <button
                    onClick={speakText}
                    className="bg-orange-500 text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-orange-600 transition"
                  >
                    <span>▶️</span> Play Audio Guide
                  </button>
                ) : (
                  <>
                    {!isPaused ? (
                      <button
                        onClick={pauseSpeech}
                        className="bg-yellow-500 text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-yellow-600 transition"
                      >
                        <span>⏸️</span> Pause
                      </button>
                    ) : (
                      <button
                        onClick={resumeSpeech}
                        className="bg-green-500 text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-green-600 transition"
                      >
                        <span>▶️</span> Resume
                      </button>
                    )}
                    <button
                      onClick={stopSpeech}
                      className="bg-red-500 text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-red-600 transition"
                    >
                      <span>⏹️</span> Stop
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* History Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📜</span> History & Significance
                </h2>
                <div className="text-white/80 leading-relaxed whitespace-pre-line">
                  {dest.history}
                </div>
              </motion.div>

              {/* Images Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🖼️</span> Photo Gallery
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {dest.images.map((img, idx) => (
                    <div key={idx} className="bg-slate-700 rounded-xl h-40 flex items-center justify-center text-white/50">
                      📸 Image {idx + 1}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="space-y-6">
              {/* Quick Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-xl font-bold text-white mb-4">Quick Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Best Time</span>
                    <span className="text-orange-400">{dest.bestTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Duration</span>
                    <span className="text-orange-400">{dest.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Main Attraction</span>
                    <span className="text-orange-400">{dest.temple || dest.attraction}</span>
                  </div>
                </div>
              </motion.div>

              {/* Aarti/Timings Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  {dest.aartiTimings ? '🕉️ Aarti Timings' : '⏰ Timings'}
                </h3>
                <div className="space-y-2">
                  {(dest.aartiTimings || dest.safariTimings || dest.timings || dest.attractions)?.map((item, idx) => (
                    <div key={idx} className="text-white/80 text-sm py-1 border-b border-white/10">
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Book Taxi Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-3">Book Taxi to {dest.name}</h3>
                <input
                  type="text"
                  placeholder="Your Pickup Location"
                  className="w-full px-4 py-2 rounded-lg mb-3 text-gray-900"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
                <button
                  onClick={handleBookTaxi}
                  className="w-full bg-white text-orange-600 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Book Now
                </button>
                <p className="text-white/80 text-xs text-center mt-3">
                  Professional drivers • Clean cars • Best price
                </p>
              </motion.div>
            </div>
          </div>

          {/* Distance from Major Cities */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-xl font-bold text-white mb-4">Distance from Major Cities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dest.distance).map(([city, dist]) => (
                <div key={city} className="text-center p-3 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-sm">{city.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-orange-400 font-bold">{dist} km</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}