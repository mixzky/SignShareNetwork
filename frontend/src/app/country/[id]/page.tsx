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

export default async function CountryPage({ params, searchParams }: any) {
  const supabase = await createClient();
  const resolvedParams =
    typeof params.then === "function" ? await params : params;
  const resolvedSearchParamsObj =
    typeof searchParams?.then === "function"
      ? await searchParams
      : searchParams;

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
      }>("smart-search", {
        body: JSON.stringify({
          query: searchQuery,
          region: regionName,
          limit: 20,
        }),
      });

      if (error || !data || "error" in data) {
        verifiedVideos = [];
      } else {
        const transformedResults = data.results.map(
          (result: any): SearchResult => ({
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
              role: result.user?.role || "user",
            },
          })
        );

        console.log("Transformed Results:", transformedResults);
        verifiedVideos = (transformedResults || []).filter(
          (video: SearchResult) => video.status === "verified"
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
      return video.status === "verified";
    });
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#F0F2F5]">
      {/* Screen reader announcement for page context */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        You are now viewing {regionName}. This page displays sign language
        videos from {regionName}. Use Tab to navigate through the upload
        section, trending tags, popular countries, and video content.
      </div>

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Top Menu */}
      <header
        className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] shadow-md h-24 flex items-center"
        role="banner"
      >
        <CountryTopMenu />
      </header>

      {/* Country Content */}
      <Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            className="flex justify-center items-center p-8"
          >
            <span className="sr-only">Loading country information...</span>
            <div>Loading...</div>
          </div>
        }
      >
        <CountryContent id={regionName} />
      </Suspense>

      {/* Videos Section with Side Menus */}
      <div className="flex w-full justify-center">
        <div className="flex-1 w-full flex flex-col items-center pt-10">
          <div className="flex w-full max-w-8/12">
            {/* Left Menu */}
            <aside
              role="complementary"
              aria-label="Navigation and trending content"
            >
              <LeftMenu id={resolvedParams.id} />
            </aside>
            {/* Main Content Section */}
            <section
              id="main-content"
              className="flex-1 flex flex-col items-center pl-8"
              role="main"
              aria-label={`Sign language videos from ${regionName}`}
            >
              <div className="w-full">
                <h2 className="sr-only">Videos from {regionName}</h2>
                <div
                  role="status"
                  aria-live="polite"
                  className="sr-only"
                  aria-atomic="true"
                >
                  {verifiedVideos.length === 0
                    ? `No videos found for ${regionName}${
                        searchQuery ? ` matching "${searchQuery}"` : ""
                      }${tag ? ` with tag "${tag}"` : ""}.`
                    : `Displaying ${verifiedVideos.length} video${
                        verifiedVideos.length !== 1 ? "s" : ""
                      } from ${regionName}${
                        searchQuery ? ` matching "${searchQuery}"` : ""
                      }${tag ? ` with tag "${tag}"` : ""}.`}
                </div>
                {verifiedVideos.length === 0 ? (
                  <div
                    className="text-center py-8 text-gray-500"
                    role="status"
                    aria-label="No videos available"
                  >
                    <p>No videos found for this region.</p>
                    {searchQuery && (
                      <p className="mt-2">Try adjusting your search terms.</p>
                    )}
                    {tag && (
                      <p className="mt-2">Try removing the tag filter.</p>
                    )}
                  </div>
                ) : (
                  verifiedVideos.map((video: VideoWithUser, index: number) => (
                    <div key={video.id} className="mb-6">
                      <VideoCard video={video} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
