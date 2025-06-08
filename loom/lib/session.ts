import { cookies } from 'next/headers';
import { db } from '@/drizzle/db';
import { user } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function getSession() {
  console.log('=== getSession START ===');
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
  
  console.log('Session cookie:', sessionCookie);
  
  if (!sessionCookie?.value) {
    console.log('No session cookie found');
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    console.log('Parsed session:', session);
    
    if (!session?.user?.id) {
      console.log('No user ID in session');
      return null;
    }

    // Verify user exists in database
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    console.log('Existing users:', existingUsers);

    if (existingUsers.length === 0) {
      console.log('User not found in database');
      return null;
    }

    console.log('Valid session found');
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  } finally {
    console.log('=== getSession END ===');
  }
}

export async function getUserId(): Promise<string | null> {
  console.log('=== getUserId START ===');
  const session = await getSession();
  const userId = session?.user?.id || null;
  console.log('User ID:', userId);
  console.log('=== getUserId END ===');
  return userId;
} 