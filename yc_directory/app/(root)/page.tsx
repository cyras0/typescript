import { client } from "../../sanity/lib/client";
import { STARTUPS_QUERY } from "../../sanity/lib/queries";
import StartupCard from "../components/StartupCard";
import SearchForm from "../components/SearchForm";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { auth } from "@/app/auth";

export default async function Home({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const query = searchParams.query || "";
  
  const params = {search: query || null};

  const session = await auth();
  console.log(session?.id);
  
  // const posts = await client.fetch(STARTUPS_QUERY, {
  //   search: query,
  // });
  const {data: posts} = await sanityFetch({query: STARTUPS_QUERY, params})


  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Section */}
      <section className="flex-1 bg-[#FFE5E5] py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-[#000000] py-16 px-12 rounded-lg mt-16 w-1/3 mx-auto">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-[#FFFFFF] leading-tight">
              Pitch Your Startup, <br />
              Connect With <br />
              Entrepreneurs
            </h1>
          </div>

          <div className="h-[400px] flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Submit Ideas, Vote on Pitches, <br />
                and Get Noticed in Virtual Competitions.
              </p>
            </div>
            
            {/* Search box */}
            <div>
              <SearchForm query={query} />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="bottom-section">
        <div className="container mx-auto px-4">
          <div className="startups-header">
            <h2>All Startups</h2>
          </div>
          <ul className="card_grid">
            {posts?.length > 0 ? (
              posts.map((post) => (
                <StartupCard key={post._id} post={post} />
              ))
            ) : (
              <p className="no-results text-white">No startups found</p>
            )}
          </ul>
        </div>
      </section>
      <SanityLive />
    </div>
  );
}