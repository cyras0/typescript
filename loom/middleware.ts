import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.url)
  console.log('All cookies:', request.cookies.getAll())
  
  // First try better-auth session
  const betterAuthSession = await auth.api.getSession({
    headers: await headers(),
  });
  console.log('Better-auth session:', betterAuthSession)
  
  // If better-auth session exists, use it
  if (betterAuthSession?.user?.id) {
    console.log('Using better-auth session')
    return NextResponse.next();
  }

  // If no better-auth session, try our custom session
  const cookieHeader = request.headers.get('cookie')
  console.log('Cookie header:', cookieHeader)
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    console.log('Parsed cookies:', cookies)
    const sessionCookie = cookies['session']
    console.log('Session cookie:', sessionCookie)
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie))
        console.log('Parsed session:', session)
        if (session?.user?.id) {
          console.log('Using custom session')
          return NextResponse.next();
        }
      } catch (e) {
        console.error('Error parsing session cookie:', e)
      }
    }
  }

  console.log('No valid session found, redirecting to sign-in')
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sign-in|assets).*)"],
};

// ⨯ [TypeError: Body is unusable: Body has already been read]
