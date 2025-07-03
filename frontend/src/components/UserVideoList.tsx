"use client";
import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/lib/supabase";
import VideoManagement from "@/components/VideoManagement"; // Update the path to the correct location
import { useRouter } from "next/navigation";
import { getPublicVideoUrl } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";
import { getStatusColor } from "@/lib/supabase";
import { formatDate } from "@/lib/supabase";

export default function UserVideoList() {
  const [user, setUser] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const router = useRouter();

  // Move fetchUserAndVideos outside useEffect so you can call it anywhere
  const fetchUserAndVideos = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const user = await getCurrentUser();
    setUser(user);
    if (user) {
      const { data } = await supabase
        .from("sign_videos")
        .select("id, title, video_url, tags, status, created_at")
        .eq("user_id", user.id);
      setAllVideos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserAndVideos();
  }, [fetchUserAndVideos]);

  // Filter/sort on client only
  useEffect(() => {
    let filtered = [...allVideos];
    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((v: any) => v.status === filterStatus);
    }
    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter((v: any) => {
        if (typeof v.tags === "string") {
          return v.tags
            .split(",")
            .map((t: string) => t.trim())
            .includes(filterTag);
        }
        if (Array.isArray(v.tags)) {
          return v.tags.map((t: string) => t.trim()).includes(filterTag);
        }
        return false;
      });
    }
    // Filter by search
    if (search) {
      filtered = filtered.filter((v: any) =>
        v.title?.toLowerCase().includes(search.toLowerCase())
      );
    }
    // Sort
    if (sort === "newest") {
      filtered = filtered.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "oldest") {
      filtered = filtered.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "title") {
      filtered = filtered.sort((a: any, b: any) =>
        (a.title || "").localeCompare(b.title || "")
      );
    }
    setVideos(filtered);
  }, [allVideos, filterTag, filterStatus, search, sort]);

  // Unique tags and statuses for filter dropdowns
  const allTags = Array.from(
    new Set(
      allVideos.flatMap((v) => {
        if (typeof v.tags === "string") {
          return v.tags.split(",").map((t: string) => t.trim());
        }
        if (Array.isArray(v.tags)) {
          return v.tags.map((t: string) => t.trim());
        }
        return [];
      })
    )
  ).filter(Boolean);

  const allStatuses = Array.from(
    new Set(allVideos.map((v) => v.status))
  ).filter(Boolean);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-full max-w-sm">
        <span className="text-gray-400 text-lg font-medium">
          Loading videos...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-md p-12 flex flex-col items-center w-full max-w-5xl min-w-[75vw] border border-[#e0e3ea] mb-20">
      <h2 className="text-3xl font-extrabold mb-8 text-[#2d2d2d] tracking-tight">
        My Videos
      </h2>
      <div className="flex flex-wrap gap-4 mb-8 w-full items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#e0e3ea] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-[#f8fafc] text-[#1a2233] w-56 shadow-sm transition font-medium placeholder:italic placeholder:text-[#b0b6c1] cursor-text"
          />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="border border-[#e0e3ea] rounded-xl px-4 py-2 bg-[#f8fafc] text-[#1a2233] shadow-sm transition font-semibold focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
          >
            <option value="" className="text-[#b0b6c1] font-normal">
              All Tags
            </option>
            {allTags.map((tag) => (
              <option
                key={tag}
                value={tag}
                className="text-[#2563eb] font-semibold"
              >
                {tag}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-[#e0e3ea] rounded-xl px-4 py-2 bg-[#f8fafc] text-[#1a2233] shadow-sm transition font-semibold focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
          >
            <option value="" className="text-[#b0b6c1] font-normal">
              All Statuses
            </option>
            {allStatuses.map((status) => (
              <option
                key={status}
                value={status}
                className="text-[#2563eb] font-semibold"
              >
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-[#e0e3ea] rounded-xl px-4 py-2 bg-[#e6f0ff] text-[#2563eb] font-bold shadow-sm transition tracking-wide uppercase focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
          >
            <option
              value="newest"
              className="text-[#2563eb] bg-[#e6f0ff] font-bold"
            >
              Newest
            </option>
            <option
              value="oldest"
              className="text-[#2563eb] bg-[#e6f0ff] font-bold"
            >
              Oldest
            </option>
            <option
              value="title"
              className="text-[#2563eb] bg-[#e6f0ff] font-bold"
            >
              Title
            </option>
          </select>
        </div>
      </div>
      {/* Video List Container */}
      <div
        className="w-full max-w-7xl bg-[#f8fafc] rounded-2xl border border-[#e0e3ea] shadow-inner p-4"
        style={{ maxHeight: "500px", minHeight: "500px", overflowY: "auto" }} // About 3 cards tall
      >
        <div className="flex flex-col gap-8 w-full">
          {videos.length === 0 && (
            <div className="col-span-full text-center text-gray-400 text-lg">
              No videos found.
            </div>
          )}
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex flex-col bg-white border border-[#e0e3ea] rounded-xl p-4 gap-4 shadow hover:shadow-xl transition w-full max-w-full mx-auto cursor-pointer hover:bg-[#f6faff]"
              style={{ minHeight: "140px" }}
              onClick={() => setSelectedVideoId(video.id)}
            >
              <div className="w-full flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/5 max-h-36 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#f9fafb] to-[#e9ecef] shadow-inner border border-[#e0e3ea] overflow-hidden">
                  <video
                    src={getPublicVideoUrl(video.video_url)}
                    controls
                    className="w-full h-full rounded-lg "
                    style={{ background: "#f3f3f3", minHeight: "90px" }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[#1a2233] mb-1 truncate tracking-tight">
                      {video.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {video.tags &&
                        (typeof video.tags === "string"
                          ? video.tags.split(",").map((tag: string) => (
                              <span
                                key={tag}
                                className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                              >
                                #{tag.trim()}
                              </span>
                            ))
                          : Array.isArray(video.tags)
                          ? video.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                              >
                                #{tag.trim()}
                              </span>
                            ))
                          : null)}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* Status Icon */}
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(video.status)}`}
                      >
                        {video.status === "verified" && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="#00b894"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {video.status === "pending" && (
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
                              d="M12 8v4m0 4h.01"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#ffb300"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        )}
                        {video.status === "processing" && (
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#2563eb"
                              strokeWidth="2"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="#2563eb"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                            />
                          </svg>
                        )}
                        {video.status === "rejected" && (
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        {video.status.charAt(0).toUpperCase() +
                          video.status.slice(1)}
                      </span>
                      <span className="text-[#6c63ff] text-xs font-semibold">
                        <ReviewsCount videoId={video.id} />
                      </span>
                      <span className="text-[#b0b6c1] text-xs font-medium italic">
                        {formatDate(video.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Modal for VideoManagement */}
      {selectedVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative">
            <button
              className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-700 shadow-lg z-50"
              onClick={() => setSelectedVideoId(null)}
              aria-label="Close"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <VideoManagement
              videoId={selectedVideoId}
              publicUrl={getPublicVideoUrl(
                videos.find((v) => v.id === selectedVideoId)?.video_url || ""
              )}
              onAction={async () => {
                await fetchUserAndVideos();
                setSelectedVideoId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component to fetch and show reviews count
function ReviewsCount({ videoId }: { videoId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      const supabase = createClient();
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("video_id", videoId);
      setCount(count ?? 0);
    }
    fetchCount();
  }, [videoId]);

  return (
    <span>
      {count !== null ? `${count} review${count === 1 ? "" : "s"}` : "…"}
    </span>
  );
}
