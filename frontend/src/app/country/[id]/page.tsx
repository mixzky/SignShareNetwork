import { Suspense } from "react";
import CountryContent from "./CountryContent";
import TopMenu from "@/components/TopMenu";
import { createClient } from "@/utils/supabase/server";
import VideoCard from "@/components/VideoCard";
import { notFound } from "next/navigation";
import Review from "@/components/Review";
import CountryTopMenu from "@/components/CountryTopMenu";
import LeftMenu from "@/components/LeftMenu";

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
      {/* Top Menu */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] h-24 flex items-center">
        <CountryTopMenu />
      </div>

      {/* Country Content */}
      <Suspense fallback={<div>Loading...</div>}>
        <CountryContent id={params.id} />
      </Suspense>

      {/* Videos Section with Side Menus */}
      <div className="flex w-full justify-center">
        <div className="flex-1 w-full flex flex-col items-center pt-10">
          <div className="flex w-full max-w-8/12">
            {/* Left Menu */}
            <LeftMenu />

            {/* Video Section */}
            <section className="flex-1 flex flex-col items-center pl-8 ">
              <div className="w-full">
                {verifiedVideos.map((video) => (
                  <div key={video.id} className="mb-6">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
