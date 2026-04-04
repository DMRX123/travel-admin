// pages/api/group-booking.js
import { supabaseAdmin } from '../../lib/supabase';

const GROUP_DISCOUNTS = {
  2: 5,   // 5% off for 2 people
  3: 10,  // 10% off for 3 people
  4: 15,  // 15% off for 4 people
  5: 20,  // 20% off for 5+ people
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, members, pickup, drop, vehicleType, scheduledFor } = req.body;
  
  const groupSize = members.length + 1;
  const discountPercent = GROUP_DISCOUNTS[Math.min(groupSize, 5)] || 20;
  
  // Calculate fare with discount
  const baseFare = 50;
  const perKmRate = 15;
  const distance = 10; // Calculate actual distance
  const totalFare = baseFare + (distance * perKmRate);
  const discountedFare = totalFare * (1 - discountPercent / 100);
  
  // Create group booking
  const { data: groupBooking } = await supabaseAdmin.from('group_bookings').insert({
    created_by: userId,
    members: members,
    pickup_address: pickup,
    drop_address: drop,
    vehicle_type: vehicleType,
    scheduled_for: scheduledFor,
    total_fare: totalFare,
    discounted_fare: discountedFare,
    discount_percent: discountPercent,
    status: 'pending',
    created_at: new Date().toISOString(),
  }).select().single();
  
  // Send invitations to members
  for (const member of members) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: member.id,
        title: '🚗 Group Ride Invitation',
        body: `${members[0].name} invited you to join a group ride`,
        data: { groupId: groupBooking.id, type: 'group_invite' },
      }),
    });
  }
  
  res.json({
    success: true,
    groupId: groupBooking.id,
    originalFare: totalFare,
    discountedFare: discountedFare,
    discountPercent: discountPercent,
  });
}