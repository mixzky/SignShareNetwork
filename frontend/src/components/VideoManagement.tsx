"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col gap-6">
      {successMsg && (
        <div className="flex items-center justify-center gap-2 text-green-700 bg-green-100 border border-green-300 rounded-lg px-4 py-2 text-base font-semibold shadow-sm animate-fade-in">
          <svg
            className="w-5 h-5 text-green-600"
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
      <video
        src={publicUrl}
        controls
        className="w-full h-56 rounded-xl border border-[#e0e3ea] bg-[#f8fafc] shadow"
      />
      <div>
        <label className="block text-sm font-semibold mb-1">Title</label>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="border border-[#e0e3ea] rounded px-3 py-2 w-full font-semibold focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition"
          placeholder="Enter video title"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Description</label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="border border-[#e0e3ea] rounded px-3 py-2 w-full focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] transition"
          rows={3}
          placeholder="Enter video description"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Tags</label>
        <div className="flex flex-wrap gap-2">
          {editTags.map((tag) => (
            <span
              key={tag}
              className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm cursor-pointer hover:scale-105 hover:shadow-md transition-transform duration-150"
              onClick={() => handleRemoveTag(tag)}
              title="Remove tag"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleRemoveTag(tag);
              }}
              aria-label={`Remove tag ${tag}`}
            >
              #{tag}{" "}
              <span className="ml-1 text-base align-middle">&times;</span>
            </span>
          ))}
          {editTags.length === 0 && (
            <span className="text-gray-400 text-xs">No tags</span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Click or press Enter/Space on a tag to remove it.
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1749b1] transition disabled:opacity-60 shadow"
        >
          {saving ? (
            <span className="flex items-center gap-2">
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
            </span>
          ) : (
            "Save"
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-5 py-2 rounded bg-[#ffeaea] text-[#ff6b6b] font-semibold hover:bg-[#ffd6d6] transition disabled:opacity-60 shadow"
        >
          {deleting ? (
            <span className="flex items-center gap-2">
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
            </span>
          ) : (
            "Delete"
          )}
        </button>
      </div>
    </div>
  );
}
