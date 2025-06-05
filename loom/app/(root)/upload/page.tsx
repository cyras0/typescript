'use client'

import FormField from '@/app/components/FormField'
import FileInput from '@/app/components/FileInput'
import React, { useState } from 'react'

const Page = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        visibility: 'public',
    });

    const [error, setError] = useState(null);

    const handleInputChange = (e: React.ChangeEvent) => {
        const { name, value } = e.target;
        setFormData({ ...preState, [name]: value });
    };

    return (
        <div className='wrapper-md upload-page'>
            <h1>Upload a video</h1>
            {error && <div className='error-field'>{error}</div>} 

            <form className='rounded-20 shadow-10 gap-6 w-full flex flex-col px-5 py-7.5'>
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
                <FileInput />

                <FileInput />

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

                <button type='submit' className='btn-primary'>Upload</button>
            </form>
            
        </div>
  )
}

export default Page