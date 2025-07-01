"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TopMenu from "@/components/TopMenu";
import { Volume2, VolumeX, Maximize2 } from "lucide-react";
import {
  getSupabaseClient,
  getPublicVideoUrl,
  getStatusColor,
} from "@/lib/supabase";

interface VideoState {
  url: string;
  isMuted: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
}

type VideoStates = {
  [key: string]: VideoState;
};

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: "pending" | "verified" | "flagged" | "processing" | "rejected";
  user: {
    id: string;
    display_name: string;
    email: string;
  };
  created_at: string;
};

type User = {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "moderator" | "admin";
  banned: boolean;
  created_at: string;
};

export default function AdminDashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<"admin" | "moderator" | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoStates, setVideoStates] = useState<VideoStates>({});
  const supabase = createClient();

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const videoContainerRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  const fetchVideos = async () => {
    try {
      const { data: videosData, error: videosError } = await supabase
        .from("sign_videos")
        .select(
          `
          id,
          title,
          description,
          video_url,
          status,
          created_at,
          user:users!user_id (
            id,
            display_name,
            email
          )
        `
        )
        .eq("status", "processing")
        .order("created_at", { ascending: false });

      if (videosError) throw videosError;

      const mappedVideos =
        videosData?.map((video) => ({
          ...video,
          user: Array.isArray(video.user) ? video.user[0] : video.user,
        })) || [];

      // Initialize video states for new videos
      const newVideoStates = { ...videoStates };
      for (const video of mappedVideos) {
        if (!newVideoStates[video.id]) {
          newVideoStates[video.id] = {
            url: getPublicVideoUrl(video.video_url),
            isMuted: true,
            isPlaying: false,
            isFullscreen: false,
          };
        }
      }
      setVideoStates(newVideoStates);
      setVideos(mappedVideos as Video[]);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user's role
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;
        setUserRole(userData.role as "admin" | "moderator");

        // Fetch initial data
        await Promise.all([
          fetchVideos(),
          userData.role === "admin" ? fetchUsers() : Promise.resolve(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

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

    const usersSubscription = supabase
      .channel("users_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          if (userRole === "admin") {
            fetchUsers();
          }
        }
      )
      .subscribe();

    return () => {
      videosSubscription.unsubscribe();
      usersSubscription.unsubscribe();
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

      // Get the current video status first
      const { data: currentVideo, error: videoFetchError } = await supabase
        .from("sign_videos")
        .select("status")
        .eq("id", videoId)
        .single();

      if (videoFetchError) {
        console.error("Error fetching video:", videoFetchError);
        toast.error("Failed to fetch video status");
        return;
      }

      if (!currentVideo) {
        toast.error("Video not found");
        return;
      }

      console.log("Current video status:", currentVideo.status);
      console.log(
        "Attempting to update video to:",
        action === "approve" ? "verified" : "rejected"
      );

      // Update the video status
      const { error: updateError } = await supabase
        .from("sign_videos")
        .update({
          status: action === "approve" ? "verified" : "rejected",
        })
        .eq("id", videoId);

      if (updateError) {
        console.error("Error updating video status:", updateError);
        toast.error("Failed to update video status. Please try again.");
        return;
      }

      toast.success(
        `Video ${action === "approve" ? "approved" : "rejected"} successfully`
      );

      // Verify the update was successful
      const { data: updatedVideo, error: verifyError } = await supabase
        .from("sign_videos")
        .select("status")
        .eq("id", videoId)
        .single();

      if (verifyError || !updatedVideo) {
        console.error("Error verifying update:", verifyError);
      } else {
        console.log("New video status:", updatedVideo.status);
      }

      // Fetch updated videos list
      await fetchVideos();
    } catch (error) {
      console.error("Error in handleVideoAction:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleUserBan = async (userId: string, currentBanStatus: boolean) => {
    if (userRole !== "admin") {
      toast.error("Only administrators can ban users");
      return;
    }

    try {
      // Update user's ban status
      const { error: banError } = await supabase
        .from("users")
        .update({ banned: !currentBanStatus })
        .eq("id", userId);

      if (banError) throw banError;

      // If banning, also reject all pending videos from this user
      if (!currentBanStatus) {
        const { error: videoError } = await supabase
          .from("sign_videos")
          .update({ status: "rejected" })
          .eq("user_id", userId)
          .eq("status", "processing");

        if (videoError) throw videoError;
      }

      toast.success(
        `User ${currentBanStatus ? "unbanned" : "banned"} successfully`
      );

      // Fetch updated data
      await Promise.all([fetchUsers(), fetchVideos()]);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user status");
    }
  };

  // Video player functions
  const togglePlay = (videoId: string) => {
    const videoRef = videoRefs.current[videoId];
    const currentState = videoStates[videoId];
    if (videoRef && currentState) {
      if (currentState.isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
        // Automatically unmute when playing
        if (currentState.isMuted) {
          videoRef.muted = false;
          setVideoStates((prev) => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              isMuted: false,
            },
          }));
        }
      }
      setVideoStates((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isPlaying: !currentState.isPlaying,
        },
      }));
    }
  };

  const toggleMute = (videoId: string) => {
    const videoRef = videoRefs.current[videoId];
    const currentState = videoStates[videoId];
    if (videoRef && currentState) {
      videoRef.muted = !currentState.isMuted;
      setVideoStates((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isMuted: !currentState.isMuted,
        },
      }));
    }
  };

  const toggleFullscreen = async (videoId: string) => {
    const containerRef = videoContainerRefs.current[videoId];
    const currentState = videoStates[videoId];
    if (!containerRef || !currentState) return;

    try {
      if (!currentState.isFullscreen) {
        if (containerRef.requestFullscreen) {
          await containerRef.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
      setVideoStates((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isFullscreen: !currentState.isFullscreen,
        },
      }));
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setVideoStates((prev) => {
        const newStates = { ...prev };
        let changed = false;
        for (const videoId in newStates) {
          if (
            newStates[videoId].isFullscreen !== !!document.fullscreenElement
          ) {
            newStates[videoId] = {
              ...newStates[videoId],
              isFullscreen: !!document.fullscreenElement,
            };
            changed = true;
          }
        }
        return changed ? newStates : prev;
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-6 shadow-sm"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-md border">
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                      <div className="aspect-video bg-slate-200 rounded-lg mb-2"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                        <div className="h-8 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border">
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-slate-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 rounded-xl">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 leading-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-slate-600 text-base ml-11">
            Manage video submissions and user accounts
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Video Verification Panel */}
          <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <svg
                      className="w-4 h-4 text-blue-600"
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
                  <span className="text-lg font-bold text-slate-800">
                    Video Verification
                  </span>
                </div>
                <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs font-semibold">
                  {videos.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {videos.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <div className="p-2 bg-slate-200 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
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
                  <h3 className="text-base font-semibold text-slate-600 mb-1">
                    No Pending Videos
                  </h3>
                  <p className="text-sm text-slate-500">
                    All videos have been reviewed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-white hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base text-slate-800 mb-1 leading-tight">
                            {video.title}
                          </h3>
                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                            {video.description}
                          </p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2">
                          Pending
                        </span>
                      </div>

                      {/* Video Player */}
                      <div
                        ref={(el) => {
                          if (el) videoContainerRefs.current[video.id] = el;
                        }}
                        className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mb-3 ring-1 ring-slate-300"
                      >
                        {videoStates[video.id]?.url && (
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current[video.id] = el;
                            }}
                            className="absolute top-0 left-0 w-full h-full object-contain cursor-pointer"
                            src={videoStates[video.id].url}
                            muted={videoStates[video.id].isMuted}
                            loop
                            playsInline
                            onClick={() => togglePlay(video.id)}
                          />
                        )}
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="bg-slate-900/80 hover:bg-blue-600 text-white rounded-md shadow-md cursor-pointer backdrop-blur-sm border-0 h-8 w-8"
                            onClick={() => toggleMute(video.id)}
                          >
                            {videoStates[video.id]?.isMuted ? (
                              <VolumeX className="w-3 h-3" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="bg-slate-900/80 hover:bg-slate-700 text-white rounded-md shadow-md cursor-pointer backdrop-blur-sm border-0 h-8 w-8"
                            onClick={() => toggleFullscreen(video.id)}
                          >
                            <Maximize2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-700 font-medium">
                            {video.user.display_name} •{" "}
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVideoAction(video.id, "approve")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                        >
                          <svg
                            className="w-3 h-3 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg py-2 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                        >
                          <svg
                            className="w-3 h-3 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Management Panel (Admin Only) */}
          {userRole === "admin" && (
            <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-lg font-bold text-slate-800">
                      User Management
                    </span>
                  </div>
                  <span className="bg-purple-100 text-purple-700 rounded-full px-2 py-1 text-xs font-semibold">
                    {users.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-white hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base text-slate-800">
                              {user.display_name}
                            </h3>
                            <div className="flex gap-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : user.role === "moderator"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {user.role.toUpperCase()}
                              </span>
                              {user.banned && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                  BANNED
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-600 text-xs mb-1">
                            {user.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            Joined{" "}
                            {new Date(user.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                        {user.role !== "admin" && (
                          <Button
                            onClick={() => handleUserBan(user.id, user.banned)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                              user.banned
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                          >
                            {user.banned ? (
                              <>
                                <svg
                                  className="w-3 h-3 mr-1 inline"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                  />
                                </svg>
                                Unban
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-3 h-3 mr-1 inline"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                                  />
                                </svg>
                                Ban
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
