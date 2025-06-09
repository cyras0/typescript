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
  console.log('Cookie received:', cookie);
  
  // First try better-auth session (Google)
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    console.log('Better-auth session:', JSON.stringify(session, null, 2));
    
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
      // Extract the session cookie value
      const sessionCookie = cookie.split(';')
        .find(c => c.trim().startsWith('session='));
      
      console.log('Found session cookie:', sessionCookie);
      
      if (!sessionCookie) {
        console.log('No session cookie found');
        return null;
      }

      const sessionValue = sessionCookie.split('=')[1];
      console.log('Session value:', sessionValue);
      
      const session = JSON.parse(decodeURIComponent(sessionValue));
      console.log('Parsed session:', JSON.stringify(session, null, 2));
      
      if (!session?.user?.id) {
        console.log('No user ID in session');
        return null;
      }

      // Verify user exists in database
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      console.log('Database user lookup result:', existingUser);

      if (!existingUser) {
        console.log('User not found in database');
        return null;
      }

      console.log('Found email session, user ID:', session.user.id);
      return session;
    } catch (e) {
      console.error('Error parsing session:', e);
      return null;
    }
  }

  console.log('No session found');
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
    let userId: string;
    
    // Skip user existence check in Vercel
    if (process.env.VERCEL) {
      console.log('Running in Vercel, skipping user existence check');
      userId = uuidv4();
    } else {
      // Check if user exists
      console.log('Checking for existing user...');
      console.log('Database connection:', !!db);
      console.log('User table:', !!user);
      
      const query = db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);
      
      console.log('Query built:', query);
      const [existingUser] = await query;
      console.log('Existing user check result:', existingUser);

      if (existingUser) {
        userId = existingUser.id;
        console.log('Found existing user:', userId);
      } else {
        userId = uuidv4();
      }
    }

    console.log('Creating new user...');
    // Create new user
    const newUser = {
      id: userId,
      email: email,
      name: email.split('@')[0],
      emailVerified: false,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('New user data:', newUser);
    try {
      await db.insert(user).values(newUser);
      console.log('Created new user:', userId);
    } catch (e) {
      console.error('Error creating new user:', e);
      throw new Error('Failed to create new user');
    }

    console.log('Creating session...');
    // Create session
    const sessionId = uuidv4();
    const sessionToken = uuidv4();
    
    const sessionData = {
      user: {
        id: userId,
        email: email,
        name: email.split('@')[0],
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
      },
      session: {
        id: sessionId,
        token: sessionToken,
      }
    };

    // Ensure the session data is properly stringified
    const sessionString = JSON.stringify(sessionData);
    console.log('Session string:', sessionString);

    return sessionData;
  } catch (e) {
    console.error('Error in createSession:', e);
    if (e instanceof Error) {
      console.error('Error stack:', e.stack);
    }
    throw new Error('Failed to create session');
  } finally {
    console.log('=== createSession END ===');
  }
}
