const translations = {
  // Navigation
  home: { en: 'Home', hi: 'होम' },
  bookRide: { en: 'Book Ride', hi: 'राइड बुक करें' },
  about: { en: 'About', hi: 'हमारे बारे में' },
  contact: { en: 'Contact', hi: 'संपर्क करें' },
  
  // Booking Form
  pickupLocation: { en: 'Pickup Location', hi: 'पिकअप स्थान' },
  dropLocation: { en: 'Drop Location', hi: 'ड्रॉप स्थान' },
  selectVehicle: { en: 'Select Vehicle', hi: 'वाहन चुनें' },
  calculateFare: { en: 'Calculate Fare', hi: 'किराया गणना करें' },
  bookNow: { en: 'Book Now', hi: 'अभी बुक करें' },
  
  // Vehicle Types
  auto: { en: 'Auto Rickshaw', hi: 'ऑटो रिक्शा' },
  sedan: { en: 'Sedan', hi: 'सेडान' },
  suv: { en: 'SUV', hi: 'एसयूवी' },
  luxury: { en: 'Luxury', hi: 'लग्ज़री' },
  tempo: { en: 'Tempo Traveller', hi: 'टेंपो ट्रैवलर' },
  
  // Common
  totalFare: { en: 'Total Fare', hi: 'कुल किराया' },
  distance: { en: 'Distance', hi: 'दूरी' },
  time: { en: 'Time', hi: 'समय' },
  callNow: { en: 'Call Now', hi: 'अभी कॉल करें' },
  downloadApp: { en: 'Download App', hi: 'ऐप डाउनलोड करें' },
  
  // Footer
  quickLinks: { en: 'Quick Links', hi: 'त्वरित लिंक' },
  contactInfo: { en: 'Contact Info', hi: 'संपर्क जानकारी' },
  termsConditions: { en: 'Terms & Conditions', hi: 'नियम और शर्तें' },
  privacyPolicy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
};

export const getTranslation = (key, lang = 'en') => {
  return translations[key]?.[lang] || key;
};

export const useTranslation = (lang = 'en') => {
  return (key) => getTranslation(key, lang);
};