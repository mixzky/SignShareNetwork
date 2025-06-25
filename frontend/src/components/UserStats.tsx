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
    <div className="bg-white rounded-3xl shadow-md p-12 flex flex-col items-center w-full max-w-5xl min-w-[75vw] border border-[#e0e3ea]">
      <h2 className="text-4xl font-extrabold mb-10 text-[#2d2d2d] tracking-tight">
        User Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full mb-10">
        <div className="flex flex-col items-center border rounded-2xl border-[#e0e3ea] bg-white p-6 hover:shadow-lg transition">
          <span className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1 text-[#ffb300] font-semibold">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#ffb300"
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
          <span className="text-4xl font-extrabold text-[#ffb300]">
            {stats.videosCount}
          </span>
        </div>
        <div className="flex flex-col items-center border rounded-2xl border-[#e0e3ea] bg-white p-6 hover:shadow-lg transition">
          <span className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1 text-[#00b894] font-semibold">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#00b894"
              strokeWidth={2}
              viewBox="0 0 24 24"
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
          <span className="text-4xl font-extrabold text-[#00b894]">
            {stats.verifiedVideosCount}
          </span>
        </div>
        <div className="flex flex-col items-center border rounded-2xl border-[#e0e3ea] bg-white p-6 hover:shadow-lg transition">
          <span className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1 text-[#6c63ff] font-semibold">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#6c63ff"
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
          <span className="text-4xl font-extrabold text-[#6c63ff]">
            {stats.reviewsCount}
          </span>
        </div>
        <div className="flex flex-col items-center border rounded-2xl border-[#e0e3ea] bg-white p-6 hover:shadow-lg transition">
          <span className="flex items-center gap-1 text-xs uppercase tracking-wide mb-1 text-[#ff6b6b] font-semibold">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="#ff6b6b"
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
          <span className="text-4xl font-extrabold text-[#ff6b6b]">
            {stats.flagsCount}
          </span>
        </div>
      </div>
      <div className="mt-4 w-full">
        <h3 className="text-2xl font-semibold mb-4 text-[#2d2d2d] flex items-center gap-2">
          <svg
            className="w-7 h-7 text-[#e9b949]"
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
        <div className="bg-[#f8fafc] border border-[#e0e3ea] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-inner transition-all duration-300">
          {topVideoUrl ? (
            <video
              src={topVideoUrl}
              controls
              className="w-full max-w-84 max-h-48 rounded-lg mb-3 md:mb-0 md:mr-8 shadow"
              style={{ background: "#f3f3f3" }}
            />
          ) : (
            <div className="w-full max-w-84 max-h-48 flex items-center justify-center rounded-lg bg-[#f0f2f5] text-[#bdbdbd] mb-3 md:mb-0 md:mr-8">
              No preview
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center w-full">
            <h4 className="font-bold text-2xl text-[#2d2d2d] truncate w-full mb-2">
              {stats.topView.title || "No videos yet"}
            </h4>
            <p className="text-[#7c5e2e] text-lg">
              {stats.topView.views} comment
              {stats.topView.views === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
