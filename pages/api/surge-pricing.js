// pages/api/surge-pricing.js - NEW FILE
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { city, vehicleType } = req.query;

    try {
      const { data, error } = await supabaseAdmin
        .from('surge_pricing')
        .select('*')
        .eq('city', city || 'default')
        .eq('vehicle_type', vehicleType || 'all')
        .gt('active_until', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      res.status(200).json({
        success: true,
        surgeMultiplier: data?.surge_multiplier || 1,
        activeUntil: data?.active_until || null
      });
    } catch (error) {
      console.error('Surge pricing error:', error);
      res.status(500).json({ error: 'Failed to get surge pricing' });
    }
  } 
  else if (req.method === 'POST') {
    const user = await protectAPI(req, res, true);
    if (!user) return;

    const { city, vehicleType, surgeMultiplier, durationMinutes } = req.body;

    try {
      const activeUntil = new Date(Date.now() + (durationMinutes || 60) * 60 * 1000).toISOString();

      const { error } = await supabaseAdmin
        .from('surge_pricing')
        .insert({
          city: city || 'default',
          vehicle_type: vehicleType || 'all',
          surge_multiplier: surgeMultiplier,
          active_until: activeUntil,
        });

      if (error) throw error;

      res.status(200).json({ success: true, message: 'Surge pricing activated' });
    } catch (error) {
      console.error('Set surge pricing error:', error);
      res.status(500).json({ error: 'Failed to set surge pricing' });
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}