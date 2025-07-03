"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getPublicVideoUrl } from "@/lib/supabase";

type Video = {
  id: string;
  video_url: string;
  title: string;
  description: string;
  tags: string[];
};

export default function VideoManagement({
  videoId,
  publicUrl,
  onAction,
}: {
  videoId: string;
  publicUrl: string;
  onAction?: () => void;
}) {
  const [video, setVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchVideo();
    // eslint-disable-next-line
  }, [videoId]);

  async function fetchVideo() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sign_videos")
      .select("id, video_url, title, description, tags")
      .eq("id", videoId)
      .single();
    if (data) {
      setVideo({
        ...data,
        tags:
          typeof data.tags === "string"
            ? data.tags
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
            : Array.isArray(data.tags)
            ? data.tags
            : [],
      });
      setEditTitle(data.title || "");
      setEditDescription(data.description || "");
      setEditTags(
        typeof data.tags === "string"
          ? data.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : Array.isArray(data.tags)
          ? data.tags
          : []
      );
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("sign_videos")
      .update({
        title: editTitle,
        description: editDescription,
        tags: editTags,
      })
      .eq("id", videoId);
    setSaving(false);
    setSuccessMsg("Successfully edited!");
    setTimeout(() => {
      setSuccessMsg(null);
      if (onAction) onAction();
    }, 1200);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this video?")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("sign_videos").delete().eq("id", videoId);
    setDeleting(false);
    setSuccessMsg("Successfully deleted!");
    setTimeout(() => {
      setSuccessMsg(null);
      if (onAction) onAction();
    }, 1200);
  }

  function handleRemoveTag(tag: string) {
    setEditTags((tags) => tags.filter((t) => t !== tag));
  }

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-10">Loading video...</div>
    );
  }

  if (!video) {
    return (
      <div className="text-center text-red-400 py-10">Video not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative h-[80vh] overflow-y-auto p-4">
      {/* Video section - fixed at top */}
      <div className="sticky top-0 z-10 bg-white pb-4">
        <video
          src={getPublicVideoUrl(video?.video_url || "")}
          controls
          className="w-full h-40 rounded-lg border border-[#e0e3ea] bg-[#f8fafc] shadow-md"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pr-3">
        <div className="flex flex-col gap-4">
          <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e0e3ea]">
            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="border border-[#e0e3ea] rounded px-3 py-2 w-full font-semibold focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition bg-white text-sm"
              placeholder="Enter video title"
            />
          </div>
          <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e0e3ea]">
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="border border-[#e0e3ea] rounded px-3 py-2 w-full focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition bg-white text-sm"
              rows={3}
              placeholder="Enter video description"
            />
          </div>
          <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e0e3ea]">
            <label className="block text-sm font-semibold mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {editTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#fff3cd] text-[#b48a4a] px-2 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm cursor-pointer hover:scale-105 hover:shadow-md transition-transform duration-150"
                  onClick={() => handleRemoveTag(tag)}
                  title="Remove tag"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleRemoveTag(tag);
                  }}
                  aria-label={`Remove tag ${tag}`}
                >
                  #{tag}{" "}
                  <span className="ml-1 text-sm align-middle">&times;</span>
                </span>
              ))}
              {editTags.length === 0 && (
                <span className="text-gray-400 text-xs py-1">No tags</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Click or press Enter/Space on a tag to remove it.
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons - fixed at bottom */}
      <div className="sticky bottom-0 z-10 bg-white pt-4 border-t border-[#e0e3ea]">
        <div className="flex gap-3 justify-end items-center">
          {successMsg && (
            <div className="flex items-center gap-2 text-green-700 bg-green-100 border border-green-300 rounded px-4 py-2 text-sm font-semibold shadow-sm animate-fade-in">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {successMsg}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white font-bold shadow-md hover:from-[#1749b1] hover:to-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition disabled:opacity-60 text-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-6 py-2 rounded bg-gradient-to-r from-[#ffeaea] to-[#ffd6d6] text-[#ff6b6b] font-bold shadow-md hover:from-[#ffd6d6] hover:to-[#ffeaea] focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] transition disabled:opacity-60 text-sm"
          >
            {deleting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                Deleting...
              </>
            ) : (
              <>Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
