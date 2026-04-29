// lib/cache.js - PERFORMANCE CACHING LAYER
// Simple in-memory cache (Redis optional)

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 300; // 5 minutes
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Pattern delete (e.g., "surge:*")
  deletePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Higher-order function for cached data fetching
export async function getCached(key, fetcher, ttl = 300) {
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

// Invalidate cache by pattern
export function invalidateCache(pattern) {
  cache.deletePattern(pattern);
}

// Preload common data
export async function preloadCache() {
  // Preload vehicle types
  const { supabase } = await import('./supabase');
  const { data: vehicles } = await supabase.from('vehicle_types').select('*').eq('is_active', true);
  cache.set('vehicle_types', vehicles, 3600);
  
  // Preload system settings
  const { data: settings } = await supabase.from('system_settings').select('*').single();
  cache.set('system_settings', settings, 3600);
}

export default cache;