import React from 'react'
import { formatDate } from '../../lib/utils'
import Link from 'next/link'
import { Author, Startup } from "../../sanity/types";
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Eye } from "lucide-react"

export type StartupTypeCard = Omit<Startup, "author"> & { author?: Author };

const StartupCard = ({ post }: { post: StartupTypeCard }) => {
  // Add console logs to inspect the data
  console.log('Full post data:', post);
  console.log('Author data:', post.author);
    
  const {
    _createdAt, 
    views, 
    author, 
    title, _id,
    description, 
    category,
    image,
  } = post;
 const {_id: authorId, name}  = author || {}

  // Add another console log to see the extracted author data
  console.log('Extracted author data:', { authorId, name });

  return (
    <li className="startup-card group">
        <div className="flex-between">
            <p className="startup_card_date">
                {formatDate(_createdAt)}
            </p>
            <div className="flex gap-1.5">
                <Eye className="size-6 text-primary"/>
                <span className="text-16-medium">{views}</span>
            </div>
        </div>
        <div className="flex-between mt-5 gap-5">
            <div className="flex-1">
                <Link href={`/user/${authorId}`}>
                 <p className="text-16-medium line-clamp-1">{name}</p>
                </Link>
                <Link href={`/startup/${_id}`}>
                    <h3 className="text-26-semibold line-clamp-1">{title}</h3>
                </Link>
                <Link href={`/user/${authorId}`}>
                    <Image 
                      src="/images/avatars/default-avatar.png"
                      alt={name || 'Author'} 
                      width={24} 
                      height={24} 
                      className="rounded-full" 
                    />
                </Link>
            </div>

            <Link href={`/startup/${_id}`}>
                <p className="startup-card_desc">
                    {description}
                </p>

                <img src={image} alt="placeholder" className="startup-card_img" />
            </Link>

            <div className="flex-center gap-23 mt-5">
                <Link href={`/?query=${category?.toLowerCase() ?? ''}`}>
                    <p className="text-16-medium line-clamp-1">{category}</p>
                </Link>
                <Button className="startup-card_btn" asChild>
                    <Link href={`/startup/${_id}`}>Details</Link>
                
                </Button>
            </div>
        </div>

    </li>
    
  )
}

export default StartupCard