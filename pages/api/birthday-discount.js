// pages/api/birthday-discount.js
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('dob, full_name')
    .eq('id', userId)
    .single();
  
  if (!profile?.dob) {
    return res.json({ hasBirthday: false });
  }
  
  const today = new Date();
  const birthday = new Date(profile.dob);
  const isBirthday = today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
  
  if (isBirthday) {
    // Check if birthday promo already used
    const { data: used } = await supabaseAdmin
      .from('promo_codes')
      .select('id')
      .eq('code', `BDAY${today.getFullYear()}${userId.substring(0, 4)}`)
      .single();
    
    if (!used) {
      const promoCode = `BDAY${today.getFullYear()}${userId.substring(0, 4)}`;
      await supabaseAdmin.from('promo_codes').insert({
        code: promoCode,
        discount_type: 'percentage',
        discount_value: 20,
        min_order_amount: 200,
        usage_limit: 1,
        valid_until: new Date(today.setDate(today.getDate() + 7)).toISOString(),
        description: `Birthday discount for ${profile.full_name}`,
        is_active: true,
      });
      
      return res.json({ hasBirthday: true, promoCode: promoCode, discount: 20 });
    }
  }
  
  res.json({ hasBirthday: false });
}