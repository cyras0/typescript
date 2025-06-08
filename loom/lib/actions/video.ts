'use server'

import { apiFetch, getEnv, withErrorHandling, getOrderByClause, doesTitleMatch } from "@/lib/utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { user, videos } from "@/drizzle/schema";
import { headers } from 'next/headers';
import { auth } from "@/lib/auth";
import { eq, and, ilike, desc } from 'drizzle-orm';
import { revalidatePath } from "next/cache";
import aj, {fixedWindow, request } from "../arcjet";


const VIDEO_STREAM_BASE_URL = `${BUNNY.STREAM_BASE_URL}/videos`;
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");
  return session.user.id;
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
  console.log('Starting saveVideoDetails...');
  const userId = await getSessionUserId();
  console.log('Got userId:', userId);
  
  await validateWithArcjet(userId);
  console.log('Passed Arcjet validation');
  
  // Fix the URL construction
  await apiFetch(
    `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`,
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

  // Database part
  console.log('About to save to database...');
  const now = new Date();
  const dbData = {
    ...videoDetails,
    videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  console.log('Database data prepared:', dbData);

  try {
    await db.insert(videos).values(dbData);
    console.log('Database save successful');
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }

  revalidatePaths(["/"]);
  return { videoId: videoDetails.videoId };
};


export const getAllVideos = withErrorHandling(async (
    searchQuery: string = '',
    sortFilter?: string,
    pageNumber: number = 1,
    pageSize: number = 8,
) => {
    const session = await auth.api.getSession({ headers: await headers() })
    const currentUserId = session?.user?.id;

    const canSeeTheVideos = or(
        eq(videos.visibility, 'public'),
        eq(videos.userId, currentUserId!)
    );

    const whereCondition  = searchQuery.trim()
       ? and(
        canSeeTheVideos,
        doesTitleMatch(videos, searchQuery),
       ): canSeeTheVideos

    

    const [{ totalCount}] = await db
    .select({totalCount: sql<number>`count(*)`})
    .from(videos)
    .where(whereCondition)

    const totalVideos = Number(totalCount || 0);
    const totalPages = Math.ceil(totalVideos / pageSize);

    // Fetch paginated, sorted results
    const videoRecords = await buildVideoWithUserQuery()
      .where(whereCondition)
      .orderBy(
        sortFilter
          ? getOrderByClause(sortFilter)
          : sql`${videos.createdAt} DESC`
      )
      .limit(pageSize)
      .offset((pageNumber - 1) * pageSize);
      return {
        videos: videoRecords,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalVideos,
          pageSize,
        },
      };
    }
  );

  export const getVideoById = withErrorHandling(async (videoId: string) => {
    const [videoRecord] = await buildVideoWithUserQuery().where(
      eq(videos.videoId, videoId)
    );
    return videoRecord;
  });

  export const getAllVideosByUser = async (
    userIdParameter: string,
    searchQuery: string = "",
    sortFilter?: string
  ) => {
    console.log('getAllVideosByUser called with:', { userIdParameter, searchQuery, sortFilter });
    
    const currentUserId = (
      await auth.api.getSession({ headers: await headers() })
    )?.user.id;

    const isOwner = userIdParameter === currentUserId;
    console.log('User check:', { userIdParameter, currentUserId, isOwner });

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

    return { 
      user: userInfo, 
      videos: userVideos,
      count: userVideos.length 
    };
  };