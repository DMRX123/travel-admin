// pages/api/metrics.js
import { supabaseAdmin } from '../../lib/supabase';
import { sendAlert } from '../../lib/monitoring';

// In-memory store (use Redis in production)
const metricsStore = {
  apiCalls: [],
  errors: [],
  performance: [],
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }

  try {
    // Store metric
    if (type === 'api') {
      metricsStore.apiCalls.push(data);
      
      // Check for anomalies
      const recentCalls = metricsStore.apiCalls.slice(-100);
      const errorRate = recentCalls.filter(c => c.status !== 200).length / recentCalls.length;
      
      if (errorRate > 0.1) { // 10% error rate
        await sendAlert(`⚠️ High error rate on API: ${errorRate * 100}%`, 'warning');
      }
      
    } else if (type === 'error') {
      metricsStore.errors.push(data);
      
      // Critical error alert
      if (data.message.includes('database') || data.message.includes('auth')) {
        await sendAlert(`🚨 Critical error: ${data.message}`, 'critical');
      }
      
    } else if (type === 'performance') {
      metricsStore.performance.push(data);
    }

    // Save to database (optional, for persistence)
    if (process.env.SAVE_METRICS === 'true') {
      await supabaseAdmin
        .from('metrics_logs')
        .insert({ type, data, created_at: new Date().toISOString() })
        .catch(err => console.error('Failed to save metric:', err));
    }

    // Clean old metrics (keep last 1000)
    if (metricsStore.apiCalls.length > 1000) {
      metricsStore.apiCalls = metricsStore.apiCalls.slice(-500);
    }
    if (metricsStore.errors.length > 500) {
      metricsStore.errors = metricsStore.errors.slice(-250);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Metrics API error:', error);
    res.status(500).json({ error: 'Failed to save metric' });
  }
}

// GET endpoint to retrieve metrics
export const getMetrics = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({
      apiCalls: metricsStore.apiCalls.slice(-100),
      errors: metricsStore.errors.slice(-50),
      performance: metricsStore.performance.slice(-100),
      summary: {
        totalApiCalls: metricsStore.apiCalls.length,
        totalErrors: metricsStore.errors.length,
        avgResponseTime: metricsStore.apiCalls.reduce((a, b) => a + b.duration, 0) / metricsStore.apiCalls.length || 0,
      },
    });
  }
};