import { cookies } from 'next/headers';
import { db } from '@/drizzle/db';
import { user } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function getSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    if (!session?.user?.id) {
      return null;
    }

    // Verify user exists in database
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (existingUsers.length === 0) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
} 