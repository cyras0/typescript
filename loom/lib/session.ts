import { cookies } from 'next/headers';
import { db } from '@/drizzle/db';
import { user } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function getSession() {
  console.log('=== getSession START ===');
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    console.log('Session cookie:', sessionCookie);
    
    if (!sessionCookie?.value) {
      console.log('No session cookie found');
      return null;
    }

    const session = JSON.parse(sessionCookie.value);
    console.log('Parsed session:', session);
    
    // Check if we have a valid session structure
    if (!session || typeof session !== 'object') {
      console.log('Invalid session structure');
      return null;
    }

    // Check if we have a user object
    if (!session.user || typeof session.user !== 'object') {
      console.log('No user object in session');
      return null;
    }

    // Check if we have a user ID
    if (!session.user.id || typeof session.user.id !== 'string') {
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

    if (!existingUsers || existingUsers.length === 0) {
      console.log('User not found in database');
      return null;
    }

    console.log('Valid session found');
    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  } finally {
    console.log('=== getSession END ===');
  }
}

export async function getUserId(): Promise<string | null> {
  console.log('=== getUserId START ===');
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      console.log('No user ID found in session');
      return null;
    }
    console.log('User ID found:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('Error in getUserId:', error);
    return null;
  } finally {
    console.log('=== getUserId END ===');
  }
} 