import { Suspense } from "react";
import CountryContent from "./CountryContent";
import TopMenu from "@/components/TopMenu";
import { createClient } from "@/utils/supabase/server";
import VideoCard from "@/components/VideoCard";
import { notFound } from "next/navigation";
import Review from "@/components/Review";
import CountryTopMenu from "@/components/CountryTopMenu";
import LeftMenu from "@/components/LeftMenu";
import { Database } from "@/types/database";
import SearchAssistant from "@/components/searchassistant";

type RawVideoData =
  Database["public"]["Functions"]["get_videos_by_region"]["Returns"][0];

type VideoWithUser = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  video_url: string;
  user_id: string;
  language: string;
  region: string;
  status: "verified" | "pending" | "flagged" | "processing";
  tags: string[];
  user: {
    avatar_url: string | null;
    display_name: string;
    role: string;
  };
};

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tag?: string };
}) {
  const supabase = await createClient();

  // Convert numeric ID to country name if needed
  const regionName = params.id;

  // Fetch videos for this region/country using our new function
  const { data: rawVideos, error } = await supabase.rpc(
    "get_videos_by_region",
    { region_param: regionName, tag_param: searchParams.tag || null }
  );

  if (error) {
    console.error("Error fetching videos:", error);
    return notFound();
  }

  if (!rawVideos) {
    return notFound();
  }

  // Transform the data to match the expected format
  const videos = rawVideos.map(
    (video: RawVideoData): VideoWithUser => ({
      ...video,
      user: {
        avatar_url: video.user_avatar_url,
        display_name: video.user_display_name,
        role: video.user_role,
      },
    })
  );

  console.log("Fetched videos:", videos);

  // Filter verified videos after fetching to debug status
  const verifiedVideos = videos.filter((video: VideoWithUser) => {
    console.log("Video status:", video.status, "for video:", video.title);
    return (
      video.status === "verified" ||
      video.status === "pending" ||
      video.status === "processing"
    );
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
        <CountryContent id={regionName} />
      </Suspense>

      {/* Videos Section with Side Menus */}
      <div className="flex w-full justify-center">
        <div className="flex-1 w-full flex flex-col items-center pt-10">
          <div className="flex w-full max-w-8/12">
            {/* Left Menu */}
            <LeftMenu />
            {/* Main Content Section */}
            <section className="flex-1 flex flex-col items-center pl-8">
              {/* Search Assistant moved here, above video list */}
              <div className="w-full mb-8">
                <SearchAssistant countryId={params.id} />
              </div>
            </section>
            {/* Video Section */}
            <section className="flex-1 flex flex-col items-center pl-8 ">
              <div className="w-full">
                {verifiedVideos.map((video: VideoWithUser) => (
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
