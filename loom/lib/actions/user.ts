'use server'

import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function getCurrentUser() {
  try {
    // First try Google auth
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      const [userData] = await db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);
      if (userData) {
        console.log('Found user from Google auth:', userData);
        return userData;
      }
    }

    // If no Google auth, try email bypass
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie?.value) {
      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
      if (sessionData?.user?.id) {
        const [userData] = await db
          .select()
          .from(user)
          .where(eq(user.id, sessionData.user.id))
          .limit(1);
        if (userData) {
          console.log('Found user from email bypass:', userData);
          return userData;
        }
      }
    }

    return null;
  } catch (e) {
    console.error('Error getting user session:', e);
    return null;
  }
}

export async function getUserById(id: string) {
  console.log('=== getUserById START ===');
  console.log('User ID:', id);
  try {
    // Skip database check in Vercel
    if (process.env.VERCEL) {
      console.log('Running in Vercel, skipping database check');
      return {
        id,
        name: 'User',
        email: 'user@example.com',
        image: 'https://api.dicebear.com/7.x/initials/svg?seed=user',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Original code for local development
    const [user] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!user) {
      console.log('User not found');
      return null;
    }

    console.log('User found:', user);
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  } finally {
    console.log('=== getUserById END ===');
  }
}