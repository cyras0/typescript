import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.url)
  
  // Get all cookies
  const cookies = request.cookies.getAll();
  console.log('All cookies:', cookies);
  
  // Get the session cookie
  const sessionCookie = request.cookies.get('session');
  console.log('Session cookie:', sessionCookie?.value);
  
  if (!sessionCookie?.value) {
    console.log('No session cookie found, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  try {
    // Parse the session cookie
    const session = JSON.parse(sessionCookie.value);
    console.log('Parsed session:', session);
    
    // Skip database check in Vercel
    if (process.env.VERCEL) {
      console.log('Running in Vercel, skipping database check');
      if (!session?.user?.id) {
        console.log('No valid session found, redirecting to sign-in');
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      return NextResponse.next();
    }

    // For local development, verify user exists
    if (!session?.user?.id) {
      console.log('No valid session found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Session is valid, allow the request
    return NextResponse.next();
  } catch (e) {
    console.error('Error parsing session cookie:', e);
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sign-in (sign in page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)',
  ],
};

// ⨯ [TypeError: Body is unusable: Body has already been read]
