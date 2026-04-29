// lib/monitoring.js - PRODUCTION READY
import toast from 'react-hot-toast';

let isInitialized = false;

// Metrics store
const metrics = {
  pageLoads: {},
  apiCalls: [],
  errors: [],
  performance: {},
};

// Track page view
export const trackPageView = (pageName) => {
  if (typeof window === 'undefined') return;
  
  if (!metrics.pageLoads[pageName]) {
    metrics.pageLoads[pageName] = 0;
  }
  metrics.pageLoads[pageName]++;

  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
    });
  }
};

// Track API call
export const trackAPI = async (endpoint, duration, status) => {
  const metric = { endpoint, duration, status, timestamp: new Date().toISOString() };
  metrics.apiCalls.push(metric);

  // Keep only last 500
  if (metrics.apiCalls.length > 500) metrics.apiCalls = metrics.apiCalls.slice(-500);

  if (duration > 3000) {
    console.warn(`Slow API: ${endpoint} took ${duration}ms`);
    if (process.env.NODE_ENV === 'production') {
      await sendAlert(`⚠️ Slow API Response: ${endpoint} took ${duration}ms`, 'warning');
    }
  }
};

// Track error
export const trackError = async (error, context = {}) => {
  const errorLog = {
    message: error.message || String(error),
    stack: error.stack,
    context,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
  };

  metrics.errors.push(errorLog);
  if (metrics.errors.length > 250) metrics.errors = metrics.errors.slice(-250);

  // Send to server
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog),
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }

  if (process.env.NODE_ENV === 'development') {
    toast.error(`Error: ${error.message}`);
  }

  // Critical error alert
  const criticalKeywords = ['database', 'authentication', 'supabase', 'payment'];
  if (criticalKeywords.some(keyword => error.message?.toLowerCase().includes(keyword))) {
    await sendAlert(`🚨 Critical Error: ${error.message}`, 'critical');
  }
};

// Track performance
export const trackPerformance = (name, duration) => {
  if (!metrics.performance[name]) metrics.performance[name] = [];
  metrics.performance[name].push(duration);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', { name, value: Math.round(duration) });
  }
};

// Send alert to Slack
export const sendAlert = async (message, severity = 'warning') => {
  const colors = { info: '#3498db', warning: '#f39c12', critical: '#e74c3c' };

  console.error(`[${severity.toUpperCase()}] ${message}`);

  if (process.env.NODE_ENV === 'development') {
    toast.error(message);
    return;
  }

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: colors[severity],
            title: `${severity.toUpperCase()} Alert`,
            text: message,
            fields: [
              { title: 'Environment', value: process.env.NODE_ENV, short: true },
              { title: 'Time', value: new Date().toISOString(), short: true },
            ],
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      });
    } catch (err) {
      console.error('Failed to send Slack alert:', err);
    }
  }
};

// Initialize monitoring
export const initMonitoring = () => {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  trackPageView(document.title || 'Maa Saraswati Travels');

  if (performance?.timing) {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime > 0 && loadTime < 60000) {
      trackPerformance('page_load', loadTime);
    }
  }

  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), { type: 'uncaught' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, { type: 'unhandled_rejection' });
  });
};

export default { trackPageView, trackAPI, trackError, trackPerformance, sendAlert, initMonitoring, getMetricsSummary: () => ({ totalErrors: metrics.errors.length, totalApiCalls: metrics.apiCalls.length }) };