import SearchForm from "@/components/SearchForm";

export default async function Home({
  searchParams}: {
    searchParams: Promise<{ query?: string}>
}) {
   const query = (await searchParams).query;

  return (
    <>    
      <section className="bg-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Pitch Your Startup, <br />
            Connect With Entrepreneurs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Submit Ideas, Vote on Pitches, and Get Noticed in Virtual Competitions.
          </p>
        </div>
      </section>
      
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">All Startups</h2>
          {/* Startup listings will go here */}
        </div>

        <SearchForm />
      </section>

    </>
  );
}