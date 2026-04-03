// pages/api/booking/[id].js
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Booking ID required' });
  }

  try {
    const { data: ride, error } = await supabase
      .from('rides')
      .select(`
        *,
        user:user_id (id, full_name, email, phone),
        driver:driver_id (id, full_name, email, phone, vehicle_number, vehicle_type)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!ride) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({
      id: ride.id,
      pickup: ride.pickup_address,
      drop: ride.drop_address,
      vehicle: ride.vehicle_type,
      distance: ride.distance,
      fare: ride.fare,
      paymentMethod: ride.payment_method,
      status: ride.status,
      createdAt: ride.created_at,
      driver: ride.driver ? {
        name: ride.driver.full_name,
        phone: ride.driver.phone,
        vehicleNumber: ride.driver.vehicle_number
      } : null,
      user: ride.user
    });
  } catch (error) {
    console.error('Booking fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}