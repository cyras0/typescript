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
    userName,
    views,
    visibility,
    duration,
}: VideoCardProps) => {
  return (
   <Link href={`/video/${id}`} className="video-card">
        <Image src={thumbnail} alt={thumbnail} width={290} height={160} className="thumbnail" />
        <article>
            <div>
                <figure>
                    <Image src={userImg} alt="avatar" width={34} height={34} className="rounded-full aspect-square object-cover" />
                    <figcaption>
                        <h3>{userName}</h3>
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
   </Link>
  )
}

export default VideoCard