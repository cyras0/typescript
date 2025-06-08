import React from 'react'
import EmptyState from "@/app/components/EmptyState";
import VideoCard from "@/app/components/VideoCard";
import Header from "@/app/components/header";
import Pagination from "@/app/components/Pagination";
import { getAllVideos } from "@/lib/actions/video";
import { EmptyState as EmptyStateComponent, VideoCard as VideoCardComponent, Pagination as PaginationComponent } from "@/app/components";

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
  
  // Await the searchParams
  const params = await searchParams;
  console.log('Search params:', params);
  
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
      pagination
    });

    if (!videos || videos.length === 0) {
      return (
        <main className="wrapper page">
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
        <Header subHeader="Public Library" title="All Videos" />

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
