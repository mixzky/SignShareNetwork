"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser } from "@/lib/supabase";

export default function UserVideoList() {
  const [user, setUser] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  // Fetch all videos only once
  useEffect(() => {
    const supabase = createClient();
    async function fetchUserAndVideos() {
      setLoading(true);
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
    }
    fetchUserAndVideos();
  }, []);

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

  // Helper to get public video URL
  const getPublicUrl = (video_url: string) => {
    if (!video_url) return "";
    const supabase = createClient();
    const [bucket, ...pathParts] = video_url.split("/");
    const path = pathParts.join("/");
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

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
              onClick={() => {
                // Replace with your navigation or modal logic
                // Example: router.push(`/dashboard/video/${video.id}`)
                alert(`Clicked video: ${video.title}`);
              }}
            >
              <div className="w-full flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/5 max-h-36 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#f9fafb] to-[#e9ecef] shadow-inner border border-[#e0e3ea] overflow-hidden">
                  <video
                    src={getPublicUrl(video.video_url)}
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
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                          video.status === "verified"
                            ? "bg-[#e6fcf3] text-[#00b894]"
                            : video.status === "pending"
                            ? "bg-[#fffbe6] text-[#ffb300]"
                            : "bg-[#ffeaea] text-[#ff6b6b]"
                        }`}
                      >
                        {video.status.charAt(0).toUpperCase() +
                          video.status.slice(1)}
                      </span>
                      <span className="text-[#6c63ff] text-xs font-semibold">
                        <ReviewsCount videoId={video.id} />
                      </span>
                      <span className="text-[#b0b6c1] text-xs font-medium italic">
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component to fetch and show reviews count
function ReviewsCount({ videoId }: { videoId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function fetchCount() {
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
