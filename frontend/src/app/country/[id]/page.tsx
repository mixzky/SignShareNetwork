import { Suspense } from "react";
import CountryContent from "./CountryContent";
import TopMenu from "@/components/TopMenu";
import { createClient } from "@/utils/supabase/server";
import VideoCard from "@/components/VideoCard";
import { notFound } from "next/navigation";
import Review from "@/components/Review";

// Map of country IDs to names
const countryIdToName: { [key: string]: string } = {
  "764": "thailand",
  "840": "united states",
  "392": "japan",
  // Add more mappings as needed
};

export default async function CountryPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();

  // Convert numeric ID to country name if needed
  const regionName =
    countryIdToName[params.id]?.toLowerCase() || params.id.toLowerCase();

  console.log("Fetching videos for region:", regionName);

  // Fetch videos for this region/country
  const { data: videos, error } = await supabase
    .from("sign_videos")
    .select(
      `
      *,
      user:users (
        avatar_url,
        display_name,
        role
      ),
      reviews:reviews (
        comment,
        rating,
        user:users (
          avatar_url,
          display_name
        )
      )
    `
    )
    .or(`region.ilike.${regionName},region.ilike.${params.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching videos:", error);
    return notFound();
  }

  console.log("Fetched videos:", videos);

  // Filter verified videos after fetching to debug status
  const verifiedVideos = videos.filter((video) => {
    console.log("Video status:", video.status, "for video:", video.title);
    return video.status === "verified" || video.status === "pending";
  });

  console.log("Verified videos:", verifiedVideos);

  return (
    <main className="flex flex-col min-h-screen bg-[#fafafa]">
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] h-24 flex items-center">
        <TopMenu />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CountryContent id={params.id} />
      </Suspense>

      {/* Videos Section */}
      <div className="container mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold mb-6">Recent Videos</h2>
        {verifiedVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No videos found for this region yet.
            </p>
            <p className="text-sm text-gray-400 mt-2">Region: {regionName}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 place-items-center">
            {verifiedVideos.map((video) => (
              <div key={video.id} className="w-full max-w-4xl  ">
                <VideoCard video={video} />
                <Review videoId={video.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
