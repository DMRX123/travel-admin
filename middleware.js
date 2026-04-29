// middleware.js - COMPLETE WITH RATE LIMITING & SECURITY
import { NextResponse } from 'next/server';
import { rateLimiter } from './lib/rate-limit';

// Protected routes
const protectedRoutes = [
  '/dashboard', '/dashboard/:path*',
  '/users', '/users/:path*',
  '/drivers', '/drivers/:path*',
  '/rides', '/rides/:path*',
  '/reports', '/reports/:path*',
  '/settings', '/settings/:path*',
];

const driverRoutes = [
  '/driver/dashboard', '/driver/earnings', '/driver/history',
  '/driver/profile', '/driver/vehicle',
];

const authRoutes = ['/login', '/driver/login', '/driver/register'];
const adminRoutes = ['/dashboard', '/users', '/drivers', '/rides', '/reports', '/settings'];

// Rate limit configuration
const rateLimitConfig = {
  '/api/': { limit: 100, windowMs: 60000 },
  '/api/book': { limit: 5, windowMs: 60000 },
  '/api/send-otp': { limit: 3, windowMs: 300000 },
  '/api/verify-otp': { limit: 5, windowMs: 300000 },
  '/api/ride-request': { limit: 10, windowMs: 60000 },
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // ========== RATE LIMITING ==========
  const matchedLimit = Object.entries(rateLimitConfig).find(([path]) => pathname.startsWith(path));
  if (matchedLimit) {
    const [_, config] = matchedLimit;
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    const result = rateLimiter.check(identifier, config);
    
    if (!result.success) {
      return new NextResponse(JSON.stringify({ 
        error: result.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        }
      });
    }
  }
  
  // ========== AUTHENTICATION ==========
  // Get session from cookie (faster than Supabase call)
  const sessionToken = request.cookies.get('sb-access-token')?.value;
  const isLoggedIn = !!sessionToken;
  
  // Redirect logged-in users away from auth pages
  if (authRoutes.some(route => pathname === route) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Protect admin routes
  if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route.replace(':path*', '')))) {
    if (!isLoggedIn) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // Protect driver routes
  if (driverRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const url = new URL('/driver/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // ========== SECURITY HEADERS ==========
  const response = NextResponse.next();
  
  // Basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  );
  
  // Content Security Policy (production only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://maps.googleapis.com https://www.gstatic.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://*.supabase.co https://*.firebaseio.com https://maps.googleapis.com https://api.msg91.com https://checkout.razorpay.com; " +
      "frame-src https://checkout.razorpay.com;"
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/drivers/:path*',
    '/rides/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/driver/:path*',
    '/login',
    '/driver/login',
    '/driver/register',
    '/api/:path*',
  ],
};