"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "@/lib/supabase";
import { get } from "http";

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

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserAndStats() {
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
            .eq("isFlag", true);
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
      }
    }

    fetchUserAndStats();
    console.log("User stats fetched:", stats);
  }, []);

  useEffect(() => {
    if (stats.topView.video_url) {
      const supabase = createClient();
      const [bucket, ...pathParts] = stats.topView.video_url.split("/");
      const path = pathParts.join("/");
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setTopVideoUrl(data.publicUrl);
    } else {
      setTopVideoUrl("");
    }
  }, [stats.topView.video_url]);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-full max-w-sm">
        <span className="text-gray-400 text-lg font-medium">
          Loading user stats...
        </span>
      </div>
    );
  }
  console.log("User stats:", stats);
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center w-full max-w-2xl transition-all duration-300 border border-[#e0e7ef]">
      <h2 className="text-3xl font-extrabold mb-8 text-[#0a0e18] tracking-tight drop-shadow-sm">
        User Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full mb-8">
        <div className="flex flex-col items-center">
          <span
            className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1"
            style={{ color: "#7EE787" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#7EE787"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12"
              />
            </svg>
            Total Videos
          </span>
          <span
            className="text-4xl font-extrabold"
            style={{ color: "#7EE787" }}
          >
            {stats.videosCount}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1"
            style={{ color: "#A5D8FF" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#A5D8FF"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#A5D8FF"
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
          <span
            className="text-4xl font-extrabold"
            style={{ color: "#A5D8FF" }}
          >
            {stats.verifiedVideosCount}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1"
            style={{ color: "#D0BFFF" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#D0BFFF"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87V4m0 0L8 8m4-4l4 4"
              />
            </svg>
            Total Reviews
          </span>
          <span
            className="text-4xl font-extrabold"
            style={{ color: "#D0BFFF" }}
          >
            {stats.reviewsCount}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1"
            style={{ color: "#FFB3C6" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#FFB3C6"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414 1.414M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Flagged Videos
          </span>
          <span
            className="text-4xl font-extrabold"
            style={{ color: "#FFB3C6" }}
          >
            {stats.flagsCount}
          </span>
        </div>
      </div>
      <div className="mt-4 w-full">
        <h3 className="text-xl font-semibold mb-3 text-[#0a0e18] flex items-center gap-2">
          <svg
            className="w-6 h-6 text-[#7EE787]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v8m0 0l-3-3m3 3l3-3M4 6h16"
            />
          </svg>
          Top Video by Comments
        </h3>
        <div className="bg-gradient-to-r from-[#e0f7fa] via-[#f3e8ff] to-[#ffe0f0] rounded-2xl p-6 flex flex-col items-start shadow-inner border border-[#e0e7ef]">
          {topVideoUrl ? (
            <video
              src={topVideoUrl}
              controls
              className="w-full max-w-xs rounded-lg mb-3"
              style={{ background: "#eee" }}
            />
          ) : null}
          <h4 className="font-bold text-lg text-[#0a0e18] truncate w-full">
            {stats.topView.title || "No videos yet"}
          </h4>
          <p className="text-gray-600 text-base mt-2">
            {stats.topView.views} comment{stats.topView.views === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}
