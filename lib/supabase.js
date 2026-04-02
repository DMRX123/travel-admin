import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side supabase (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'maa-saraswati-auth-token',
  },
});

// Server-side supabase (bypass RLS - USE ONLY IN API ROUTES)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Helper to protect API routes
export const protectAPI = async (req, res, requireAdmin = true) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return null;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return null;
  }
  
  if (requireAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (profile?.user_type !== 'admin') {
      res.status(403).json({ error: 'Forbidden - Admin access required' });
      return null;
    }
  }
  
  return user;
};

// Helper to check if user is driver
export const isDriver = async (userId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single();
  return profile?.user_type === 'driver';
};

// Helper to get current user session
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// ==================== VEHICLE FUNCTIONS ====================

// Get all available vehicle types
export const getAvailableVehicles = async () => {
  try {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    // Return default vehicles if table doesn't exist
    return [
      { type: 'auto', name: 'Auto Rickshaw', icon: '🛺', base_fare: 30, per_km_rate: 12, seating_capacity: 3, description: 'Best for short distances' },
      { type: 'bike', name: 'Bike', icon: '🏍️', base_fare: 20, per_km_rate: 8, seating_capacity: 2, description: 'Quick and economical' },
      { type: 'electric_bike', name: 'Electric Bike', icon: '⚡🏍️', base_fare: 25, per_km_rate: 10, seating_capacity: 2, description: 'Eco-friendly' },
      { type: 'hatchback', name: 'Hatchback', icon: '🚗', base_fare: 50, per_km_rate: 15, seating_capacity: 4, description: 'Swift, Baleno, i20' },
      { type: 'sedan', name: 'Sedan', icon: '🚘', base_fare: 60, per_km_rate: 18, seating_capacity: 4, description: 'Honda City, Ciaz' },
      { type: 'suv', name: 'SUV', icon: '🚙', base_fare: 80, per_km_rate: 22, seating_capacity: 6, description: 'Creta, Seltos' },
      { type: 'luxury', name: 'Luxury Car', icon: '🚘✨', base_fare: 120, per_km_rate: 35, seating_capacity: 4, description: 'Mercedes, BMW' },
      { type: 'tempo', name: 'Tempo Traveller', icon: '🚐', base_fare: 150, per_km_rate: 25, seating_capacity: 12, description: 'Group tours' },
      { type: 'minibus', name: 'Mini Bus', icon: '🚌', base_fare: 200, per_km_rate: 30, seating_capacity: 20, description: 'Large groups' },
      { type: 'electric_car', name: 'Electric Car', icon: '⚡🚗', base_fare: 70, per_km_rate: 20, seating_capacity: 4, description: 'Eco-friendly' },
    ];
  }
};

// Calculate fare based on vehicle type and distance
export const calculateFare = (vehicle, distance) => {
  return vehicle.base_fare + (distance * vehicle.per_km_rate);
};

// Find nearby drivers by vehicle type
export const findNearbyDriversByType = async (lat, lng, vehicleType, radiusKm = 0.8) => {
  try {
    const { data, error } = await supabase.rpc('find_nearby_drivers_by_type', {
      lat,
      lng,
      vehicle_type: vehicleType,
      radius_km: radiusKm,
    });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
};