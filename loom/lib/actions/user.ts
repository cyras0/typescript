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