// pages/api/driver/training.js
import { supabaseAdmin } from '../../../lib/supabase';

const TRAINING_VIDEOS = [
  { id: 1, title: 'Safety First: Defensive Driving', duration: '5:30', category: 'safety' },
  { id: 2, title: 'Customer Service Excellence', duration: '4:15', category: 'service' },
  { id: 3, title: 'How to Handle Emergency Situations', duration: '6:45', category: 'safety' },
  { id: 4, title: 'Vehicle Maintenance Tips', duration: '3:30', category: 'maintenance' },
  { id: 5, title: 'Using the Driver App Effectively', duration: '4:00', category: 'app' },
  { id: 6, title: 'Road Safety Rules', duration: '5:00', category: 'safety' },
  { id: 7, title: 'Handling Difficult Customers', duration: '4:30', category: 'service' },
  { id: 8, title: 'First Aid Basics', duration: '7:00', category: 'safety' },
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { driverId } = req.query;
    
    // Get completed trainings for driver
    const { data: completed } = await supabaseAdmin
      .from('driver_trainings')
      .select('video_id')
      .eq('driver_id', driverId)
      .eq('completed', true);

    const completedIds = new Set(completed?.map(c => c.video_id) || []);
    
    const videos = TRAINING_VIDEOS.map(video => ({
      ...video,
      completed: completedIds.has(video.id),
    }));

    const progress = (completedIds.size / TRAINING_VIDEOS.length) * 100;

    res.json({ videos, progress });
  }

  if (req.method === 'POST') {
    const { driverId, videoId, action } = req.body;
    
    if (action === 'complete') {
      await supabaseAdmin.from('driver_trainings').insert({
        driver_id: driverId,
        video_id: videoId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

      // Add loyalty points for completing training
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/loyalty/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driverId,
          points: 10,
          description: 'Completed training video',
        }),
      });
    }

    res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}