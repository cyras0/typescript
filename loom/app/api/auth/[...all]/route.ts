import aj, {
    ArcjetDecision,
    shield,
    slidingWindow,
    validateEmail,
  } from "@/lib/arcjet";
import ip from "@arcjet/ip";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";
import { createSession } from "@/lib/session";

const emailValidation = aj.withRule(
    validateEmail({mode: 'LIVE', block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS']}))

const rateLimit = aj.withRule(
    slidingWindow({mode: 'LIVE', interval: '2m', max: 100, characteristics: ['fingerprint']}))

const shieldValidation = aj.withRule(
    shield({
        mode: 'DRY_RUN',
    })
)

const protectedAuth = async (req: NextRequest): Promise<ArcjetDecision> => {
    const session = await auth.api.getSession({headers: req.headers})
    let userId: string;
    
    if(session?.user?.id) {
       userId = session.user.id;

    } else {
        userId = ip(req) || '127.0.0.1'
    }
    if(req.nextUrl.pathname.startsWith('/api/auth/sign-in')) {
        const body = await req.clone().json(); 
        if(typeof body.email == 'string') {
            return emailValidation.protect(req, {
                email: body.email,
            });
        }
    }
    if (!req.nextUrl.pathname.startsWith("/api/auth/sign-out")) {
        return rateLimit.protect(req, {
          fingerprint: userId,
        });
      }
      return shieldValidation.protect(req);
}

const authHandlers  = toNextJsHandler(auth.handler);

export const POST = async (req: NextRequest) => {
    console.log('Auth route called:', req.nextUrl.pathname)
    const decision = await protectedAuth(req)
    if(decision.isDenied()) {
        if(decision.reason.isEmail()) {
            throw new Error('Email validation failed')
        }
        if(decision.reason.isRateLimit()) {
            throw new Error('Rate limit exceeded')
        }
        if(decision.reason.isShield()) {
            throw new Error('Shield validation failed')
        }
    }

    // Handle email sign-in
    if (req.nextUrl.pathname === '/api/auth/sign-in') {
        try {
            console.log('Processing email sign-in')
            const body = await req.clone().json();
            if (body.email) {
                console.log('Creating session for email:', body.email)
                // Create session for email sign-in
                const session = await createSession(body.email);
                console.log('Session created:', session)
                
                // Return response with session
                const cookieValue = JSON.stringify(session);
                console.log('Setting cookie with value:', cookieValue)
                
                const response = new Response(JSON.stringify(session), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Set-Cookie': `session=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
                    },
                });
                
                // Log all response headers
                console.log('All response headers:', {
                    'content-type': response.headers.get('content-type'),
                    'set-cookie': response.headers.get('set-cookie'),
                })
                
                return response;
            }
        } catch (e) {
            console.error('Email sign-in error:', e);
            return new Response(JSON.stringify({ error: 'Sign in failed' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // Handle Google auth
    console.log('Falling back to Google auth handler')
    return authHandlers.POST(req)
}

export const {GET} = authHandlers; 