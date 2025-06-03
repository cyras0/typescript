import { client } from "@/sanity/lib/client";
import { STARTUP_VIEWS_QUERY } from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/write-client";
import Ping from "./Ping";

// Server action to update views
async function incrementViews(id: string, currentViews: number) {
  'use server';
  
  try {
    await writeClient
      .patch(id)
      .set({ views: currentViews + 1 })
      .commit();
  } catch (error) {
    console.error('Failed to update view count:', error);
  }
}

const View = async ({ id }: { id: string }) => {
  try {
    const { views: totalViews } = await client
      .withConfig({ useCdn: true })
      .fetch(STARTUP_VIEWS_QUERY, { id });

    // Call the server action to update views
    incrementViews(id, totalViews);

    return (
      <div className="view-container">
        <div className="absolute -top-2 -right-2">
          <Ping />
        </div>
        <p className="view-text">
          <span className="font-black">Views: {totalViews}</span>
        </p>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch view count:', error);
    return (
      <div className="view-container">
        <p className="view-text">
          <span className="font-black">Views: --</span>
        </p>
      </div>
    );
  }
};

export default View;
