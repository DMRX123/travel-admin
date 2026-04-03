// lib/monitoring.js
import toast from 'react-hot-toast';

// Metrics store
const metrics = {
  pageLoads: {},
  apiCalls: {},
  errors: [],
  performance: {},
};

// Track page view
export const trackPageView = (pageName) => {
  if (!metrics.pageLoads[pageName]) {
    metrics.pageLoads[pageName] = 0;
  }
  metrics.pageLoads[pageName]++;

  // Log to analytics if configured
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
    });
  }
};

// Track API call
export const trackAPI = async (endpoint, duration, status) => {
  const metric = {
    endpoint,
    duration,
    status,
    timestamp: new Date().toISOString(),
  };

  if (!metrics.apiCalls[endpoint]) {
    metrics.apiCalls[endpoint] = [];
  }
  metrics.apiCalls[endpoint].push(metric);

  // Send to backend for persistence
  try {
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'api', data: metric }),
    });
  } catch (error) {
    console.error('Failed to send metric:', error);
  }

  // Alert if response time > 3 seconds
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
    message: error.message,
    stack: error.stack,
    context,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
  };

  metrics.errors.push(errorLog);

  // Send to backend
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog),
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }

  // Show toast for development
  if (process.env.NODE_ENV === 'development') {
    toast.error(`Error: ${error.message}`);
  }

  // Alert for critical errors
  if (error.message.includes('database') || error.message.includes('authentication')) {
    await sendAlert(`🚨 Critical Error: ${error.message}`, 'critical');
  }
};

// Track performance
export const trackPerformance = (name, duration) => {
  if (!metrics.performance[name]) {
    metrics.performance[name] = [];
  }
  metrics.performance[name].push(duration);

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name,
      value: Math.round(duration),
    });
  }
};

// Send alert to multiple channels
export const sendAlert = async (message, severity = 'warning') => {
  const colors = {
    info: '#3498db',
    warning: '#f39c12',
    critical: '#e74c3c',
  };

  // 1. Console log
  console.error(`[${severity.toUpperCase()}] ${message}`);

  // 2. Toast notification (for development)
  if (process.env.NODE_ENV === 'development') {
    toast.error(message);
  }

  // 3. Send to Slack webhook
  if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL, {
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

  // 4. Send SMS for critical alerts
  if (severity === 'critical' && process.env.NEXT_PUBLIC_ALERT_PHONE) {
    try {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: process.env.NEXT_PUBLIC_ALERT_PHONE,
          message: `CRITICAL: ${message.substring(0, 140)}`,
        }),
      });
    } catch (err) {
      console.error('Failed to send SMS alert:', err);
    }
  }
};

// Get metrics summary
export const getMetricsSummary = () => {
  const summary = {
    totalPageLoads: Object.values(metrics.pageLoads).reduce((a, b) => a + b, 0),
    totalErrors: metrics.errors.length,
    slowAPIs: [],
  };

  // Find slow APIs (avg > 2 seconds)
  Object.entries(metrics.apiCalls).forEach(([endpoint, calls]) => {
    const avgDuration = calls.reduce((a, b) => a + b.duration, 0) / calls.length;
    if (avgDuration > 2000) {
      summary.slowAPIs.push({ endpoint, avgDuration });
    }
  });

  return summary;
};

// Initialize monitoring
export const initMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Track initial page load
  trackPageView(document.title);

  // Monitor performance
  if (performance && performance.timing) {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackPerformance('page_load', loadTime);
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    trackError(event.error, { type: 'uncaught' });
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, { type: 'unhandled_rejection' });
  });
};

export default { trackPageView, trackAPI, trackError, trackPerformance, sendAlert, initMonitoring };