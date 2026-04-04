// lib/monitoring.js - FINAL COMPLETE VERSION
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

  try {
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'api', data: metric }),
    });
  } catch (error) {
    console.error('Failed to send metric:', error);
  }

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

  const criticalKeywords = ['database', 'authentication', 'supabase', 'firebase', 'payment'];
  if (criticalKeywords.some(keyword => error.message?.toLowerCase().includes(keyword))) {
    await sendAlert(`🚨 Critical Error: ${error.message}`, 'critical');
  }
};

// Track performance
export const trackPerformance = (name, duration) => {
  if (!metrics.performance[name]) {
    metrics.performance[name] = [];
  }
  metrics.performance[name].push(duration);

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

  console.error(`[${severity.toUpperCase()}] ${message}`);

  if (process.env.NODE_ENV === 'development') {
    toast.error(message);
  }

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

  trackPageView(document.title || 'Maa Saraswati Travels');

  if (performance && performance.timing) {
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

export default { 
  trackPageView, 
  trackAPI, 
  trackError, 
  trackPerformance, 
  sendAlert, 
  initMonitoring,
  getMetricsSummary,
};