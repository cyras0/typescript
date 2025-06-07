'use server'

import { apiFetch, getEnv, withErrorHandling } from "@/lib/utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { videos } from "@/drizzle/schema";
import { headers } from 'next/headers';
import { auth } from "@/lib/auth";
import { eq } from 'drizzle-orm';

const VIDEO_STREAM_BASE_URL = `${BUNNY.STREAM_BASE_URL}/videos`;
const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
const ACCESS_KEYS = {
    streamAccessKey: getEnv("BUNNY_STREAM_ACCESS_KEY"),
    storageAccessKey: getEnv("BUNNY_STORAGE_ACCESS_KEY"),
}

const validateWithArcjet = async (fingerprint: string) => {
    const rateLimit = aj.withRules({
        fixedWindow: {
            mode: 'LIVE',
            window: '1m',
            max: 2,
            charactristcs: ['fingerprint'],
        },
    })
    const req = await request()
    const decision = await rateLimit.protect(req, {fingerprint})
    if(decision.isDenied) {
        throw new Error('Rate limit exceeded')
    }

}

const getSessionUserId = async (): Promise<string> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");
  return session.user.id;
};

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

export const saveVideoDetailsToDb = withErrorHandling(async (videoDetails: VideoDetails) => {
  const userId = await getSessionUserId();
  
  // First, check if user exists
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId)
  });

  // If user doesn't exist, create them
  if (!existingUser) {
    await db.insert(user).values({
      id: userId,
      name: session.user.name || 'Anonymous',
      email: session.user.email || `${userId}@placeholder.com`,
      emailVerified: false,
      image: session.user.image,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Now insert the video
  await db.insert(videos).values({
    title: videoDetails.title,
    description: videoDetails.description,
    videoId: videoDetails.videoId,
    thumbnailUrl: videoDetails.thumbnailUrl,
    visibility: videoDetails.visibility as "public" | "private",
    videoUrl: `${BUNNY.EMBED_URL}//${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

