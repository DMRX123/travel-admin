// jest.setup.js - COMPLETE VERSION
import '@testing-library/jest-dom';

// ============================================
// MOCK ENVIRONMENT VARIABLES FOR TESTS
// ============================================
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-google-key';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test-razorpay-key';

// ============================================
// MOCK NEXT/ROUTER
// ============================================
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// ============================================
// MOCK NEXT/LINK
// ============================================
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// ============================================
// MOCK FRAMER-MOTION
// ============================================
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// ============================================
// MOCK REACT-HOT-TOAST
// ============================================
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  toast: jest.fn(),
}));

// ============================================
// MOCK FETCH
// ============================================
global.fetch = jest.fn();

// ============================================
// MOCK LOCALSTORAGE
// ============================================
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// ============================================
// MOCK NAVIGATOR.GEOLOCATION
// ============================================
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
};

// ============================================
// MOCK INTERSECTION OBSERVER
// ============================================
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// ============================================
// MOCK WINDOW.GTAG (Google Analytics)
// ============================================
global.window = Object.create(window);
global.window.gtag = jest.fn();