// lib/rate-limit.js - RATE LIMITING FOR API PROTECTION

class RateLimiter {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now - data.resetTime > data.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if request is allowed
   * @param {string} identifier - IP, user ID, or API key
   * @param {Object} options - { limit, windowMs }
   * @returns {Object} - { success, remaining, resetTime, message }
   */
  check(identifier, options = {}) {
    const limit = options.limit || 10;
    const windowMs = options.windowMs || 60000; // 1 minute default
    
    const now = Date.now();
    let record = this.store.get(identifier);
    
    if (!record) {
      record = {
        count: 1,
        resetTime: now + windowMs,
        windowMs
      };
      this.store.set(identifier, record);
      return { success: true, remaining: limit - 1, resetTime: record.resetTime };
    }
    
    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      this.store.set(identifier, record);
      return { success: true, remaining: limit - 1, resetTime: record.resetTime };
    }
    
    // Increment count
    record.count++;
    this.store.set(identifier, record);
    
    if (record.count > limit) {
      return { 
        success: false, 
        remaining: 0, 
        resetTime: record.resetTime,
        message: `Too many requests. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`
      };
    }
    
    return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
  }

  // Specialized rate limiters
  otp(identifier) {
    return this.check(identifier, { limit: 3, windowMs: 300000 }); // 3 per 5 minutes
  }
  
  booking(identifier) {
    return this.check(identifier, { limit: 5, windowMs: 60000 }); // 5 per minute
  }
  
  login(identifier) {
    return this.check(identifier, { limit: 5, windowMs: 300000 }); // 5 per 5 minutes
  }
  
  api(identifier) {
    return this.check(identifier, { limit: 100, windowMs: 60000 }); // 100 per minute
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Middleware wrapper for API routes
export function withRateLimit(handler, options = {}) {
  return async (req, res) => {
    const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userIdentifier = req.headers.authorization || identifier;
    
    const result = rateLimiter.check(userIdentifier, options);
    
    if (!result.success) {
      res.setHeader('X-RateLimit-Limit', options.limit || 10);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
      
      return res.status(429).json({ 
        error: result.message,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    res.setHeader('X-RateLimit-Limit', options.limit || 10);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    
    return handler(req, res);
  };
}

export default rateLimiter;