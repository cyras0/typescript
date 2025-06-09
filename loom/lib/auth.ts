import { createAuthClient } from 'better-auth/react';
import { authClient } from './auth-client';

// Create auth instance with proper configuration
export const auth = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  // Use a simple in-memory adapter for Vercel
  adapter: process.env.VERCEL ? {
    type: 'memory',
    // Add any necessary memory adapter options here
  } : {
    type: 'database',
    // Your existing database configuration
    db: {
      type: 'postgres',
      // ... rest of your database config
    }
  },
  // Rest of your auth configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ... rest of your config
});

// Export the auth client
export { authClient };
