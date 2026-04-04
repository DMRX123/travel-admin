// lib/supabase-client.js - CLIENT SIDE ONLY
import { createClient } from '@supabase/supabase-js';

// Hardcoded values for production
const supabaseUrl = 'https://xeymfzwxjurwbezgwdef.supabase.co';
const supabaseAnonKey = 'sb_publishable_hugKMF1Hkj3WkC7GoAD3gA_vhCYVqbj';

// Create client immediately (works because values are hardcoded)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'maa-saraswati-auth-token',
  },
});

// Admin client (server-side only)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase;