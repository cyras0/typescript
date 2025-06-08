'use server'

import { apiFetch, getEnv, withErrorHandling, getOrderByClause, doesTitleMatch } from "@/lib/utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { user, videos } from "@/drizzle/schema";
import { headers } from 'next/headers';
import { auth } from "@/lib/auth";
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { revalidatePath } from "next/cache";
import aj, {fixedWindow, request } from "../arcjet";
import { cookies } from 'next/headers';


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


const getSessionUserId = async (): Promise<string> => {
  try {
    // First try to get real session
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) return session.user.id;
  } catch (error) {
    console.log('Real session not found, checking for mock session');
  }

  // If no real session, check for mock session
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
  if (sessionCookie) {
    const mockSession = JSON.parse(sessionCookie.value);
    if (mockSession?.user?.id) {
      return mockSession.user.id;
    }
  }
  
  throw new Error("Unauthenticated");
};


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
  await getSessionUserId(); // This will throw if not authenticated
  
  const videoResponse = await apiFetch<BunnyVideoResponse>(
    `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      bunnyType: 'stream',
      body: { title: 'Temporary Title', collectionId: '' },
    }
  );

  const uploadUrl = `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
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
  console.log('Video details:', videoDetails);
  
  const userId = await getSessionUserId();
  console.log('User ID:', userId);
  
  await validateWithArcjet(userId);
  console.log('Passed Arcjet validation');
  
  // Update video details in Bunny
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

  // Save to database
  const now = new Date();
  const dbData = {
    ...videoDetails,
    videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  console.log('Database data:', dbData);

  await db.insert(videos).values(dbData);
  console.log('Database save successful');
  console.log('=== saveVideoDetails END ===');

  revalidatePaths(["/"]);
  return { videoId: videoDetails.videoId };
};


export const getAllVideos = async (
  searchQuery: string = "",
  sortFilter?: string,
  page: number = 1,
  limit: number = 12
) => {
  console.log('=== getAllVideos START ===');
  
  const currentUserId = (
    await auth.api.getSession({ headers: await headers() })
  )?.user.id;

  // Get all public videos
  const conditions = [
    eq(videos.visibility, "public"),
    searchQuery.trim() && ilike(videos.title, `%${searchQuery}%`),
  ].filter(Boolean) as any[];

  // Get videos from database
  const allVideos = await buildVideoWithUserQuery()
    .where(and(...conditions))
    .orderBy(
      sortFilter ? getOrderByClause(sortFilter) : desc(videos.createdAt)
    );

  // Filter out videos that don't exist in Bunny
  const validVideos = [];
  for (const { video, user } of allVideos) {
    try {
      // Check if video exists in Bunny
      await apiFetch(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${video.videoId}`,
        {
          method: "GET",
          bunnyType: "stream",
        }
      );
      validVideos.push({ video, user });
    } catch (error) {
      console.log(`Video ${video.videoId} not found in Bunny, removing from database`);
      // Remove video from database if it doesn't exist in Bunny
      await db.delete(videos).where(eq(videos.videoId, video.videoId));
    }
  }

  console.log('Videos found:', {
    total: validVideos.length,
    currentPage: page,
    perPage: limit
  });

  // Apply pagination
  const paginatedVideos = validVideos.slice((page - 1) * limit, page * limit);

  return {
    videos: paginatedVideos,
    pagination: {
      total: validVideos.length,
      currentPage: page,
      totalPages: Math.ceil(validVideos.length / limit),
      perPage: limit
    }
  };
};

export const getVideoById = async (videoId: string) => {
  console.log('getVideoById called with:', videoId);
  
  const [video] = await buildVideoWithUserQuery()
    .where(eq(videos.videoId, videoId));  // Make sure we're querying by videoId, not id

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
    user: userInfo, // Now userInfo is defined
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