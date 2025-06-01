// /startup/[id]/page.tsx
import React from 'react'
import { STARTUP_BY_ID_QUERY } from '@/sanity/lib/queries';
import {notFound} from 'next/navigation';
import { client } from '@/sanity/lib/client';


export const experimental_ppr  = true;

const page = async ({params}: {params: Promise<{id: string}>}) => {
  const id = (await params).id;

  console.log({id});
  
  const post = await client.fetch(STARTUP_BY_ID_QUERY, {id});
  if (!post) {
    notFound();
  }
  return (
    <>
        <h1 className='text-3xl'>{post.title}</h1>
    </>
  );
};

export default page;