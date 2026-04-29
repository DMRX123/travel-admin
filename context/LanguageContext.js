// context/LanguageContext.js - SIMPLIFIED WORKING VERSION
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  home: { en: 'Home', hi: 'होम' },
  bookRide: { en: 'Book Ride', hi: 'राइड बुक करें' },
  about: { en: 'About Us', hi: 'हमारे बारे में' },
  contact: { en: 'Contact', hi: 'संपर्क करें' },
  selectValidLocations: { en: 'Please select valid locations', hi: 'कृपया सही स्थान चुनें' },
  fare: { en: 'Fare', hi: 'किराया' },
  distance: { en: 'Distance', hi: 'दूरी' },
  calculate: { en: 'Calculate', hi: 'गणना करें' },
  book: { en: 'Book Now', hi: 'अभी बुक करें' },
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
    document.documentElement.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
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
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};