// lib/session.ts
import { db } from "@/drizzle/db";
import { schema } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

const { user, session } = schema;

export async function getSession(cookie: string | undefined) {
  if (!cookie) return null;

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

export async function getUserId(cookie: string | undefined) {
  const session = await getSession(cookie);
  return session?.user?.id || null;
}

export async function createSession(email: string) {
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

    return {
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
  } catch (e) {
    console.error('Error creating session:', e);
    throw new Error('Failed to create session');
  }
}