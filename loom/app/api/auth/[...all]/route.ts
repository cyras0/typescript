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
import { db } from '@/drizzle/db';
import { user, session as sessionTable } from '@/drizzle/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';


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

export const { GET } = authHandlers;

export async function POST(req: NextRequest) {
    try {
        // Try the normal auth flow first
        const response = await authHandlers.POST(req);
        return response;
    } catch (error) {
        // If it fails, check if it's an email sign-in request
        const body = await req.clone().json();
        if (body.email) {
            try {
                // First check if user already exists
                const existingUsers = await db
                    .select()
                    .from(user)
                    .where(eq(user.email, body.email))
                    .limit(1);

                let finalUserId;
                if (existingUsers.length > 0) {
                    finalUserId = existingUsers[0].id;
                } else {
                    // Create new user
                    finalUserId = uuidv4();
                    const now = new Date();
                    await db.insert(user).values({
                        id: finalUserId,
                        name: body.email.split('@')[0],
                        email: body.email,
                        image: `https://www.gravatar.com/avatar/${body.email}?d=mp&f=y`,
                        emailVerified: true,
                        createdAt: now,
                        updatedAt: now,
                    });
                }

                // Create a session
                const sessionId = uuidv4();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const now = new Date();
                const token = uuidv4();
                
                await db.insert(sessionTable).values({
                    id: sessionId,
                    userId: finalUserId,
                    expiresAt: expiresAt,
                    token: token,
                    createdAt: now,
                    updatedAt: now,
                });

                // Get the user details
                const [userDetails] = await db
                    .select()
                    .from(user)
                    .where(eq(user.id, finalUserId))
                    .limit(1);

                // Create a simpler session format
                const session = {
                    id: sessionId,
                    userId: finalUserId,
                    expiresAt: expiresAt.toISOString(),
                    token: token
                };

                // Set the session cookie with a simpler format
                const sessionCookie = `session=${JSON.stringify(session)}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
                
                return NextResponse.json({ 
                    user: userDetails,
                    session: session
                }, { 
                    headers: {
                        ...corsHeaders,
                        'Set-Cookie': sessionCookie
                    }
                });
            } catch (error) {
                console.error('Error in email sign-in:', error);
                return NextResponse.json(
                    { error: 'Failed to create user' },
                    { status: 500 }
                );
            }
        }
        
        // If it's not an email sign-in, return the original error
        throw error;
    }
}