'use client'

import FormField from '@/app/components/FormField'
import FileInput from '@/app/components/FileInput'
import React, { useEffect, useState } from 'react'
import { MAX_THUMBNAIL_SIZE, MAX_VIDEO_SIZE } from '@/constants'
import { useFileInput } from '@/lib/hooks/useFileInput'
import { getVideoUploadUrl, saveVideoDetails, getThumbnailUploadUrl, getVideoUploadUrlWithAuth } from '@/lib/actions/video'

import {getVideoDuration} from "@/lib/utils";
import { useRouter } from 'next/navigation';


const upLoadFileToBunny = async (file: File, uploadUrl: string, accessKey: string): Promise<void> => {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
            'AccessKey': accessKey,
        },
        body: file,
    });
    if (!response.ok) {
        const text = await response.text();
        console.error('Bunny upload failed:', response.status, text);
        throw new Error('Failed to upload file to Bunny');
    }
};
        


const Page = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);

    

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibility: 'public',
    });

    const video = useFileInput(MAX_VIDEO_SIZE);
    const thumbnail = useFileInput(MAX_THUMBNAIL_SIZE);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for recorded video in sessionStorage
        const recordedVideoData = sessionStorage.getItem("recordedVideo");
        if (recordedVideoData) {
            try {
                const { url, name, type, size, duration } = JSON.parse(recordedVideoData);
                
                // Create a File object from the recorded video
                fetch(url)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], name, { type });
                        video.handleFileChange({ target: { files: [file] } } as any);
                        setVideoDuration(duration);
                    });
                
                // Clean up sessionStorage
                sessionStorage.removeItem("recordedVideo");
            } catch (error) {
                console.error("Error processing recorded video:", error);
            }
        }
    }, []);

    useEffect(() => {
        const file = video.file;
        if (file) {
            (async () => {
                const url = URL.createObjectURL(file);
                const duration = await getVideoDuration(url);
                setVideoDuration(duration ?? 0);
                URL.revokeObjectURL(url);
            })();
        }
    }, [video.file]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            console.log('=== handleSubmit START ===');
            
            if(!video.file || !thumbnail.file) {
                setError('Please upload a video and thumbnail');
                return;
            }
            if(!formData.title || !formData.description) {
                setError('Please fill in all details');
                return;
            }

            const result = await getVideoUploadUrl();
            console.log('Raw result from getVideoUploadUrl:', result);
            console.log('Result type:', typeof result);
            
            if (typeof result === 'string') {
                console.error('Error from getVideoUploadUrl:', result);
                setError(result);
                setIsSubmitting(false);
                return;
            }

            if (!result || !result.videoId || !result.uploadUrl || !result.AccessKey) {
                console.error('Invalid result structure:', result);
                setError('Invalid response from server');
                setIsSubmitting(false);
                return;
            }

            const {
                videoId,
                uploadUrl: videoUploadUrl,
                AccessKey: videoAccessKey,
            } = result;

            console.log('Successfully destructured values:', {
                videoId,
                videoUploadUrl,
                videoAccessKey
            });

            // 1. upload the video to bunny
            console.log('Uploading video:', video.file, videoUploadUrl, videoAccessKey);
            await upLoadFileToBunny(video.file, videoUploadUrl, videoAccessKey);

            // upload the thumbnail to DB
            const {
                uploadUrl: thumbnailUploadUrl,
                AccessKey: thumbnailAccessKey,
                cdnUrl: thumbnailCdnUrl,
                
            } = await getThumbnailUploadUrl(videoId);

            if(!thumbnailUploadUrl || !thumbnailCdnUrl || !thumbnailAccessKey) {
                throw new Error('Failed to get thumbnail upload credentials')
            }

            console.log('Uploading thumbnail:', thumbnail.file, thumbnailUploadUrl, thumbnailAccessKey);

            // Attach Thumbnail
            await upLoadFileToBunny(thumbnail.file, thumbnailUploadUrl, thumbnailAccessKey);

            // Create a new DB entry for the video details (urls, data)
            await saveVideoDetails({
                videoId,
                thumbnailUrl: thumbnailCdnUrl,
                ...formData,
                duration: videoDuration,
            });

            router.push(`/video/${videoId}`);

        } catch (error) {
            console.error("Error submitting form: ", error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
            console.log('=== handleSubmit END ===');
        }
    }

    return (
        <div className='wrapper-md upload-page'>
            <h1>Upload a video</h1>
            {error && <div className='error-field'>{error}</div>} 

            <form className='rounded-20 shadow-10 gap-6 w-full flex flex-col px-5 py-7.5' onSubmit={handleSubmit}>
                <FormField 
                    id='title'
                    label='Title'
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder='Enter a clear and concie video title'
                />
                <FormField 
                    id='description'
                    label='Description'
                    value={formData.description}
                    as="textarea"
                    onChange={handleInputChange}
                    placeholder='Describe what this video is about'
                />
                <FileInput 
                    id='video'
                    label='Video'
                    accept='video/*'
                    file={video.file}
                    previewUrl={video.previewUrl}
                    inputRef={video.inputRef}
                    onChange={video.handleFileChange}
                    onReset={video.resetFile}
                    type='video'
                />
                <FileInput 
                    id='thumbnail'
                    label='Thumbnail'
                    accept='image/*'
                    file={thumbnail.file}
                    previewUrl={thumbnail.previewUrl}
                    inputRef={thumbnail.inputRef}
                    onChange={thumbnail.handleFileChange}
                    onReset={thumbnail.resetFile}
                    type='image'
                />

                <FormField 
                    id='visibility'
                    label='Visibility'
                    value={formData.visibility}
                    as="select"
                    options={[
                        {value: 'public', label: 'Public'},
                        {value: 'private', label: 'Private'},
                    ]}
                    onChange={handleInputChange}
                    placeholder='EDescribe what this video is about'
                />

                <button type='submit' disabled={isSubmitting} className='submit-button'>
                    {isSubmitting ? 'Uploading...' : 'Upload video'}
                </button>
            </form>
            
        </div>
  )
}

export default Page