import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}

function isRateLimited(key: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return false
  }

  if (record.count >= limit) {
    return true
  }

  record.count++
  return false
}

export function middleware(request: NextRequest) {
  // Debug logging to see what routes are being processed
  console.log('🔍 Middleware processing:', request.nextUrl.pathname);
  
  // Allow the request to go to the next middleware or page
  const response = NextResponse.next();

  // Add security headers to the response
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Rate limiting for API routes (but NOT for NextAuth routes)
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    console.log('🚦 Applying rate limiting to:', request.nextUrl.pathname);
    const key = getRateLimitKey(request);
    
    if (isRateLimited(key)) {
      console.log('❌ Rate limit exceeded for:', request.nextUrl.pathname);
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      });
    }
  }

  // Continue to the next middleware or the page/API route with the new headers
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 