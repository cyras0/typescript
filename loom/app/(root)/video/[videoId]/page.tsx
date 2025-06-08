import { getVideoById } from '@/lib/actions/video';
import React from 'react'
import { redirect } from 'next/navigation';
import VideoPlayer from '@/app/components/VideoPlayer';
import VideoDetailHeader from '@/app/components/VideoDetailHeader';
import Image from 'next/image';

const Page = async ({ params }: { params: { videoId: string } }) => {
  const { videoId } = await params;
  
  const videoRecord = await getVideoById(videoId);

  if(!videoRecord?.video) redirect({ url: '/404' })

  const { user, video } = videoRecord;

  return (
    <main className='wrapper page'>
      <VideoDetailHeader {...video} userImg={user?.image} username={user?.name} ownerId={user?.id}/>
      <section className="video-details">
        <div className="content">
          <VideoPlayer videoId={video.videoId} />
        </div>
      </section>
    </main>
  )
}

export default Page