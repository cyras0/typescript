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
    slidingWindow({mode: 'LIVE', interval: '2m', max: 2, characteristics: ['fingerprint']}))

const shieldValidation = aj.withRule(
    shield({
        mode: 'LIVE',
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

const authHandlers = toNextJsHandler(auth.handler);

export const POST = async (req: NextRequest) => {
    try {
        if (req.nextUrl.pathname === '/api/auth/sign-in/social') {
            console.log('Social sign-in request received');
            // Log the request body
            const body = await req.clone().json();
            console.log('Request body:', body);
            
            // Log the request headers
            console.log('Request headers:', Object.fromEntries(req.headers.entries()));
            
            const response = await authHandlers.POST(req);
            console.log('Auth handler response:', {
                status: response?.status,
                statusText: response?.statusText,
                headers: Object.fromEntries(response?.headers || []),
                body: await response?.text().catch(() => 'Could not read body')
            });
            return response;
        }

        // For other auth routes
        const response = await authHandlers.POST(req);
        if (!response) {
            return NextResponse.json(
                { error: 'Empty response from auth handler' },
                { status: 500, headers: corsHeaders }
            );
        }

        try {
            const data = await response.json();
            return NextResponse.json(data, { headers: corsHeaders });
        } catch (error) {
            console.error('Error parsing response:', error);
            return NextResponse.json(
                { error: 'Invalid response format' },
                { status: 500, headers: corsHeaders }
            );
        }
    } catch (error) {
        console.error('Error in auth POST handler:', error);
        // Log the full error stack
        console.error('Full error stack:', error.stack);
        return NextResponse.json(
            { error: 'Authentication failed', details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}

export const GET = async (req: NextRequest) => {
    try {
        const response = await authHandlers.GET(req);
        if (!response) {
            return NextResponse.json(
                { error: 'Empty response from auth handler' },
                { status: 500, headers: corsHeaders }
            );
        }

        try {
            const data = await response.json();
            return NextResponse.json(data, { headers: corsHeaders });
        } catch (error) {
            console.error('Error parsing response:', error);
            return NextResponse.json(
                { error: 'Invalid response format' },
                { status: 500, headers: corsHeaders }
            );
        }
    } catch (error) {
        console.error('Error in auth GET handler:', error);
        return NextResponse.json(
            { error: 'Authentication failed', details: error.message },
            { status: 500, headers: corsHeaders }
        );
    }
} 