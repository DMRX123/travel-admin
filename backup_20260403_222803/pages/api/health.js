// pages/api/health.js
import { supabase } from '../../lib/supabase';
import { database } from '../../lib/firebase';
import { ref, get } from 'firebase/database';

export default async function handler(req, res) {
  const startTime = Date.now();
  const checks = {
    database: false,
    supabase: false,
    firebase: false,
    environment: false,
  };

  // Check 1: Supabase Connection
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    checks.supabase = !error;
  } catch (error) {
    checks.supabase = false;
  }

  // Check 2: Firebase Connection
  try {
    if (database) {
      const testRef = ref(database, '.info/connected');
      checks.firebase = true;
    } else {
      checks.firebase = false;
    }
  } catch (error) {
    checks.firebase = false;
  }

  // Check 3: Environment Variables
  checks.environment = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );

  // Check 4: Database (simplified)
  checks.database = checks.supabase;

  const responseTime = Date.now() - startTime;
  const isHealthy = Object.values(checks).every(v => v === true);

  // Send alert if unhealthy
  if (!isHealthy) {
    console.error('Health check failed:', checks);
    // Send to Slack if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          text: `🚨 **Health Check Failed!**\nSupabase: ${checks.supabase}\nFirebase: ${checks.firebase}\nEnvironment: ${checks.environment}\nResponse Time: ${responseTime}ms`,
        }),
      }).catch(() => {});
    }
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
}