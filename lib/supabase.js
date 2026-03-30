import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton pattern for client-side and server-side safety
let supabaseInstance = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'maa-saraswati-auth-token',
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

// Helper to check if user is admin (server-side)
export const isAdmin = async (userId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single();
  return profile?.user_type === 'admin';
};

// Helper to protect API routes
export const protectAPI = async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - No token provided' });
    return false;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
    return false;
  }
  
  const isAdminUser = await isAdmin(user.id);
  if (!isAdminUser) {
    res.status(403).json({ error: 'Forbidden - Admin access required' });
    return false;
  }
  
  return user;
};