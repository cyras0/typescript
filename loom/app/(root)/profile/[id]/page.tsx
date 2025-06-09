import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { getAllVideosByUser } from "@/lib/actions/video";
import { EmptyState, SharedHeader, VideoCard } from "@/app/components";

const ProfilePage = async ({ params, searchParams }: ParamsWithSearch) => {
  console.log('=== ProfilePage START ===');
  const { id } = await params;
  const { query, filter } = await searchParams;

  console.log("ProfilePage params:", { id, query, filter });

  try {
    // In Vercel, try to get user info from session cookie first
    if (process.env.VERCEL) {
      console.log('Running in Vercel, checking session cookie');
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('session');
      
      if (sessionCookie?.value) {
        const session = JSON.parse(decodeURIComponent(sessionCookie.value));
        console.log('Found session in cookie:', session);
        
        if (session?.user) {
          // If the requested profile matches the session user, return their info
          if (session.user.id === id) {
            return (
              <main className="wrapper page">
                <SharedHeader
                  subHeader={session.user.email}
                  title={session.user.name || session.user.email.split('@')[0]}
                  userImg={session.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.email)}`}
                />
                <EmptyState
                  icon="/assets/icons/video.svg"
                  title="No Videos Available Yet"
                  description="Video will show up here once you upload them."
                />
              </main>
            );
          }
        }
      }
    }

    // If not in Vercel or no session found, use the normal flow
    const { user, videos } = await getAllVideosByUser(id, query, filter);
    console.log("ProfilePage data:", { 
      userId: user?.id, 
      userName: user?.name,
      videosCount: videos?.length,
      firstVideo: videos?.[0]
    });

    // Only redirect if we have no user data at all
    if (!user?.id) {
      console.log("No user data found, redirecting to 404");
      redirect("/404");
    }

    console.log('=== ProfilePage END - Rendering ===');
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
    // Only redirect on actual errors, not just missing videos
    if (error instanceof Error && error.message === "User not found") {
      console.log("User not found error, redirecting to 404");
      redirect("/404");
    }
    // For other errors, show the page with empty state
    console.log("Other error, showing error state");
    return (
      <main className="wrapper page">
        <EmptyState
          icon="/assets/icons/video.svg"
          title="Error Loading Profile"
          description="There was an error loading this profile. Please try again later."
        />
      </main>
    );
  }
};

export default ProfilePage;
