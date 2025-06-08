import React from 'react'
import EmptyState from "@/app/components/EmptyState";
import VideoCard from "@/app/components/VideoCard";
import Header from "@/app/components/header";
import Pagination from "@/app/components/Pagination";
import { getAllVideos } from "@/lib/actions/video";
import { cookies } from 'next/headers';

const HomePage = async ({ 
  searchParams 
}: { 
  searchParams: { 
    query?: string; 
    filter?: string;
    page?: string;
  } 
}) => {
  console.log('=== HomePage START ===');
  
  // Get mock session from cookies
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
  const mockSession = sessionCookie ? JSON.parse(sessionCookie.value) : null;
  
  // Await the searchParams
  const params = await searchParams;
  console.log('Search params:', params);
  
  const currentPage = Number(params.page) || 1;
  const perPage = 12;
  
  let videos = [];
  let pagination = { totalPages: 0, currentPage: 1 };
  
  try {
    const result = await getAllVideos(
      params.query, 
      params.filter,
      currentPage,
      perPage
    );
    videos = result.videos;
    pagination = result.pagination;
  } catch (error) {
    console.error('Error loading videos:', error);
    // Continue with empty videos array
  }

  return (
    <main className="wrapper page">
      <Header 
        subHeader="Welcome" 
        title={mockSession?.user?.name || "Guest"} 
        userImg={mockSession?.user?.image}
      />
      
      {videos.length === 0 ? (
        <EmptyState
          icon="/assets/icons/video.svg"
          title="No Videos Available Yet"
          description="Video will show up here once you upload them."
        />
      ) : (
        <>
          <section className="video-grid">
            {videos.map(({ video, user }) => (
              <VideoCard
                key={video.id}
                id={video.videoId}
                title={video.title}
                thumbnail={video.thumbnailUrl}
                createdAt={video.createdAt}
                userImg={user?.image ?? ""}
                username={user?.name ?? "Guest"}
                views={video.views}
                visibility={video.visibility}
                duration={video.duration}
              />
            ))}
          </section>
          
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              baseUrl="/"
              queryParams={{
                ...(params.query && { query: params.query }),
                ...(params.filter && { filter: params.filter })
              }}
            />
          )}
        </>
      )}
    </main>
  );
};

export default HomePage;
