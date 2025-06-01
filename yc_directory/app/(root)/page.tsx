import SearchForm from "@/components/SearchForm";
import StartupCard, { StartupTypeCard } from "@/components/StartupCard";

import { client } from "../../sanity/lib/client";
import { STARTUPS_QUERY } from "../../sanity/lib/queries";

export default async function Home({
  searchParams}: {
    searchParams: Promise<{ query?: string}>
}) {
   const query = (await searchParams).query;

   const posts = await client.fetch(STARTUPS_QUERY, {
    search: query || "",
   });

   console.log(JSON.stringify(posts, null, 2));

  //  const posts = [{
  //   _createdAt: new Date().toISOString(),
  //   views: 55,
  //   author: {_id: 1, name: 'Gator'},
  //   _id: "1",
  //   description: 'this is a description.', 
  //   category: 'Robots',
  //   title: "We Robots",
  //   image: "https://via.placeholder.com/150", //https://unsplash.com/photos/-0hKZ-WT1Tk
  //  }]

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
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="flex-1 bg-[#000000] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#FFFFFF]">All Startups</h2>
          <ul className="mt-7 card_grid">
            {posts?.length > 0 ? (
              posts.map((post: StartupTypeCard) => (
                <StartupCard key={post?._id} post={post} />
              ))
            ) : (
              <p className="no-results">No startups found</p>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}