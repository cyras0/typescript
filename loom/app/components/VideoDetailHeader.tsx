'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { daysAgo } from '@/lib/utils';

const VideoDetailHeader = ({title, visibility, createdAt, userImg, username, ownerId}: VideoDetailHeaderProps) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/video/${videoId}`);
    setCopied(true);
  }

  useEffect(() => {
    const changeChecked = setTimeout(() => {
        if(copied) setCopied(false)
    }, 2000);

    return () => clearTimeout(changeChecked);
  }, [copied]);
  
  return (
    <header className="detail-header">
        <aside className="user-info">
            <h1>{title}</h1>
            <figure>
                <button onClick={() => router.push(`/profile/${ownerId}`)}>
                    <Image src={userImg || ''} alt="User" 
                    width={24}
                    height={24}
                    className="rounded-full"
                    />
                    <h2>{username ?? 'Guest'}</h2>
                </button>
                <figcaption>
                    <span className="mt-1">-</span>
                    <p>{daysAgo(createdAt)}</p> 
                </figcaption>
            </figure>
        </aside>
        <aside className="cta">
            <button onClick={handleCopyLink}>
                <Image src={copied ? "/assets/icons/check.svg" : "/assets/icons/like.svg"} alt="copy link" width={24} height={24} />
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
        </aside>

    </header>
  )
}

export default VideoDetailHeader