import { useRef, useState } from "react";

export const useFileInput = (maxSize: number) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [duration, setDuration] = useState(0);
    const inputRef = useRef(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > maxSize) {
                return;
            }
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setFile(file);

            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            if (file.type.startsWith('video')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    if(isFinite(video.duration) && video.duration > 0) {
                        setDuration(Math.round(video.duration));
                    } else {
                        setDuration(0);
                    }
                }
                URL.revokeObjectURL(video.src);
                video.src = objectUrl;
            } 
        }
        
    }

    const resetFile = () => {
        if(previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(null);
        setPreviewUrl('');
        setDuration(0);
        if(inputRef.current) {
            inputRef.current.value = '';
        }
    }

    return { file, previewUrl, duration, inputRef, handleFileChange, resetFile };
    
}