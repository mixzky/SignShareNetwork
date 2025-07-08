"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser, getPublicVideoUrl } from "@/lib/supabase";
import { get } from "http";

// Screen reader only CSS
const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

export default function UserStats() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    videosCount: 0,
    verifiedVideosCount: 0,
    reviewsCount: 0,
    flagsCount: 0,
    topView: { title: "", views: 0, video_url: "" },
  });
  const [topVideoUrl, setTopVideoUrl] = useState<string>("");
  const [announcement, setAnnouncement] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Function to make announcements for screen readers
  const makeAnnouncement = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 3000);
  };

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserAndStats() {
      setIsLoading(true);
      makeAnnouncement("Loading user statistics...");

      const user = await getCurrentUser();
      setUser(user);
      console.log("Fetched user:", user);
      if (user) {
        async function getUserVideoCount(userId: string) {
          const { count } = await supabase
            .from("sign_videos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          return count ?? 0;
        }

        const videos = await getUserVideoCount(user.id);

        async function getUserVerifiedVideoCount(userId: string) {
          const { count } = await supabase
            .from("sign_videos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "verified");
          return count ?? 0;
        }

        const verifiedVideos = await getUserVerifiedVideoCount(user.id);

        async function getUserReviewCount(userId: string) {
          const { count } = await supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          return count ?? 0;
        }

        const reviews = await getUserReviewCount(user.id);

        async function getUserFlaggedVideoCount(userId: string) {
          const { count } = await supabase
            .from("sign_videos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("isflag", true);
          return count ?? 0;
        }

        const flags = await getUserFlaggedVideoCount(user.id);

        async function getUserTopCommentedVideo(userId: string) {
          const { data: videos } = await supabase
            .from("sign_videos")
            .select("id, title, video_url")
            .eq("user_id", userId);

          if (!videos || videos.length === 0)
            return { title: "", views: 0, video_url: "" };

          let top = { title: "", views: 0, video_url: "" };
          for (const video of videos) {
            const { count } = await supabase
              .from("reviews")
              .select("id", { count: "exact", head: true })
              .eq("video_id", video.id);
            if ((count ?? 0) > top.views) {
              top = {
                title: video.title,
                views: count ?? 0,
                video_url: video.video_url,
              };
            }
          }
          return top;
        }

        const topView = await getUserTopCommentedVideo(user.id);

        setStats({
          videosCount: videos,
          verifiedVideosCount: verifiedVideos,
          reviewsCount: reviews,
          flagsCount: flags,
          topView: topView,
        });

        setIsLoading(false);
        makeAnnouncement(
          `Statistics loaded: ${videos} total videos, ${verifiedVideos} verified, ${reviews} reviews, ${flags} flagged.`
        );
      } else {
        setIsLoading(false);
        makeAnnouncement("Unable to load user statistics. Please log in.");
      }
    }

    fetchUserAndStats();
    console.log("User stats fetched:", stats);
  }, []);

  useEffect(() => {
    if (stats.topView.video_url) {
      setTopVideoUrl(getPublicVideoUrl(stats.topView.video_url));
    } else {
      setTopVideoUrl("");
    }
  }, [stats.topView.video_url]);

  if (!user || isLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: srOnlyStyles }} />
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
        <div
          className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-full max-w-sm"
          role="status"
          aria-label="Loading user statistics"
        >
          <span className="text-gray-400 text-lg font-medium">
            Loading user stats...
          </span>
        </div>
      </>
    );
  }
  console.log("User stats:", stats);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: srOnlyStyles }} />
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div
        className="bg-white rounded-2xl shadow p-6 flex flex-col items-center w-full max-w-1/2 min-h-[416px] max-h-[416px] border border-[#e0e3ea]"
        role="region"
        aria-label="User statistics dashboard"
      >
        <h2 className="text-2xl font-extrabold mb-6 text-[#2d2d2d] tracking-tight">
          User Statistics
        </h2>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-6"
          role="group"
          aria-label="Statistics overview"
        >
          <div
            className="flex flex-col items-center border rounded-xl border-[#e0e3ea] bg-white p-3 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="article"
            aria-label={`Total videos: ${stats.videosCount}`}
            tabIndex={0}
          >
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide mb-1 text-[#ffb300] font-semibold">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="#ffb300"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12"
                />
              </svg>
              Total Videos
            </span>
            <span className="text-2xl font-extrabold text-[#ffb300]">
              {stats.videosCount}
            </span>
            <span className="sr-only">
              You have uploaded {stats.videosCount} videos in total
            </span>
          </div>

          <div
            className="flex flex-col items-center border rounded-xl border-[#e0e3ea] bg-white p-3 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="article"
            aria-label={`Verified videos: ${stats.verifiedVideosCount}`}
            tabIndex={0}
          >
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide mb-1 text-[#00b894] font-semibold">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="#00b894"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#00b894"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12l2 2 4-4"
                />
              </svg>
              Verified Videos
            </span>
            <span className="text-2xl font-extrabold text-[#00b894]">
              {stats.verifiedVideosCount}
            </span>
            <span className="sr-only">
              {stats.verifiedVideosCount} of your videos have been verified
            </span>
          </div>

          <div
            className="flex flex-col items-center border rounded-xl border-[#e0e3ea] bg-white p-3 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="article"
            aria-label={`Total reviews: ${stats.reviewsCount}`}
            tabIndex={0}
          >
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide mb-1 text-[#6c63ff] font-semibold">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="#6c63ff"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87V4m0 0L8 8m4-4l4 4"
                />
              </svg>
              Total Reviews
            </span>
            <span className="text-2xl font-extrabold text-[#6c63ff]">
              {stats.reviewsCount}
            </span>
            <span className="sr-only">
              You have written {stats.reviewsCount} reviews
            </span>
          </div>

          <div
            className="flex flex-col items-center border rounded-xl border-[#e0e3ea] bg-white p-3 hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="article"
            aria-label={`Flagged videos: ${stats.flagsCount}`}
            tabIndex={0}
          >
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide mb-1 text-[#ff6b6b] font-semibold">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="#ff6b6b"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Flagged Videos
            </span>
            <span className="text-2xl font-extrabold text-[#ff6b6b]">
              {stats.flagsCount}
            </span>
            <span className="sr-only">
              {stats.flagsCount} of your videos have been flagged
            </span>
          </div>
        </div>

        <div className="mt-2 w-full">
          <h3
            className="text-lg font-semibold mb-3 text-[#2d2d2d] flex items-center gap-2"
            id="top-video-heading"
          >
            <svg
              className="w-5 h-5 text-[#e9b949]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v8m0 0l-3-3m3 3l3-3M4 6h16"
              />
            </svg>
            Top Video by Comments
          </h3>

          <div
            className="bg-[#f8fafc] border border-[#e0e3ea] rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-inner transition-all duration-300"
            role="article"
            aria-labelledby="top-video-heading"
            aria-describedby="top-video-description"
          >
            {topVideoUrl ? (
              <video
                src={topVideoUrl}
                controls
                className="w-full max-w-[180px] max-h-28 rounded-lg mb-2 md:mb-0 md:mr-4 shadow border border-[#e0e3ea] bg-[#f3f3f3] transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: "#f3f3f3" }}
                aria-label={`Video preview for ${
                  stats.topView.title || "your top video"
                }`}
              />
            ) : (
              <div
                className="w-full max-w-[180px] max-h-28 flex items-center justify-center rounded-lg bg-[#f0f2f5] text-[#bdbdbd] mb-2 md:mb-0 md:mr-4 border border-[#e0e3ea]"
                role="img"
                aria-label="No video preview available"
              >
                No preview
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center w-full">
              <h4 className="font-bold text-lg text-[#2d2d2d] truncate w-full mb-1">
                {stats.topView.title || "No videos yet"}
              </h4>
              <p
                className="text-[#7c5e2e] text-base"
                id="top-video-description"
              >
                {stats.topView.views} comment
                {stats.topView.views === 1 ? "" : "s"}
              </p>
              <span className="sr-only">
                {stats.topView.title
                  ? `Your most commented video is "${stats.topView.title}" with ${stats.topView.views} comments`
                  : "You haven't uploaded any videos yet"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
