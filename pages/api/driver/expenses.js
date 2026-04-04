// pages/api/driver/expenses.js
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { driverId, startDate, endDate } = req.query;
    
    let query = supabaseAdmin
      .from('driver_expenses')
      .select('*')
      .eq('driver_id', driverId);
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data: expenses } = await query.order('date', { ascending: false });
    
    const summary = {
      fuel: 0,
      maintenance: 0,
      other: 0,
      total: 0,
    };
    
    expenses?.forEach(exp => {
      summary[exp.category] = (summary[exp.category] || 0) + exp.amount;
      summary.total += exp.amount;
    });
    
    res.json({ expenses, summary });
  }

  if (req.method === 'POST') {
    const { driverId, category, amount, description, date } = req.body;
    
    const { data: expense } = await supabaseAdmin.from('driver_expenses').insert({
      driver_id: driverId,
      category,
      amount,
      description,
      date: date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    }).select().single();
    
    res.json({ success: true, expense });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}