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
import { user } from '@/drizzle/schema';
import { v4 as uuidv4 } from 'uuid';


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
      const { email, name, image } = await req.json();
  
      // Create a new user
      const userId = uuidv4();
      const now = new Date();
  
      await db.insert(user).values({
        id: userId,
        name,
        email,
        image,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      });
  
      // Create a session
      const session = {
        id: uuidv4(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
  
      return NextResponse.json({
        user: {
          id: userId,
          name,
          email,
          image,
        },
        session,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  }