'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const VideoCard = ({
    id,
    title,
    thumbnail,
    createdAt,
    userImg,
    username,
    views,
    visibility,
    duration,
}: VideoCardProps) => {
  return (
   <Link href={`/video/${id}`} className="video-card">
        <div className="relative aspect-video w-full rounded-t-2xl overflow-hidden">
            <Image src={thumbnail} alt={thumbnail} fill className="object-cover" sizes="(max-width: 768px) 100vw, 290px" />
        </div>
        <article>
            <div>
                <figure>
                    <Image src={userImg} alt="avatar" width={34} height={34} className="rounded-full aspect-square object-cover" />
                    <figcaption>
                        <h3>{username}</h3>
                        <p>{visibility}</p>
                    </figcaption>
                </figure>
                <aside>
                    <Image src="/assets/icons/eye.svg" alt="view" width={16} height={16} />
                    <span>{views}</span>
                </aside>
            </div>
            <h2>{title} - {" "} {createdAt.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })}</h2>
            
        </article>
        <button onClick={() => {}} className="copy-btn">
            <Image src="/assets/icons/link.svg" alt="copy" width={18} height={18} />
        </button>
        {duration && (
            <div className="duration">
                {Math.ceil(duration / 60)}min
                <Image src="/assets/icons/clock.svg" alt="duration" width={16} height={16} />
                <span>{duration}</span>
            </div>
        )}
   </Link>
  )
}

export default VideoCard