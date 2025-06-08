import { redirect } from "next/navigation";

import { getAllVideosByUser } from "@/lib/actions/video";
import { EmptyState, SharedHeader, VideoCard } from "@/app/components";

const ProfilePage = async ({ params, searchParams }: ParamsWithSearch) => {
  const { id } = await params;
  const { query, filter } = await searchParams;

  try {
    const { user, videos } = await getAllVideosByUser(id, query, filter);
    console.log("ProfilePage data:", { id, user, videosCount: videos?.length });

    if (!user) {
      console.log("User not found, redirecting to 404");
      redirect("/404");
    }

    return (
      <main className="wrapper page">
        <SharedHeader
          subHeader={user?.email}
          title={user?.name}
          userImg={user?.image ?? ""}
        />

        {videos?.length > 0 ? (
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
        ) : (
          <EmptyState
            icon="/assets/icons/video.svg"
            title="No Videos Available Yet"
            description="Video will show up here once you upload them."
          />
        )}
      </main>
    );
  } catch (error) {
    console.error("Profile page error:", error);
    redirect("/404");
  }
};

export default ProfilePage;
