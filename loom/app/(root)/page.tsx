import React from 'react'
import EmptyState from "@/app/components/EmptyState";
import VideoCard from "@/app/components/VideoCard";
import { SharedHeader } from "@/app/components";
import Pagination from "@/app/components/Pagination";
import { getAllVideos } from "@/lib/actions/video";
import { getCurrentUser } from "@/lib/actions/user";

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
  
  // Get current user using server action
  const currentUser = await getCurrentUser();

  // Await searchParams before using its properties
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const perPage = 12;
  
  try {
    const { videos, pagination } = await getAllVideos(
      params.query, 
      params.filter,
      currentPage,
      perPage
    );

    console.log('Home page data:', {
      videosCount: videos?.length,
      pagination,
      currentUser: currentUser?.id
    });

    if (!videos || videos.length === 0) {
      return (
        <main className="wrapper page">
          <SharedHeader 
            subHeader={currentUser ? "Welcome back" : "Public Library"} 
            title={currentUser ? currentUser.name : "All Videos"}
            userImg={currentUser?.image}
          />
          <EmptyState
            icon="/assets/icons/video.svg"
            title="No Videos Available Yet"
            description="Video will show up here once you upload them."
          />
        </main>
      );
    }

    return (
      <main className="wrapper page">
        <SharedHeader 
          subHeader={currentUser ? "Welcome back" : "Public Library"} 
          title={currentUser ? currentUser.name : "All Videos"}
          userImg={currentUser?.image}
        />

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
      </main>
    );
  } catch (error) {
    console.error('Home page error:', error);
    return (
      <main className="wrapper page">
        <SharedHeader 
          subHeader="Error" 
          title="Something went wrong"
        />
        <EmptyState
          icon="/assets/icons/video.svg"
          title="Error Loading Videos"
          description="There was an error loading the videos. Please try again later."
        />
      </main>
    );
  }
};

export default HomePage;
