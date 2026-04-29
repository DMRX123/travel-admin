// context/LanguageContext.js - PRODUCTION READY
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  // Navigation
  home: { en: 'Home', hi: 'होम' },
  bookRide: { en: 'Book Ride', hi: 'राइड बुक करें' },
  about: { en: 'About Us', hi: 'हमारे बारे में' },
  contact: { en: 'Contact', hi: 'संपर्क करें' },
  support: { en: 'Support', hi: 'सहायता' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  
  // Booking
  pickupLocation: { en: 'Pickup Location', hi: 'पिकअप स्थान' },
  dropLocation: { en: 'Drop Location', hi: 'ड्रॉप स्थान' },
  selectVehicle: { en: 'Select Vehicle', hi: 'वाहन चुनें' },
  calculateFare: { en: 'Calculate Fare', hi: 'किराया गणना करें' },
  bookNow: { en: 'Book Now', hi: 'अभी बुक करें' },
  findingDriver: { en: 'Finding Driver...', hi: 'ड्राइवर ढूंढ रहे हैं...' },
  
  // Vehicles
  bike: { en: 'Bike', hi: 'बाइक' },
  auto: { en: 'Auto', hi: 'ऑटो' },
  sedan: { en: 'Sedan', hi: 'सेडान' },
  suv: { en: 'SUV', hi: 'एसयूवी' },
  luxury: { en: 'Luxury', hi: 'लग्जरी' },
  tempo: { en: 'Tempo', hi: 'टेंपो' },
  
  // Ride Status
  lookingForDriver: { en: 'Looking for a driver near you...', hi: 'आपके पास ड्राइवर ढूंढ रहे हैं...' },
  driverAssigned: { en: 'Driver Assigned', hi: 'ड्राइवर असाइन किया गया' },
  driverArrived: { en: 'Driver Arrived', hi: 'ड्राइवर आ गया' },
  rideStarted: { en: 'Ride Started', hi: 'राइड शुरू हुई' },
  rideCompleted: { en: 'Ride Completed', hi: 'राइड पूरी हुई' },
  
  // Driver Dashboard
  goOnline: { en: 'Go Online', hi: 'ऑनलाइन जाएं' },
  goOffline: { en: 'Go Offline', hi: 'ऑफलाइन जाएं' },
  accept: { en: 'ACCEPT', hi: 'स्वीकार करें' },
  reject: { en: 'REJECT', hi: 'अस्वीकार करें' },
  todayEarnings: { en: "Today's Earnings", hi: 'आज की कमाई' },
  thisWeek: { en: 'This Week', hi: 'इस सप्ताह' },
  totalEarnings: { en: 'Total Earnings', hi: 'कुल कमाई' },
  
  // Common
  distance: { en: 'Distance', hi: 'दूरी' },
  fare: { en: 'Fare', hi: 'किराया' },
  eta: { en: 'ETA', hi: 'अनुमानित समय' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  confirm: { en: 'Confirm', hi: 'पुष्टि करें' },
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
  
  // Messages
  selectValidLocations: { en: 'Please select valid pickup and drop locations', hi: 'कृपया मान्य पिकअप और ड्रॉप स्थान चुनें' },
  calculatingFare: { en: 'Calculating fare...', hi: 'किराया गणना कर रहे हैं...' },
  bookingSuccess: { en: 'Booking confirmed! Finding drivers...', hi: 'बुकिंग पुष्टि हुई! ड्राइवर ढूंढ रहे हैं...' },
  noDriversAvailable: { en: 'No drivers available nearby. Please try again.', hi: 'पास में कोई ड्राइवर उपलब्ध नहीं है। कृपया पुनः प्रयास करें।' },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      setLanguage(savedLang);
    }
  }, []);

  const setLanguageWithStorage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
  };

  const t = (key) => {
    return translations[key]?.[language] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageWithStorage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};