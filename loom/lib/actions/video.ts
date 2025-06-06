'use server'

import { apiFetch, getEnv } from "@/lib/utils";
import { BUNNY } from "@/constants";
import { db } from "@/drizzle/db";
import { videos } from "@/drizzle/schema";


const VIDEO_STREAM_BASE_URL = `${BUNNY.STREAM_BASE_URL}/videos`;
const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
const ACCESS_KEYS = {
    streamAccessKey: getEnv("BUNNY_STREAM_ACCESS_KEY"),
    storageAccessKey: getEnv("BUNNY_STORAGE_ACCESS_KEY"),
}

// In lib/actions/server-actions.ts
export async function getVideoUploadUrl() {
    try {
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

export async function getThumbnailUploadUrl(videoId: string) {
    try {
        const fileName = `${Date.now()}-${videoId}-thumbnail`;
        const uploadUrl = `${BUNNY.STORAGE_BASE_URL}/thumbnails/${fileName}`;
        const cdnUrl = `${BUNNY.CDN_URL}/thumbnails/${fileName}`;

        return {
            uploadUrl,
            cdnUrl,
            AccessKey: ACCESS_KEYS.storageAccessKey,
        };
    } catch (error) {
        console.error('Error in getThumbnailUploadUrl:', error);
        throw error;
    }
}

export async function saveVideoDetailsToDb(videoDetails: VideoDetails) {
    const session = await auth();
    
    if (!session?.user?.id) {
        throw new Error('User must be authenticated to upload videos');
    }

    // First, check if user exists
    const existingUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id)
    });

    // If user doesn't exist, create them
    if (!existingUser) {
        await db.insert(user).values({
            id: session.user.id,
            name: session.user.name || 'Anonymous',
            email: session.user.email || `${session.user.id}@placeholder.com`,
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
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}