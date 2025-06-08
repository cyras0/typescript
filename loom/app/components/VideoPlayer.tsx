import React from 'react'
import { BUNNY } from '@/constants';
import { getEnv } from '@/lib/utils';

const VideoPlayer = ({videoId}: VideoPlayerProps) => {
  const BUNNY_LIBRARY_ID = getEnv("BUNNY_LIBRARY_ID");
  const iframeUrl = `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoId}`;
  
  console.log('VideoPlayer details:', {
    videoId,
    BUNNY_LIBRARY_ID,
    BUNNY_EMBED_URL: BUNNY.EMBED_URL,
    iframeUrl
  });
  
  return (
    <div className='video-player'>
      <iframe
        src={iframeUrl}
        loading='lazy'
        title='Video Player'
        style={{border: 0, zIndex:50 }}
        allowFullScreen
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      />
    </div>
  )
}

export default VideoPlayer