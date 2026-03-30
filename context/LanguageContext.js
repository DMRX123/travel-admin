import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  home: { en: 'Home', hi: 'होम' },
  bookRide: { en: 'Book Ride', hi: 'राइड बुक करें' },
  pickupLocation: { en: 'Pickup Location', hi: 'पिकअप स्थान' },
  dropLocation: { en: 'Drop Location', hi: 'ड्रॉप स्थान' },
  calculateFare: { en: 'Calculate Fare', hi: 'किराया गणना करें' },
  bookNow: { en: 'Book Now', hi: 'अभी बुक करें' },
  totalFare: { en: 'Total Fare', hi: 'कुल किराया' },
  callNow: { en: 'Call Now', hi: 'अभी कॉल करें' },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      setLanguage(savedLang);
    }
  }, []);

  const setLanguageWithStorage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    return translations[key]?.[language] || key;
  };

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