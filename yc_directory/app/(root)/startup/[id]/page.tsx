// /startup/[id]/page.tsx
import React, { Suspense } from 'react'
import { PLAYLIST_BY_SLUG_QUERY, STARTUP_BY_ID_QUERY } from '@/sanity/lib/queries';
import {notFound} from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { formatDate } from '@/lib/utils'
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";

import markdownit from 'markdown-it';
import { SanityLive } from '@/sanity/lib/live';
import View from '@/app/components/View';
import StartupCard, { StartupTypeCard } from '@/app/components/StartupCard';

const md = new markdownit();

export const experimental_ppr = true;

const Page = async ({params}: {params: Promise<{id: string}>}) => {
  const id = (await params).id;

  const [post, playlist] = await Promise.all([
    client.withConfig({ useCdn: true }).fetch(STARTUP_BY_ID_QUERY, { id }),
    client.withConfig({ useCdn: true }).fetch(PLAYLIST_BY_SLUG_QUERY, {
      slug: "editor-picks",
    }),
  ]);
  
  const editorPosts = playlist?.select || [];
  
  if (!post) {
    notFound();
  }

  const parsedContent = md.render(post?.pitch || '');
  
  return (
    <>
        <section className="pink_container !min-h-[230px]">
           <p className='tag'>{formatDate(post?._createdAt)}</p>
           <h1 className='heading'>{post.title}</h1>
           <p className='sub-heading !max-w-5xl'>{post.description}</p>
        </section>

        <section className="section_container">
            <img src={post.image} alt="thumbnail" className='w-full h-auto rounded-xl' /> 

            <div className="space-y-5 mt-10 max-w-4xl mx-auto">
                <div className="flex-between gap-5">
                    <Link href={`/user/${post.author?._id}`} className='flex-center gap-2 items-center mb-3'>
                        <Image 
                            src="/images/avatars/default-avatar.png"
                            alt="avatar" 
                            width={64} 
                            height={64} 
                            className='rounded-full drop-shadow-lg' 
                        />
                        <div>
                            <p className='text-20-medium'>{post.author?.name || 'Anonymous'}</p>
                            <p className='text-16-medium !text-black-300'>{post.author?.username || 'user'}</p>
                        </div>
                    </Link>

                    <p className='category-tag'>{post.category}</p>
                </div>

                <h3 className='text-30-bold'>Pitch Details</h3>
                {parsedContent ? (
                    <article 
                      className='prose max-w-4xl font-work-sans break-all'
                      dangerouslySetInnerHTML={{__html: parsedContent}}
                    />
                ) : (
                    <p className='no-result'>
                        No details provided</p>
                )}
            </div> 

            <hr className='divider'/> 

            {editorPosts?.length > 0 && (
                <div className="max-w-4xl mx-auto">
                    <p className="text-30-semibold">Editor Picks</p>
                    <ul className="mt-7 card_grid-sm">
                        {editorPosts.map((post: StartupTypeCard, i: number) => (
                            <StartupCard key={i} post={post} />
                        ))}
                    </ul>
                </div>
            )}
            

            <Suspense fallback={<Skeleton className="view_sekelton"/>}>
                <View id={id} />
            </Suspense>
        </section>
    </>
  );
};

export default Page;