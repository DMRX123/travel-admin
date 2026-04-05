// pages/api/surge-pricing.js
import { supabaseAdmin, protectAPI } from '../../lib/supabase';

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

      // Calculate dynamic surge based on time
      const hour = new Date().getHours();
      const isWeekend = [0, 6].includes(new Date().getDay());
      
      let dynamicMultiplier = data?.surge_multiplier || 1;
      
      if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
        dynamicMultiplier *= 1.5;
      } else if (hour >= 22 || hour <= 5) {
        dynamicMultiplier *= 1.3;
      }
      
      if (isWeekend) {
        dynamicMultiplier *= 1.2;
      }

      res.status(200).json({
        success: true,
        surgeMultiplier: dynamicMultiplier,
        baseMultiplier: data?.surge_multiplier || 1,
        activeUntil: data?.active_until || null,
        isPeakHour: (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20),
        isWeekend: isWeekend,
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

    if (!surgeMultiplier || surgeMultiplier < 1) {
      return res.status(400).json({ error: 'Invalid surge multiplier' });
    }

    try {
      const activeUntil = new Date(Date.now() + (durationMinutes || 60) * 60 * 1000).toISOString();

      const { error } = await supabaseAdmin
        .from('surge_pricing')
        .insert({
          city: city || 'default',
          vehicle_type: vehicleType || 'all',
          surge_multiplier: surgeMultiplier,
          active_until: activeUntil,
          created_at: new Date().toISOString(),
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