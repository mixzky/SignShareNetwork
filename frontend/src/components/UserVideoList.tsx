"use client";
import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/lib/supabase";
import VideoManagement from "@/components/VideoManagement"; // Update the path to the correct location
import { useRouter } from "next/navigation";
import { getPublicVideoUrl } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/client";
import { getStatusColor } from "@/lib/supabase";
import { formatDate } from "@/lib/supabase";

// CSS for screen reader only content
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
  const [announcement, setAnnouncement] = useState<string>("");
  const router = useRouter();

  // Function to make announcements for screen readers
  const makeAnnouncement = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 3000);
  };

  // Focus management for modal
  useEffect(() => {
    if (selectedVideoId) {
      // Focus the first focusable element in the modal after a short delay
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const firstFocusable = modal.querySelector(
            'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);
    }
  }, [selectedVideoId]);

  // Move fetchUserAndVideos outside useEffect so you can call it anywhere
  const fetchUserAndVideos = useCallback(async () => {
    setLoading(true);
    makeAnnouncement("Loading your videos...");
    const supabase = createClient();
    const user = await getCurrentUser();
    setUser(user);
    if (user) {
      const { data } = await supabase
        .from("sign_videos")
        .select("id, title, video_url, tags, status, created_at")
        .eq("user_id", user.id);
      setAllVideos(data || []);
      makeAnnouncement(`Loaded ${data?.length || 0} videos successfully`);
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
      <>
        <style dangerouslySetInnerHTML={{ __html: srOnlyStyles }} />
        <div
          className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-full max-w-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading videos"
        >
          <span className="text-gray-400 text-lg font-medium">
            Loading videos...
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: srOnlyStyles }} />
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div
        className="bg-white rounded-3xl shadow-md p-12 flex flex-col items-center w-full max-w-5xl min-w-[75vw] border border-[#e0e3ea] mb-20"
        role="main"
        aria-label="My videos dashboard"
      >
        <h2 className="text-3xl font-extrabold mb-8 text-[#2d2d2d] tracking-tight">
          My Videos
        </h2>

        {/* Filters and Controls */}
        <div
          className="flex flex-wrap gap-4 mb-8 w-full items-center justify-between"
          role="region"
          aria-label="Video filters and search"
        >
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="video-search" className="sr-only">
                Search videos by title
              </label>
              <input
                id="video-search"
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  makeAnnouncement(
                    e.target.value
                      ? `Searching for: ${e.target.value}`
                      : "Search cleared"
                  );
                }}
                className="border border-[#e0e3ea] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-[#f8fafc] text-[#1a2233] w-56 shadow-sm transition font-medium placeholder:italic placeholder:text-[#b0b6c1] cursor-text"
                aria-describedby="search-help"
              />
              <div id="search-help" className="sr-only">
                Type to search your videos by title
              </div>
            </div>

            <div>
              <label htmlFor="tag-filter" className="sr-only">
                Filter videos by tag
              </label>
              <select
                id="tag-filter"
                value={filterTag}
                onChange={(e) => {
                  setFilterTag(e.target.value);
                  makeAnnouncement(
                    e.target.value
                      ? `Filtering by tag: ${e.target.value}`
                      : "Tag filter cleared"
                  );
                }}
                className="border border-[#e0e3ea] rounded-xl px-4 py-2 bg-[#f8fafc] text-[#1a2233] shadow-sm transition font-semibold focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
                aria-describedby="tag-filter-help"
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
              <div id="tag-filter-help" className="sr-only">
                Filter your videos by selecting a specific tag
              </div>
            </div>

            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter videos by status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  makeAnnouncement(
                    e.target.value
                      ? `Filtering by status: ${e.target.value}`
                      : "Status filter cleared"
                  );
                }}
                className="border border-[#e0e3ea] rounded-xl px-4 py-2 bg-[#f8fafc] text-[#1a2233] shadow-sm transition font-semibold focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
                aria-describedby="status-filter-help"
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
              <div id="status-filter-help" className="sr-only">
                Filter your videos by verification status
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="sort-videos" className="sr-only">
              Sort videos
            </label>
            <select
              id="sort-videos"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                makeAnnouncement(`Sorting videos by: ${e.target.value}`);
              }}
              className="border border-[#e0e3ea] rounded-xl px-4 py-2 bg-[#e6f0ff] text-[#2563eb] font-bold shadow-sm transition tracking-wide uppercase focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
              aria-describedby="sort-help"
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
            <div id="sort-help" className="sr-only">
              Choose how to sort your video list
            </div>
          </div>
        </div>

        {/* Video List Container */}
        <div
          className="w-full max-w-7xl bg-[#f8fafc] rounded-2xl border border-[#e0e3ea] shadow-inner p-4"
          style={{ maxHeight: "500px", minHeight: "500px", overflowY: "auto" }}
          role="region"
          aria-label="Video list"
          aria-describedby="video-count"
        >
          <div id="video-count" className="sr-only">
            {videos.length === 0
              ? "No videos found"
              : `${videos.length} video${videos.length === 1 ? "" : "s"} found`}
          </div>

          <div className="flex flex-col gap-8 w-full">
            {videos.length === 0 && (
              <div
                className="col-span-full text-center text-gray-400 text-lg"
                role="status"
                aria-live="polite"
              >
                No videos found.
              </div>
            )}
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex flex-col bg-white border border-[#e0e3ea] rounded-xl p-4 gap-4 shadow hover:shadow-xl transition w-full max-w-full mx-auto cursor-pointer hover:bg-[#f6faff] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-[#f6faff]"
                style={{ minHeight: "140px" }}
                onClick={() => {
                  setSelectedVideoId(video.id);
                  makeAnnouncement(
                    `Opening video management for: ${video.title}`
                  );
                  // Focus will be managed by useEffect when modal opens
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedVideoId(video.id);
                    makeAnnouncement(
                      `Opening video management for: ${video.title}`
                    );
                    // Focus will be managed by useEffect when modal opens
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Manage video: ${video.title}. Status: ${
                  video.status
                }. Created: ${formatDate(video.created_at)}`}
                aria-describedby={`video-${video.id}-details`}
              >
                <div id={`video-${video.id}-details`} className="sr-only">
                  Video details: {video.title}. Status: {video.status}.
                  {video.tags &&
                    (typeof video.tags === "string"
                      ? video.tags
                      : Array.isArray(video.tags)
                      ? video.tags.join(", ")
                      : "")}
                  Created on {formatDate(video.created_at)}
                </div>

                <div className="w-full flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/5 max-h-36 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#f9fafb] to-[#e9ecef] shadow-inner border border-[#e0e3ea] overflow-hidden">
                    <video
                      src={getPublicVideoUrl(video.video_url)}
                      controls
                      className="w-full h-full rounded-lg"
                      style={{ background: "#f3f3f3", minHeight: "90px" }}
                      aria-label={`Video preview for: ${video.title}`}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="font-bold text-lg text-[#1a2233] mb-1 truncate tracking-tight"
                        id={`video-title-${video.id}`}
                      >
                        {video.title}
                      </h3>

                      <div
                        className="flex flex-wrap gap-2 mb-1"
                        role="group"
                        aria-label="Video tags"
                      >
                        {video.tags &&
                          (typeof video.tags === "string"
                            ? video.tags.split(",").map((tag: string) => (
                                <span
                                  key={tag}
                                  className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                  role="tag"
                                  aria-label={`Tag: ${tag.trim()}`}
                                >
                                  #{tag.trim()}
                                </span>
                              ))
                            : Array.isArray(video.tags)
                            ? video.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                  role="tag"
                                  aria-label={`Tag: ${tag.trim()}`}
                                >
                                  #{tag.trim()}
                                </span>
                              ))
                            : null)}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        {/* Status Icon */}
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(
                            video.status
                          )}`}
                          role="status"
                          aria-label={`Video status: ${video.status}`}
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
                        <span
                          className="text-[#6c63ff] text-xs font-semibold"
                          aria-label="Review count"
                        >
                          <ReviewsCount videoId={video.id} />
                        </span>
                        <span
                          className="text-[#b0b6c1] text-xs font-medium italic"
                          aria-label={`Created on ${formatDate(
                            video.created_at
                          )}`}
                        >
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-management-title"
            aria-describedby="video-management-description"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSelectedVideoId(null);
                makeAnnouncement("Video management dialog closed");
              }
            }}
          >
            <div id="video-management-description" className="sr-only">
              Video management dialog for editing video details, tags, and
              settings
            </div>

            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative"
              onKeyDown={(e) => {
                // Trap focus within modal
                if (e.key === "Tab") {
                  const modal = e.currentTarget;
                  const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                  );
                  const firstElement = focusableElements[0] as HTMLElement;
                  const lastElement = focusableElements[
                    focusableElements.length - 1
                  ] as HTMLElement;

                  if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                      e.preventDefault();
                      lastElement.focus();
                    }
                  } else {
                    if (document.activeElement === lastElement) {
                      e.preventDefault();
                      firstElement.focus();
                    }
                  }
                }
              }}
            >
              <h2 id="video-management-title" className="sr-only">
                Video Management
              </h2>

              <button
                className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-700 shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                onClick={() => {
                  setSelectedVideoId(null);
                  makeAnnouncement("Video management dialog closed");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSelectedVideoId(null);
                    makeAnnouncement("Video management dialog closed");
                  }
                }}
                aria-label="Close video management dialog"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
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
                  makeAnnouncement("Video updated successfully");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
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
