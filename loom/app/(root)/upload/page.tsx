'use client'

import FormField from '@/app/components/FormField'
import FileInput from '@/app/components/FileInput'
import React, { useState } from 'react'
import { MAX_THUMBNAIL_SIZE, MAX_VIDEO_SIZE } from '@/constants'
import { useFileInput } from '@/lib/hooks/useFileInput'

const Page = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibility: 'public',
    });

    const video = useFileInput(MAX_VIDEO_SIZE);
    const thumbnail = useFileInput(MAX_THUMBNAIL_SIZE);

    const [error, setError] = useState(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if(!video.file || !thumbnail.file) {
                setError('Please upload a video and thumbnail');
                return;
            }
            if(!formData.title || !formData.description) {
                setError('Please fill in all details');
                return;
            }

            // zupload to bunny
            console.log("Error submitting form: ", error);
        } finally {
            setIsSubmitting(false);
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