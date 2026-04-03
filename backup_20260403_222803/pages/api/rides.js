import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          user:user_id (full_name, email, phone),
          driver:driver_id (full_name, email, phone, vehicle_number)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { data, error } = await supabase
        .from('rides')
        .insert(req.body)
        .select();
      
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      res.status(200).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}