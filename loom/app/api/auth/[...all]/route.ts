import aj, {
    ArcjetDecision,
    shield,
    slidingWindow,
    validateEmail,
} from "@/lib/arcjet";
import ip from "@arcjet/ip";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";

// Add CORS headers helper
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

const emailValidation = aj.withRule(
    validateEmail({mode: 'LIVE', block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS']}))

const rateLimit = aj.withRule(
    slidingWindow({mode: 'LIVE', interval: '2m', max: 100, characteristics: ['fingerprint']}))

const shieldValidation = aj.withRule(
    shield({
        mode: 'DRY_RUN',
    })
)

const protectedAuth = async (req: NextRequest, body: any): Promise<ArcjetDecision> => {
    const session = await auth.api.getSession({headers: req.headers})
    let userId: string;
    
    if(session?.user?.id) {
        userId = session.user.id;
    } else {
        userId = ip(req) || '127.0.0.1'
    }
    if(req.nextUrl.pathname.startsWith('/api/auth/sign-in')) {
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

const authHandlers = toNextJsHandler(auth.handler);

export const { GET } = authHandlers;

export async function POST(req: NextRequest) {
    console.log('=== auth POST START ===');
    try {
        // Handle Google auth first (more specific path)
        if (req.nextUrl.pathname === '/api/auth/sign-in/social') {
            console.log('Processing Google sign-in');
            const response = await authHandlers.POST(req);
            return response;
        }

        // Then handle email sign-in (more general path)
        if (req.nextUrl.pathname === '/api/auth/sign-in') {
            try {
                console.log('Processing email sign-in');
                const body = await req.json();
                if (body.email) {
                    console.log('Creating session for email:', body.email);
                    // Create session for email sign-in
                    const session = await createSession(body.email);
                    console.log('Session created:', session);
                    
                    // Return response with session
                    const cookieValue = JSON.stringify(session);
                    console.log('Setting cookie with value:', cookieValue);
                    
                    return NextResponse.json(session, {
                        headers: {
                            ...corsHeaders,
                            'Set-Cookie': `session=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
                        },
                    });
                }
            } catch (e) {
                console.error('Email sign-in error:', e);
                return NextResponse.json(
                    { error: 'Sign in failed' },
                    { 
                        status: 500,
                        headers: corsHeaders
                    }
                );
            }
        }

        // If we get here, the path wasn't recognized
        return NextResponse.json(
            { error: 'Invalid auth endpoint' },
            { 
                status: 404,
                headers: corsHeaders
            }
        );
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { 
                status: 500,
                headers: corsHeaders
            }
        );
    } finally {
        console.log('=== auth POST END ===');
    }
}
