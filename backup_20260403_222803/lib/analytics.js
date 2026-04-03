// Google Analytics
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

// Pageview tracking
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Event tracking
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom events for booking
export const trackBooking = (bookingId, amount, vehicle) => {
  event({
    action: 'booking_completed',
    category: 'booking',
    label: `${vehicle} - ${bookingId}`,
    value: amount,
  });
};

export const trackSearch = (pickup, drop) => {
  event({
    action: 'search',
    category: 'search',
    label: `${pickup} → ${drop}`,
  });
};

export const trackLogin = (userType) => {
  event({
    action: 'login',
    category: 'auth',
    label: userType,
  });
};