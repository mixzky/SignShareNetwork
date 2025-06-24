import { Suspense } from "react";
import CountryContent from "./CountryContent";
import { createClient } from "@/utils/supabase/server";
import VideoCard from "@/components/VideoCard";
import { notFound } from "next/navigation";
import CountryTopMenu from "@/components/CountryTopMenu";
import LeftMenu from "@/components/LeftMenu";
import { Database } from "@/types/database";


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

interface SearchResult {
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
  similarity?: number;
  user: {
    avatar_url: string | null;
    display_name: string;
    role: string;
  };
}

export default async function CountryPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: { tag?: string; search?: string };
}) {
  const supabase = await createClient();
  const resolvedParams = await params;
const resolvedSearchParamsObj = await searchParams;

const resolvedTagParams = resolvedSearchParamsObj?.tag;
const resolvedSearchParams = resolvedSearchParamsObj?.search;

const regionName = resolvedParams.id;
const tag = resolvedTagParams || null;
const searchQuery = resolvedSearchParams || null;



  let verifiedVideos: VideoWithUser[] = [];

  if (searchQuery) {
    try {
      // Use smart-search edge function
    
      const { data, error } = await supabase.functions.invoke<{
        results: SearchResult[];
        error?: string;
      }>('smart-search', {
        body: JSON.stringify({
          query: searchQuery,
          region: regionName,
          limit: 20
        })
      });

      if (error || !data || "error" in data) {
        verifiedVideos = [];
        
      } else {
        
        const transformedResults = data.results.map((result: any): SearchResult => ({
        id: result.id,
        created_at: result.created_at || new Date().toISOString(),
        updated_at: result.updated_at || new Date().toISOString(),
        title: result.title || "No Title",
        description: result.description || "",
        video_url: result.video_url || "",
        user_id: result.user_id || "",
        language: result.language || "",
        region: result.region || regionName,
        status: result.status || "verified",
        tags: result.tags || [],
        similarity: result.similarity,
        user: {
          avatar_url: result.user?.avatar_url || null,
          display_name: result.user?.display_name || "Unknown User",
          role: result.user?.role || "user"
        }
      }));

        verifiedVideos = (transformedResults || []).filter(
          (video: SearchResult) =>
            video.status === "verified" ||
            video.status === "pending" ||
            video.status === "processing"
        );
       
      }
    } catch (err) {
      console.error("Error in smart-search:", err);
      verifiedVideos = [];
    }
  } else {
    // Fetch videos for this region/country using our new function
    const { data: rawVideos, error } = await supabase.rpc(
      "get_videos_by_region",
      { region_param: regionName, tag_param: tag || null }
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

    // Filter verified videos after fetching to debug status
    verifiedVideos = videos.filter((video: VideoWithUser) => {
      return (
        video.status === "verified" ||
        video.status === "pending" ||
        video.status === "processing"
      );
    });
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#F0F2F5]">
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
            <LeftMenu id={resolvedParams.id}/>
            {/* Main Content Section */}
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
