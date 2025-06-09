// lib/session.ts
import { db } from "@/drizzle/db";
import { schema } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';
import { auth } from "@/lib/auth";

const { user, session } = schema;

export async function getSession(cookie: string | undefined) {
  console.log('=== getSession START ===');
  
  // First try better-auth session (Google)
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    console.log('Better-auth session:', session);
    
    if (session?.user?.id) {
      console.log('Found better-auth session, user ID:', session.user.id);
      return session;
    }
  } catch (error) {
    console.log('No better-auth session found');
  }

  // Only if no better-auth session exists, try email bypass
  if (cookie) {
    try {
      const session = JSON.parse(cookie);
      if (!session?.user?.id) return null;

      // Verify user exists in database
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      if (!existingUser) return null;

      return session;
    } catch (e) {
      console.error('Error parsing session:', e);
      return null;
    }
  }

  return null;
}

export async function getUserId(cookie: string | undefined) {
  console.log('=== getUserId START ===');
  try {
    const session = await getSession(cookie);
    const userId = session?.user?.id || null;
    console.log('User ID found:', userId);
    return userId;
  } catch (error) {
    console.error('Error in getUserId:', error);
    return null;
  } finally {
    console.log('=== getUserId END ===');
  }
}

export async function createSession(email: string) {
  console.log('=== createSession START ===');
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    let userId: string;
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('Found existing user:', userId);
    } else {
      // Create new user
      userId = uuidv4();
      await db.insert(user).values({
        id: userId,
        email: email,
        name: email.split('@')[0],
        emailVerified: false,
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Created new user:', userId);
    }

    // Create session
    const sessionId = uuidv4();
    const sessionToken = uuidv4();
    
    await db.insert(session).values({
      id: sessionId,
      userId: userId,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Created session:', sessionId);

    const sessionData = {
      user: {
        id: userId,
        email: email,
        name: email.split('@')[0],
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
      },
      session: {
        id: sessionId,
        token: sessionToken,
      }
    };
    console.log('Session data:', sessionData);
    return sessionData;
  } catch (e) {
    console.error('Error creating session:', e);
    throw new Error('Failed to create session');
  } finally {
    console.log('=== createSession END ===');
  }
}
