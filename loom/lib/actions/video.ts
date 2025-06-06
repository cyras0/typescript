import { apiFetch } from "@/lib/utils";
import { BUNNY } from "@/constants";

// Export the server action from the new location
export { getVideoUploadUrl, saveVideoDetailsToDb } from '@/lib/actions/server-actions';

export const getThumbnailUploadUrl = async (videoId: string) => {
    const fileName = `${Date.now()}-${videoId}-thumbnail}`;
    const uploadUrl = `${BUNNY.STREAM_BASE_URL}/thumbnails/${fileName}`;
    const cdnUrl = `${BUNNY.CDN_URL}/thumbnails/${fileName}`;

    return {
        uploadUrl,
        cdnUrl,
        AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY,    
    }
}