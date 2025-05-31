import SearchForm from "@/components/SearchForm";

export default async function Home({
  searchParams}: {
    searchParams: Promise<{ query?: string}>
}) {
   const query = (await searchParams).query;

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
          {/* Startup listings will go here */}
        </div>
      </section>
    </div>
  );
}