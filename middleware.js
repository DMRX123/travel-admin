import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// ============================================
// HARDCODE SUPABASE VALUES FOR MIDDLEWARE
// ============================================
const SUPABASE_URL = 'https://xeymfzwxjurwbezgwdef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hugKMF1Hkj3WkC7GoAD3gA_vhCYVqbj';

// Rate limiting configuration (in-memory store for demo, use Redis in production)
const rateLimitStore = new Map();

const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

// Security Headers - FIXED for Google Fonts
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://maps.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.supabase.co https://maps.googleapis.com https://checkout.razorpay.com https://*.firebaseio.com;
    frame-src https://checkout.razorpay.com;
  `.replace(/\s+/g, ' ').trim(),
};

// Rate limiting function
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
    });
    return { success: true };
  }
  
  if (now > record.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs,
    });
    return { success: true };
  }
  
  if (record.count >= rateLimitConfig.max) {
    return { success: false, message: 'Too many requests from this IP' };
  }
  
  record.count++;
  rateLimitStore.set(ip, record);
  return { success: true };
}

export async function middleware(req) {
  const res = NextResponse.next();

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && req.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${req.headers.get('host')}${req.nextUrl.pathname}`,
      { status: 301 }
    );
  }

  // Use hardcoded values instead of process.env
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options || {});
          });
        },
      },
    }
  );

  // Wrap in try-catch to prevent middleware from crashing
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (error) {
    console.error('Middleware auth error:', error);
    // Continue without session - will redirect to login
  }

  const publicPaths = ['/', '/login', '/book', '/about', '/contact', '/terms', '/privacy', '/tour', '/route'];
  const isPublicPath = publicPaths.some(
    (path) =>
      req.nextUrl.pathname === path ||
      req.nextUrl.pathname.startsWith('/tour/') ||
      req.nextUrl.pathname.startsWith('/route/')
  );

  const isAdminPath =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/users') ||
    req.nextUrl.pathname.startsWith('/drivers') ||
    req.nextUrl.pathname.startsWith('/rides') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/settings');

  const isDriverPath = req.nextUrl.pathname.startsWith('/driver');

  // Rate limiting for API routes
  const isApiPath = req.nextUrl.pathname.startsWith('/api/');
  if (isApiPath && !isPublicPath) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.success) {
      return new NextResponse(rateLimitResult.message, { status: 429 });
    }
  }

  // ✅ Allow access if public path
  if (isPublicPath) {
    return res;
  }

  // ✅ If accessing admin/driver path without session, redirect to login
  if ((isAdminPath || isDriverPath) && !session) {
    if (isAdminPath) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (isDriverPath) {
      return NextResponse.redirect(new URL('/driver/login', req.url));
    }
  }

  // ✅ If logged in and trying to access login page, redirect to dashboard
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ✅ For admin paths, verify admin user type
  if (isAdminPath && session) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'admin') {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch (error) {
      console.error('Admin verification error:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ✅ For driver paths, verify driver user type
  if (isDriverPath && session) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.user_type !== 'driver') {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/driver/login', req.url));
      }
    } catch (error) {
      console.error('Driver verification error:', error);
      return NextResponse.redirect(new URL('/driver/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/users/:path*',
    '/drivers/:path*',
    '/rides/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/login',
    '/book',
    '/driver/:path*',
    '/tour/:path*',
    '/route/:path*',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
  ],
};