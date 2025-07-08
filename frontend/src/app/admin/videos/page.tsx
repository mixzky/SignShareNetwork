"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Filter } from "lucide-react";
import { getPublicVideoUrl, getStatusColor, formatDate } from "@/lib/supabase";

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: "pending" | "verified" | "flagged" | "processing" | "rejected";
  region: string;
  user: {
    id: string;
    display_name: string;
    email: string;
  };
  created_at: string;
  flags?: {
    reason: string;
    created_at: string;
  }[];
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Video["status"] | "all">(
    "all"
  );
  const [videoStates, setVideoStates] = useState<{
    [key: string]: {
      url: string;
      isMuted: boolean;
      isPlaying: boolean;
    };
  }>({});
  const supabase = createClient();

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from("sign_videos")
        .select(
          `
          id,
          title,
          description,
          video_url,
          status,
          region,
          created_at,
          user:users!inner (
            id,
            display_name,
            email
          ),
          flags (
            id,
            reason,
            created_at
          )
        `
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: videosData, error: videosError } = await query;

      if (videosError) {
        console.error("Supabase query error:", videosError);
        throw videosError;
      }

      if (!videosData) {
        console.error("No data returned from query");
        throw new Error("No data returned from query");
      }

      const mappedVideos = videosData.map((video) => ({
        ...video,
        user: Array.isArray(video.user) ? video.user[0] : video.user,
        flags: Array.isArray(video.flags) ? video.flags : [],
      }));

      // Initialize video states for new videos
      const newVideoStates = { ...videoStates };
      for (const video of mappedVideos) {
        if (!newVideoStates[video.id]) {
          try {
            newVideoStates[video.id] = {
              url: getPublicVideoUrl(video.video_url),
              isMuted: true,
              isPlaying: false,
            };
          } catch (error) {
            console.error(
              `Error getting public URL for video ${video.id}:`,
              error
            );
          }
        }
      }
      setVideoStates(newVideoStates);

      // Filter videos by search query
      const filteredVideos = searchQuery
        ? mappedVideos.filter(
            (video) =>
              video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              video.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              video.user?.display_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              video.region?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mappedVideos;

      setVideos(filteredVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error(
        "Failed to load videos. Please check the console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [statusFilter]); // Refetch when status filter changes

  useEffect(() => {
    // Set up real-time subscriptions
    const videosSubscription = supabase
      .channel("sign_videos_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sign_videos" },
        () => {
          fetchVideos();
        }
      )
      .subscribe();

    return () => {
      videosSubscription.unsubscribe();
    };
  }, []);

  const handleVideoAction = async (
    videoId: string,
    action: "approve" | "reject"
  ) => {
    try {
      // First verify that the user has the correct role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user role:", userError);
        toast.error("Failed to verify user permissions");
        return;
      }

      if (
        !userData ||
        (userData.role !== "admin" && userData.role !== "moderator")
      ) {
        toast.error("You do not have permission to perform this action");
        return;
      }

      const { error: updateError } = await supabase
        .from("sign_videos")
        .update({
          status: action === "approve" ? "verified" : "rejected",
        })
        .eq("id", videoId);

      if (updateError) {
        console.error("Error updating video status:", updateError);
        toast.error("Failed to update video status");
        return;
      }

      toast.success(
        `Video ${action === "approve" ? "approved" : "rejected"} successfully`
      );
      await fetchVideos();
    } catch (error) {
      console.error("Error in handleVideoAction:", error);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-1/3 mb-6"></div>
          <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200">
            <div className="h-5 bg-slate-200 rounded-lg w-1/4 mb-4"></div>
            <div className="flex gap-4">
              <div className="h-9 bg-slate-200 rounded-lg flex-1"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-16 bg-slate-200 rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                <div className="flex gap-4">
                  <div className="w-48 h-28 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded-lg w-full"></div>
                    <div className="h-4 bg-slate-200 rounded-lg w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6" role="banner">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl shadow-sm" aria-hidden="true">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Video Management
            </h1>
          </div>
          <p className="text-slate-600 text-sm ml-10" id="page-description">
            Review and manage video submissions
          </p>
        </div>

        {/* Filters and Search */}
        <div 
          className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-200"
          role="search"
          aria-label="Video search and filters"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search-videos" className="block text-xs font-medium text-slate-700 mb-1">
                Search Videos
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" aria-hidden="true" />
                <Input
                  id="search-videos"
                  type="search"
                  placeholder="Search by title, description, uploader, or region..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Debounce search
                    const timeoutId = setTimeout(() => fetchVideos(), 500);
                    return () => clearTimeout(timeoutId);
                  }}
                  className="pl-10 h-9 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  aria-label="Search videos"
                />
              </div>
            </div>
            <div role="group" aria-label="Filter videos by status">
              <label id="status-filter-label" className="block text-xs font-medium text-slate-700 mb-1">
                Filter by Status
              </label>
              <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2" aria-labelledby="status-filter-label">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className={`h-9 px-3 rounded-lg font-medium transition-all duration-200 text-xs cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  All Videos
                </Button>
                <Button
                  variant={
                    statusFilter === "processing" ? "default" : "outline"
                  }
                  onClick={() => setStatusFilter("processing")}
                  className={`h-9 px-3 rounded-lg font-medium transition-all duration-200 text-xs cursor-pointer ${
                    statusFilter === "processing"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600"
                  }`}
                >
                  Processing
                </Button>
                <Button
                  variant={statusFilter === "flagged" ? "default" : "outline"}
                  onClick={() => setStatusFilter("flagged")}
                  className={`h-9 px-3 rounded-lg font-medium transition-all duration-200 text-xs cursor-pointer ${
                    statusFilter === "flagged"
                      ? "bg-red-600 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600"
                  }`}
                >
                  Flagged
                </Button>
                <Button
                  variant={statusFilter === "rejected" ? "default" : "outline"}
                  onClick={() => setStatusFilter("rejected")}
                  className={`h-9 px-3 rounded-lg font-medium transition-all duration-200 text-xs cursor-pointer ${
                    statusFilter === "rejected"
                      ? "bg-slate-600 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-600"
                  }`}
                >
                  Rejected
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="space-y-3" role="region" aria-label="Video list">
          {videos.length === 0 ? (
            <div 
              className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-sm"
              role="status"
              aria-label="No videos found"
            >
              <div className="p-3 bg-slate-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center" aria-hidden="true">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                No Videos Found
              </h3>
              <p className="text-slate-500 text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            videos.map((video) => (
              <Card
                key={video.id}
                className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden"
                role="article"
                aria-labelledby={`video-title-${video.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Video Preview */}
                    <div className="w-full lg:w-48 h-28 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                      {videoStates[video.id]?.url ? (
                        <video
                          src={videoStates[video.id].url}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                          aria-label={`Preview of video: ${video.title}`}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          role="img"
                          aria-label="Video preview not available"
                        >
                          <svg
                            className="w-6 h-6 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293L16 15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10h6"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 
                            id={`video-title-${video.id}`}
                            className="font-bold text-base text-slate-800 mb-1 leading-tight"
                          >
                            {video.title}
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                            {video.description}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap self-start ${getStatusColor(
                            video.status
                          )}`}
                          role="status"
                        >
                          {video.status.charAt(0).toUpperCase() +
                            video.status.slice(1)}
                        </span>
                      </div>

                      <div 
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                        role="list"
                        aria-label="Video details"
                      >
                        <div 
                          className="bg-blue-50 p-2 rounded-lg border border-blue-100"
                          role="listitem"
                        >
                          <p className="text-xs font-medium text-blue-600 mb-1">
                            Uploader
                          </p>
                          <p className="font-semibold text-slate-800 truncate text-xs">
                            {video.user.display_name}
                          </p>
                        </div>
                        <div 
                          className="bg-emerald-50 p-2 rounded-lg border border-emerald-100"
                          role="listitem"
                        >
                          <p className="text-xs font-medium text-emerald-600 mb-1">
                            Region
                          </p>
                          <p className="font-semibold text-slate-800 text-xs">
                            {video.region}
                          </p>
                        </div>
                        <div 
                          className="bg-purple-50 p-2 rounded-lg border border-purple-100"
                          role="listitem"
                        >
                          <p className="text-xs font-medium text-purple-600 mb-1">
                            Uploaded
                          </p>
                          <p className="font-semibold text-slate-800 text-xs">
                            <time dateTime={video.created_at}>
                              {formatDate(video.created_at)}
                            </time>
                          </p>
                        </div>
                      </div>

                      {video.flags && video.flags.length > 0 && (
                        <div 
                          className="bg-red-50 p-3 rounded-lg border border-red-200"
                          role="region"
                          aria-label={`${video.flags.length} Flag${video.flags.length > 1 ? 's' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <svg
                              className="w-4 h-4 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            <p className="font-medium text-red-700 text-xs">
                              {video.flags.length} Flag
                              {video.flags.length > 1 ? "s" : ""} Reported
                            </p>
                          </div>
                          <ul className="space-y-1" role="list">
                            {video.flags.map((flag, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                                role="listitem"
                              >
                                <span className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0" aria-hidden="true"></span>
                                <span className="text-red-700 text-xs">
                                  {flag.reason}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {video.status === "processing" && (
                        <div 
                          className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200"
                          role="group"
                          aria-label="Video actions"
                        >
                          <Button
                            onClick={() => handleVideoAction(video.id, "approve")}
                            className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 text-xs cursor-pointer"
                            aria-label={`Approve video: ${video.title}`}
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVideoAction(video.id, "reject")}
                            className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 text-xs cursor-pointer"
                            aria-label={`Reject video: ${video.title}`}
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
