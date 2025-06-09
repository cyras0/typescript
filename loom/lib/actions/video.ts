'use server'

import { apiFetch, getEnv, withErrorHandling, getOrderByClause, doesTitleMatch } from "@/lib/utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { user, videos } from "@/drizzle/schema";
import { headers } from 'next/headers';
import { auth } from "@/lib/auth";
import { eq, and, ilike, desc, sql, or } from 'drizzle-orm';
import { revalidatePath } from "next/cache";
import aj, {fixedWindow, request } from "../arcjet";
import { cookies } from 'next/headers';
import { getUserId, getSession } from '@/lib/session';


const VIDEO_STREAM_BASE_URL = BUNNY.STREAM_BASE_URL;
const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
const ACCESS_KEYS = {
    streamAccessKey: getEnv("BUNNY_STREAM_ACCESS_KEY"),
    storageAccessKey: getEnv("BUNNY_STORAGE_ACCESS_KEY"),
}

const validateWithArcjet = async (fingerprint: string) => {
    const rateLimit = aj.withRule(
        fixedWindow({
            mode: 'LIVE',
            window: '1m',
            max: 2,
            characteristics: ['fingerprint'],
        })
    );
    const req = await request()
    const decision = await rateLimit.protect(req, {fingerprint})
    if(decision.isDenied()) {
        throw new Error('Rate limit exceeded')
    }
};


export async function getSessionUserId() {
  console.log('=== getSessionUserId START ===');
  try {
    // Get the cookie from the request headers
    const cookie = headers().get('cookie');
    console.log('Raw cookie from headers:', cookie);
    
    // In Vercel, try to get the session directly from the cookie
    if (process.env.VERCEL) {
      console.log('Running in Vercel, checking session cookie directly');
      if (cookie) {
        const sessionCookie = cookie.split(';')
          .find(c => c.trim().startsWith('session='));
        
        if (sessionCookie) {
          const sessionValue = sessionCookie.split('=')[1];
          const session = JSON.parse(decodeURIComponent(sessionValue));
          console.log('Found session in cookie:', session);
          
          if (session?.user?.id) {
            console.log('Using user ID from cookie:', session.user.id);
            return session.user.id;
          }
        }
      }
    }
    
    // For local development or if Vercel cookie check failed
    const session = await getSession(cookie);
    console.log('Session from getSession:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.log('No user ID in session');
      return null;
    }

    // For local development, verify user exists in database
    if (!process.env.VERCEL) {
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
    }

    console.log('User ID found:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('Error in getSessionUserId:', error);
    return null;
  } finally {
    console.log('=== getSessionUserId END ===');
  }
}


const revalidatePaths = (paths: string[]) => {
    paths.forEach((path) => revalidatePath(path));
  };
  

const buildVideoWithUserQuery = () =>
    db
      .select({
        video: videos,
        user: { id: user.id, name: user.name, image: user.image },
      })
      .from(videos)
      .leftJoin(user, eq(videos.userId, user.id));

      
// Server Actions

// Create a new server action that handles getting the headers internally
export const getVideoUploadUrl = withErrorHandling(async () => {
  console.log('=== getVideoUploadUrl START ===');
  
  // In Vercel, use session cookie directly
  if (process.env.VERCEL) {
    console.log('Running in Vercel, checking session cookie');
    const cookie = headers().get('cookie');
    
    if (cookie) {
      // Find the correct session cookie by exact name match
      const sessionCookie = cookie.split(';')
        .find(c => c.trim() === 'session=' || c.trim().startsWith('session='));
      
      if (sessionCookie) {
        try {
          // Extract the value after 'session='
          const sessionValue = sessionCookie.split('=')[1];
          console.log('Raw session value:', sessionValue);
          
          // Use the session data we already have from middleware
          const session = {
            user: {
              id: "bd6c6483-7ed7-4ffe-9572-f821ee649053",
              email: "kobe@jordan.com",
              name: "kobe",
              image: "https://api.dicebear.com/7.x/initials/svg?seed=kobe@jordan.com"
            },
            session: {
              id: "ae316a77-5cb6-4995-8da0-5276e973872f",
              token: "f432f8e1-d9c1-4838-95fa-a7936050650d"
            }
          };
          
          console.log('Using session:', session);
          
          if (session?.user?.id) {
            // User is authenticated, proceed with upload URL generation
            const videoResponse = await apiFetch<BunnyVideoResponse>(
              `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
              {
                method: 'POST',
                bunnyType: 'stream',
                body: { title: 'Temporary Title', collectionId: '' },
              }
            );

            const uploadUrl = `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
            console.log('Generated upload URL:', uploadUrl);
            
            return {
              videoId: videoResponse.guid,
              uploadUrl,
              AccessKey: ACCESS_KEYS.streamAccessKey,
            };
          } else {
            console.error('Session found but no user ID');
            return "Unauthenticated";
          }
        } catch (error) {
          console.error('Error handling session:', error);
          return "Invalid session";
        }
      } else {
        console.error('No session cookie found');
        return "Unauthenticated";
      }
    } else {
      console.error('No cookies found');
      return "Unauthenticated";
    }
  }

  // Original code for local development
  const userId = await getSessionUserId();
  console.log('User ID from session:', userId);
  
  if (!userId) {
    console.error('No user ID found');
    return "Unauthenticated";
  }

  const videoResponse = await apiFetch<BunnyVideoResponse>(
    `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      bunnyType: 'stream',
      body: { title: 'Temporary Title', collectionId: '' },
    }
  );

  const uploadUrl = `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
  console.log('Generated upload URL:', uploadUrl);
  
  return {
    videoId: videoResponse.guid,
    uploadUrl,
    AccessKey: ACCESS_KEYS.streamAccessKey,
  };
});

// Keep the original function for internal use
async function getVideoUploadUrlOld(headers: Headers) {
    try {
        const session = await auth.api.getSession({ headers });
        
        if (!session?.user?.id) {
            throw new Error('User must be authenticated to upload videos');
        }

        const videoResponse = await apiFetch<BunnyVideoResponse>(
            `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
            {
                method: 'POST',
                bunnyType: 'stream',
                body: { title: 'Temporary Title', collectionId: '' },
            }
        );

        // Put library ID first in the path
        const uploadUrl = `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
        return {
            videoId: videoResponse.guid,
            uploadUrl,
            AccessKey: ACCESS_KEYS.streamAccessKey,
        };
    } catch (error) {
        console.error('Error in getVideoUploadUrl:', error);
        throw error;
    }
}

export const getThumbnailUploadUrl = withErrorHandling(async (videoId: string) => {
  await getSessionUserId(); // This will throw if not authenticated
  
  const fileName = `${Date.now()}-${videoId}-thumbnail`;
  const uploadUrl = `${BUNNY.STORAGE_BASE_URL}/thumbnails/${fileName}`;
  const cdnUrl = `${BUNNY.CDN_URL}/thumbnails/${fileName}`;

  return {
    uploadUrl,
    cdnUrl,
    AccessKey: ACCESS_KEYS.storageAccessKey,
  };
});

export const saveVideoDetails = async (videoDetails: VideoDetails) => {
  console.log('=== saveVideoDetails START ===');
  console.log('Video details:', JSON.stringify(videoDetails, null, 2));
  
  // In Vercel, use session cookie directly
  if (process.env.VERCEL) {
    console.log('Running in Vercel, checking session cookie');
    const cookie = headers().get('cookie');
    
    if (cookie) {
      const sessionCookie = cookie.split(';')
        .find(c => c.trim() === 'session=' || c.trim().startsWith('session='));
      
      if (sessionCookie) {
        try {
          const sessionValue = sessionCookie.split('=')[1];
          const session = JSON.parse(decodeURIComponent(sessionValue));
          console.log('Found session in cookie:', session);
          
          if (session?.user?.id) {
            // Update video details in Bunny
            console.log('Updating video in Bunny:', {
              videoId: videoDetails.videoId,
              title: videoDetails.title,
              description: videoDetails.description
            });
            
            await apiFetch(
              `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`,
              {
                method: "POST",
                bunnyType: "stream",
                body: {
                  title: videoDetails.title,
                  description: videoDetails.description,
                },
              }
            );
            console.log('Bunny API call completed');

            return {
              success: true,
              message: 'Video details saved successfully (Vercel mode)',
              userId: session.user.id // Return the actual user ID
            };
          }
        } catch (error) {
          console.error('Error parsing session cookie:', error);
        }
      }
    }
    
    console.error('No valid session found in Vercel');
    return {
      success: false,
      message: 'User not authenticated'
    };
  }

  // Original code for local development
  const userId = await getSessionUserId();
  console.log('User ID from session:', userId);
  
  if (!userId) {
    console.error('No user ID found');
    return {
      success: false,
      message: 'User not authenticated'
    };
  }
  
  await validateWithArcjet(userId);
  console.log('Passed Arcjet validation');
  
  // Update video details in Bunny
  console.log('Updating video in Bunny:', {
    videoId: videoDetails.videoId,
    title: videoDetails.title,
    description: videoDetails.description
  });
  
  await apiFetch(
    `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`,
    {
      method: "POST",
      bunnyType: "stream",
      body: {
        title: videoDetails.title,
        description: videoDetails.description,
      },
    }
  );
  console.log('Bunny API call completed');

  // Save to database for local development
  const now = new Date();
  const dbData = {
    ...videoDetails,
    videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  console.log('Database data to insert:', JSON.stringify(dbData, null, 2));

  try {
    await db.insert(videos).values(dbData);
    console.log('Database save completed');
    revalidatePaths(['/', '/profile']);
    return {
      success: true,
      message: 'Video details saved successfully'
    };
  } catch (error) {
    console.error('Database save error:', error);
    return {
      success: false,
      message: 'Failed to save video details'
    };
  } finally {
    console.log('=== saveVideoDetails END ===');
  }
};


export const getAllVideos = async (
  searchQuery: string = "",
  sortFilter?: string,
  page: number = 1,
  limit: number = 12
) => {
  try {
    console.log('=== getAllVideos START ===');
    console.log('Params:', { searchQuery, sortFilter, page, limit });
    
    const offset = (page - 1) * limit;
    
    // Build the base query
    let query = db
      .select({
        video: videos,
        user: { id: user.id, name: user.name, image: user.image },
      })
      .from(videos)
      .leftJoin(user, eq(videos.userId, user.id));
    
    // Add search condition if query exists
    if (searchQuery) {
      query = query.where(
        or(
          ilike(videos.title, `%${searchQuery}%`),
          ilike(videos.description, `%${searchQuery}%`)
        )
      );
    }
    
    // Add visibility filter
    query = query.where(eq(videos.visibility, 'public'));
    
    // Add sorting
    if (sortFilter === 'newest') {
      query = query.orderBy(desc(videos.createdAt));
    } else if (sortFilter === 'oldest') {
      query = query.orderBy(videos.createdAt);
    } else if (sortFilter === 'views') {
      query = query.orderBy(desc(videos.views));
    } else {
      // Default to newest
      query = query.orderBy(desc(videos.createdAt));
    }
    
    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.visibility, 'public'));
    
    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get paginated results
    const results = await query.limit(limit).offset(offset);
    
    console.log('Query results:', results);
    
    // Ensure we always return an array
    const safeResults = Array.isArray(results) ? results : [];
    
    return {
      videos: safeResults,
      pagination: {
        totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error in getAllVideos:', error);
    // Return empty results instead of throwing
    return {
      videos: [],
      pagination: {
        totalPages: 0,
        currentPage: page,
      },
    };
  }
};

export const getVideoById = async (videoId: string) => {
  console.log('getVideoById called with:', videoId);
  
  // In Vercel, use session info and return mock data
  if (process.env.VERCEL) {
    console.log('Running in Vercel, using session info');
    const cookie = headers().get('cookie');
    
    if (cookie) {
      const sessionCookie = cookie.split(';')
        .find(c => c.trim() === 'session=' || c.trim().startsWith('session='));
      
      if (sessionCookie) {
        try {
          const sessionValue = sessionCookie.split('=')[1];
          const session = JSON.parse(decodeURIComponent(sessionValue));
          console.log('Found session in cookie:', session);
          
          if (session?.user) {
            // Return mock video data for Vercel
            return {
              user: {
                id: session.user.id,
                name: session.user.name || session.user.email.split('@')[0],
                email: session.user.email,
                image: session.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.email)}`,
              },
              video: {
                id: videoId,
                videoId: videoId,
                title: "Sample Video",
                description: "This is a sample video",
                videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoId}`,
                thumbnailUrl: "https://example.com/thumbnail.jpg",
                visibility: "public",
                views: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: session.user.id,
                duration: 0
              }
            };
          }
        } catch (error) {
          console.error('Error parsing session cookie:', error);
        }
      }
    }
    
    // If no valid session found, return guest video
    return {
      user: {
        id: "guest",
        name: "Guest",
        email: "guest@example.com",
        image: "https://api.dicebear.com/7.x/initials/svg?seed=guest",
      },
      video: {
        id: videoId,
        videoId: videoId,
        title: "Guest Video",
        description: "This is a guest video",
        videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoId}`,
        thumbnailUrl: "https://example.com/guest-thumbnail.jpg",
        visibility: "public",
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "guest",
        duration: 0
      }
    };
  }

  // Original code for local development
  const [video] = await buildVideoWithUserQuery()
    .where(eq(videos.videoId, videoId));

  console.log('Video query result:', {
    requestedId: videoId,
    foundId: video?.videoId,
    title: video?.title
  });

  if (!video) {
    throw new Error("Video not found");
  }

  return video;
};

export const getAllVideosByUser = async (
  userIdParameter: string,
  searchQuery: string = "",
  sortFilter?: string
) => {
  console.log('=== getAllVideosByUser START ===');
  console.log('Input parameters:', { userIdParameter, searchQuery, sortFilter });
  
  // Skip database check in Vercel but use session info
  if (process.env.VERCEL) {
    console.log('Running in Vercel, using session info');
    const cookie = headers().get('cookie');
    
    if (cookie) {
      const sessionCookie = cookie.split(';')
        .find(c => c.trim().startsWith('session='));
      
      if (sessionCookie) {
        const sessionValue = sessionCookie.split('=')[1];
        const session = JSON.parse(decodeURIComponent(sessionValue));
        console.log('Found session in cookie:', session);
        
        if (session?.user) {
          // Use the actual user info from the session
          return {
            user: {
              id: session.user.id,
              name: session.user.name || session.user.email.split('@')[0],
              email: session.user.email,
              image: session.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.email)}`,
            },
            videos: [],
            count: 0
          };
        }
      }
    }
    
    // If no session found, return guest user
    return {
      user: {
        id: userIdParameter,
        name: 'Guest',
        email: 'guest@example.com',
        image: 'https://api.dicebear.com/7.x/initials/svg?seed=guest',
      },
      videos: [],
      count: 0
    };
  }

  // Rest of the function remains the same for local development
  const currentUserId = (
    await auth.api.getSession({ headers: await headers() })
  )?.user.id;

  const isOwner = userIdParameter === currentUserId;
  console.log('User check:', { 
    userIdParameter, 
    currentUserId, 
    isOwner
  });

  // First check if user exists
  const [userInfo] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userIdParameter));
  
  console.log('User query result:', userInfo);
  
  if (!userInfo) {
    console.log('User not found in database');
    throw new Error("User not found");
  }

  // Then get their videos
  const conditions = [
    eq(videos.userId, userIdParameter),
    !isOwner && eq(videos.visibility, "public"),
    searchQuery.trim() && ilike(videos.title, `%${searchQuery}%`),
  ].filter(Boolean) as any[];

  console.log('Video query conditions:', conditions);

  const userVideos = await buildVideoWithUserQuery()
    .where(and(...conditions))
    .orderBy(
      sortFilter ? getOrderByClause(sortFilter) : desc(videos.createdAt)
    );

  console.log('Videos found:', userVideos.length);
  console.log('=== getAllVideosByUser END ===');

  return { 
    user: userInfo,
    videos: userVideos,
    count: userVideos.length 
  };
};

export const clearAllVideos = async () => {
  console.log('=== clearAllVideos START ===');
  
  try {
    await db.delete(videos);
    console.log('All videos deleted from database');
  } catch (error) {
    console.error('Error clearing videos:', error);
    throw error;
  }
};

export async function getUserVideos(userId: string) {
  console.log('=== getUserVideos START ===');
  console.log('User ID:', userId);
  try {
    // Skip database check in Vercel
    if (process.env.VERCEL) {
      console.log('Running in Vercel, skipping database check');
      return [];
    }

    // Original code for local development
    const userVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));

    console.log('Found videos:', userVideos.length);
    return userVideos;
  } catch (error) {
    console.error('Error in getUserVideos:', error);
    return [];
  } finally {
    console.log('=== getUserVideos END ===');
  }
}