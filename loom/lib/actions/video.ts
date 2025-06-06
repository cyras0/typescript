'use server'
import { db } from "@/drizzle/db";
import { apiFetch, getEnv, withErrorHandling } from "@/lib/utils";
import { BUNNY } from "@/constants";
import { videos } from "@/drizzle/schema";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

const VIDEO_STREAM_BASE_URL = `${BUNNY.STREAM_BASE_URL}/videos`;
const THUMBNAIL_STREAM_BASE_URL = `${BUNNY.STREAM_BASE_URL}/thumbnails`;
const THUMBNAIL_CDN_URL = `${BUNNY.CDN_URL}`;
const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
const ACCESS_KEYS = {
    streamAccessKey: getEnv("BUNNY_STREAM_ACCESS_KEY"),
    storageAccessKey: getEnv("BUNNY_STORAGE_ACCESS_KEY"),
}

// Helper Functions
const getSessionUserId = async (): Promise<string> => {
    const session = await auth.api.getSession({headers: await headers()});
    if(!session) {
        throw new Error('Unauenticated');
    }
    return session.user.id;
}

const revalidatePaths = (paths: string[]) => {
    paths.forEach((path) => {
        revalidatePath(path);
    });
}
// Server Actions
export const getVideoUploadUrl = withErrorHandling(async () => {
    await getSessionUserId();
    const videoResponse = await apiFetch(
        `${BUNNY.STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
        {
            method: 'POST',
            bunnyType: 'stream',
            body: { title: 'Temporary Title', collectionId: '' },
        }
    )

    const uploadUrl = `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
    return {
        videoId: videoResponse.guid,
        uploadUrl,
        AccessKey: ACCESS_KEYS.storageAccessKey,
    }
})

export const getThumbnailUploadUrl = withErrorHandling(async (videoId: string) => {
    const fileName = `${Date.now()}-${videoId}-thumbnail}`;
    const uploadUrl = `${THUMBNAIL_STREAM_BASE_URL}/thumbnails/${fileName}`;
    const cndUrl = `${THUMBNAIL_CDN_URL}/thumbnails/${fileName}`;

    return {
        uploadUrl,
        cndUrl,
        AccessKey: ACCESS_KEYS.storageAccessKey,    
    }
})  

export const saveVideoDetails = withErrorHandling(async (videoDetails: VideoDetails) => {
    const userId = await getSessionUserId();
    const videoResponse = await apiFetch(
        `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`,
        {
            method: 'POST',
            bunnyType: 'stream',
            body: { 
                title: videoDetails.title,
                description: videoDetails.description
            },
        }
    );

    await db.insert(videos).values({
        title: videoDetails.title,
        description: videoDetails.description,
        videoId: videoDetails.videoId,
        thumbnailUrl: videoDetails.thumbnailUrl,
        visibility: videoDetails.visibility as "public" | "private",
        videoUrl: `${BUNNY.EMBED_URL}//${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
        userId,
        duration: videoDetails.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePaths(['/']);
    return {videoId: videoDetails.videoId};
})       