"use client";

import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Flag,
  Volume2,
  VolumeX,
  Maximize2,
  Languages,
} from "lucide-react";
import { Button } from "./ui/button";
import { Database } from "@/types/database";
import { useRouter } from "next/navigation";
import { getSupabaseClient, getPublicVideoUrl } from "@/lib/supabase";
import Review from "./Review";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

type SignVideo = Database["public"]["Tables"]["sign_videos"]["Row"] & {
  user: {
    avatar_url: string | null;
    display_name: string;
    role: string;
  };
  reviews?: {
    user: {
      avatar_url: string | null;
      display_name: string;
    };
    rating: number;
    comment: string;
  }[];
};

interface VideoCardProps {
  video: SignVideo;
}

export default function VideoCard({ video }: VideoCardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [tags, setTags] = useState<string[]>(video.tags || []);
  const [showAllTags, setShowAllTags] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string>("");
  const [translatedDesc, setTranslatedDesc] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const flagDialogRef = useRef<HTMLDivElement>(null);
  const flagTextareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);

  useEffect(() => {
    setVideoUrl(getPublicVideoUrl(video.video_url));
  }, [video.video_url]);

  // Focus management for flag dialog
  useEffect(() => {
    if (flagOpen && flagTextareaRef.current) {
      // Focus the textarea when dialog opens
      setTimeout(() => {
        flagTextareaRef.current?.focus();
      }, 100);
    }
  }, [flagOpen]);

  // Keyboard event handler for dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (flagOpen && e.key === "Escape") {
        setFlagOpen(false);
        // Announce dialog closure
        const announcement = document.createElement("div");
        announcement.setAttribute("role", "status");
        announcement.setAttribute("aria-live", "polite");
        announcement.className = "sr-only";
        announcement.textContent = "Flag dialog closed with Escape key.";
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 3000);
      }
    };

    if (flagOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [flagOpen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        // Automatically unmute when playing
        if (isMuted) {
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      }
      setIsPlaying(!isPlaying);

      // Announce state change to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = !isPlaying ? "Video playing" : "Video paused";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 2000);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);

      // Announce state change to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = !isMuted ? "Video muted" : "Video unmuted";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 2000);
    }
  };

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }

      // Announce state change to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = !isFullscreen
        ? "Entered fullscreen mode"
        : "Exited fullscreen mode";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 2000);
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      // Announce error to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "alert");
      announcement.setAttribute("aria-live", "assertive");
      announcement.className = "sr-only";
      announcement.textContent =
        "Fullscreen mode is not available in this browser.";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleTagsUpdate = (newTags: string[]) => {
    setTags(newTags);
  };

  const handleFlag = async () => {
    setFlagLoading(true);

    // Announce start of flag submission
    const startAnnouncement = document.createElement("div");
    startAnnouncement.setAttribute("role", "status");
    startAnnouncement.setAttribute("aria-live", "polite");
    startAnnouncement.className = "sr-only";
    startAnnouncement.textContent = "Submitting flag report...";
    document.body.appendChild(startAnnouncement);

    try {
      const supabase = getSupabaseClient();
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("You must be logged in to flag a video.");
        // Announce error to screen readers
        const errorAnnouncement = document.createElement("div");
        errorAnnouncement.setAttribute("role", "alert");
        errorAnnouncement.setAttribute("aria-live", "assertive");
        errorAnnouncement.className = "sr-only";
        errorAnnouncement.textContent =
          "Error: You must be logged in to flag a video.";
        document.body.appendChild(errorAnnouncement);
        setTimeout(() => document.body.removeChild(errorAnnouncement), 3000);
        setFlagLoading(false);
        return;
      }

      // Insert flag
      const { error } = await supabase.from("flags").insert({
        video_id: video.id,
        flagged_by: user.id,
        reason: flagReason,
      });

      if (error) {
        toast.error("Failed to flag video: " + error.message);
        // Announce error to screen readers
        const errorAnnouncement = document.createElement("div");
        errorAnnouncement.setAttribute("role", "alert");
        errorAnnouncement.setAttribute("aria-live", "assertive");
        errorAnnouncement.className = "sr-only";
        errorAnnouncement.textContent = `Error flagging video: ${error.message}`;
        document.body.appendChild(errorAnnouncement);
        setTimeout(() => document.body.removeChild(errorAnnouncement), 3000);
      } else {
        toast.success("Video flagged for review.");
        setFlagOpen(false);
        setFlagReason("");
        // Announce success to screen readers
        const successAnnouncement = document.createElement("div");
        successAnnouncement.setAttribute("role", "status");
        successAnnouncement.setAttribute("aria-live", "polite");
        successAnnouncement.className = "sr-only";
        successAnnouncement.textContent =
          "Video flagged for review successfully. Dialog closed.";
        document.body.appendChild(successAnnouncement);
        setTimeout(() => document.body.removeChild(successAnnouncement), 3000);
      }
    } catch (e) {
      toast.error("Unexpected error flagging video.");
      // Announce error to screen readers
      const errorAnnouncement = document.createElement("div");
      errorAnnouncement.setAttribute("role", "alert");
      errorAnnouncement.setAttribute("aria-live", "assertive");
      errorAnnouncement.className = "sr-only";
      errorAnnouncement.textContent =
        "Unexpected error occurred while flagging video.";
      document.body.appendChild(errorAnnouncement);
      setTimeout(() => document.body.removeChild(errorAnnouncement), 3000);
    } finally {
      setFlagLoading(false);
      // Clean up start announcement
      document.body.removeChild(startAnnouncement);
    }
  };

  const handleTranslate = async () => {
    // If already translated, toggle back to original
    if (isTranslated) {
      setIsTranslated(false);
      // Announce to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = "Showing original content";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
      return;
    }

    // If we already have translations, just show them
    if (translatedTitle && translatedDesc) {
      setIsTranslated(true);
      // Announce to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = "Showing translated content";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
      return;
    }

    setIsTranslating(true);

    // Announce start of translation
    const startAnnouncement = document.createElement("div");
    startAnnouncement.setAttribute("role", "status");
    startAnnouncement.setAttribute("aria-live", "polite");
    startAnnouncement.className = "sr-only";
    startAnnouncement.textContent = "Translating video content...";
    document.body.appendChild(startAnnouncement);

    try {
      const response = await fetch(
        "https://mixlnwza007.app.n8n.cloud/webhook/49a535bd-6f79-46fc-9501-571f1d4a9309",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: video.id,
            method: "click",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.translated_title && data.translated_desc) {
        setTranslatedTitle(data.translated_title);
        setTranslatedDesc(data.translated_desc);
        setIsTranslated(true);
        toast.success("Content translated successfully!");

        // Announce success to screen readers
        const successAnnouncement = document.createElement("div");
        successAnnouncement.setAttribute("role", "status");
        successAnnouncement.setAttribute("aria-live", "polite");
        successAnnouncement.className = "sr-only";
        successAnnouncement.textContent =
          "Video content translated successfully.";
        document.body.appendChild(successAnnouncement);
        setTimeout(() => document.body.removeChild(successAnnouncement), 3000);
      } else {
        throw new Error("Translation response missing required fields");
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate content. Please try again.");

      // Announce error to screen readers
      const errorAnnouncement = document.createElement("div");
      errorAnnouncement.setAttribute("role", "alert");
      errorAnnouncement.setAttribute("aria-live", "assertive");
      errorAnnouncement.className = "sr-only";
      errorAnnouncement.textContent = "Translation failed. Please try again.";
      document.body.appendChild(errorAnnouncement);
      setTimeout(() => document.body.removeChild(errorAnnouncement), 3000);
    } finally {
      setIsTranslating(false);
      // Clean up start announcement
      document.body.removeChild(startAnnouncement);
    }
  };

  return (
    <article
      className="bg-white rounded-xl shadow-sm overflow-hidden"
      role="article"
      aria-labelledby={`video-title-${video.id}`}
      aria-describedby={`video-description-${video.id}`}
    >
      {/* User Info Section */}
      <header className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={video.user.avatar_url || "/default-avatar.png"}
            alt={`${video.user.display_name}'s profile picture`}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">
                {video.user.display_name}
              </span>
              {video.user.role === "moderator" && (
                <>
                  <CheckCircle2
                    className="w-4 h-4 text-blue-500"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Verified moderator</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <div
                className="flex flex-wrap gap-1"
                role="list"
                aria-label="Video tags"
              >
                {(showAllTags ? tags : tags.slice(0, 5)).map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(`/country/${video.region}?tag=${tag}`);
                      // Announce navigation to screen readers
                      const announcement = document.createElement("div");
                      announcement.setAttribute("role", "status");
                      announcement.setAttribute("aria-live", "polite");
                      announcement.className = "sr-only";
                      announcement.textContent = `Filtering videos by tag: ${tag}`;
                      document.body.appendChild(announcement);
                      setTimeout(
                        () => document.body.removeChild(announcement),
                        3000
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/country/${video.region}?tag=${tag}`);
                      }
                    }}
                    className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm cursor-pointer hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-transform duration-150"
                    role="listitem"
                    aria-label={`Filter by tag: ${tag}`}
                    tabIndex={0}
                  >
                    {tag}
                  </button>
                ))}
                {tags.length > 5 && !showAllTags && (
                  <button
                    onClick={() => {
                      setShowAllTags(true);
                      // Announce to screen readers
                      const announcement = document.createElement("div");
                      announcement.setAttribute("role", "status");
                      announcement.setAttribute("aria-live", "polite");
                      announcement.className = "sr-only";
                      announcement.textContent = `Showing all ${tags.length} tags`;
                      document.body.appendChild(announcement);
                      setTimeout(
                        () => document.body.removeChild(announcement),
                        3000
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowAllTags(true);
                      }
                    }}
                    className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm cursor-pointer hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-transform duration-150"
                    aria-label={`Show ${tags.length - 5} more tags`}
                    tabIndex={0}
                  >
                    +{tags.length - 5} more
                  </button>
                )}
                {showAllTags && tags.length > 5 && (
                  <button
                    onClick={() => {
                      setShowAllTags(false);
                      // Announce to screen readers
                      const announcement = document.createElement("div");
                      announcement.setAttribute("role", "status");
                      announcement.setAttribute("aria-live", "polite");
                      announcement.className = "sr-only";
                      announcement.textContent = "Showing fewer tags";
                      document.body.appendChild(announcement);
                      setTimeout(
                        () => document.body.removeChild(announcement),
                        3000
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowAllTags(false);
                      }
                    }}
                    className="bg-[#fff3cd] text-[#b48a4a] px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm cursor-pointer hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-transform duration-150"
                    aria-label="Show fewer tags"
                    tabIndex={0}
                  >
                    show less
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Title and Description */}
      <div className="px-4 pb-4">
        <h2
          id={`video-title-${video.id}`}
          className="text-xl font-semibold text-gray-900 mb-2"
        >
          {isTranslated ? translatedTitle : video.title}
        </h2>
        {(video.description || translatedDesc) && (
          <p
            id={`video-description-${video.id}`}
            className="text-gray-600 text-sm whitespace-pre-wrap mb-3"
          >
            {isTranslated ? translatedDesc : video.description}
          </p>
        )}
        {/* Translate Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            aria-label={
              isTranslated ? "Show original content" : "Translate content"
            }
          >
            {isTranslating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin mr-1" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="w-4 h-4 mr-1" aria-hidden="true" />
                {isTranslated ? "Show Original" : "Translate"}
              </>
            )}
          </Button>
        </div>
      </div>
      {/* Video Section */}
      <div
        ref={videoContainerRef}
        className="relative aspect-video bg-black"
        role="region"
        aria-label={`Video player for: ${video.title}`}
        aria-describedby={`video-instructions-${video.id}`}
      >
        <div id={`video-instructions-${video.id}`} className="sr-only">
          Click video to play or pause. Use the control buttons for mute and
          fullscreen.
        </div>

        {videoUrl ? (
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
            src={videoUrl}
            muted={isMuted}
            loop
            playsInline
            onClick={togglePlay}
            onKeyDown={(e) => {
              switch (e.key) {
                case "Enter":
                case " ":
                  e.preventDefault();
                  togglePlay();
                  break;
                case "m":
                case "M":
                  e.preventDefault();
                  toggleMute();
                  break;
                case "f":
                case "F":
                  e.preventDefault();
                  toggleFullscreen();
                  break;
                case "Escape":
                  if (isFullscreen) {
                    e.preventDefault();
                    toggleFullscreen();
                  }
                  break;
              }
            }}
            tabIndex={0}
            aria-label={`${video.title} - ${
              isPlaying ? "Playing" : "Paused"
            }. ${isMuted ? "Muted" : "Unmuted"}`}
            aria-describedby={`video-controls-${video.id}`}
            onLoadStart={() => {
              // Announce when video starts loading
              const announcement = document.createElement("div");
              announcement.setAttribute("role", "status");
              announcement.setAttribute("aria-live", "polite");
              announcement.className = "sr-only";
              announcement.textContent = `Loading video: ${video.title}`;
              document.body.appendChild(announcement);
              setTimeout(() => document.body.removeChild(announcement), 3000);
            }}
            onCanPlay={() => {
              // Announce when video is ready
              const announcement = document.createElement("div");
              announcement.setAttribute("role", "status");
              announcement.setAttribute("aria-live", "polite");
              announcement.className = "sr-only";
              announcement.textContent = `Video ready to play: ${video.title}`;
              document.body.appendChild(announcement);
              setTimeout(() => document.body.removeChild(announcement), 3000);
            }}
            onError={() => {
              // Announce video errors
              const announcement = document.createElement("div");
              announcement.setAttribute("role", "alert");
              announcement.setAttribute("aria-live", "assertive");
              announcement.className = "sr-only";
              announcement.textContent = `Error loading video: ${video.title}. Please try refreshing the page.`;
              document.body.appendChild(announcement);
              setTimeout(() => document.body.removeChild(announcement), 5000);
            }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-200"
            role="status"
            aria-label="Video loading"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="sr-only">Loading video content...</span>
          </div>
        )}

        <div
          id={`video-controls-${video.id}`}
          className="absolute bottom-4 right-4 flex gap-2"
          role="group"
          aria-label="Video playback controls"
        >
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 focus:bg-black/70 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
            onClick={toggleMute}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleMute();
              }
            }}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            aria-pressed={!isMuted}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 focus:bg-black/70 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
            onClick={toggleFullscreen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleFullscreen();
              }
            }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
          >
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Screen reader announcements for video state changes */}
        <div role="status" aria-live="polite" className="sr-only">
          {isPlaying && "Video playing"}
          {!isPlaying && "Video paused"}
          {isMuted && "Video muted"}
          {!isMuted && "Video unmuted"}
        </div>
      </div>
      {/* Reviews Section */}
      <Review videoId={video.id} />
      {/* Flag Button and Dialog */}
      <footer className="flex justify-end p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFlagOpen(true)}
          className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
          aria-label={`Report this video: ${video.title}`}
        >
          <Flag className="w-4 h-4 mr-1 text-red-500" aria-hidden="true" />
          Flag
        </Button>
      </footer>
      {flagOpen && (
        <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flag-dialog-title"
            aria-describedby="flag-dialog-description"
            onClick={(e) => {
              // Close dialog when clicking backdrop
              if (e.target === e.currentTarget) {
                setFlagOpen(false);
                // Announce dialog closure
                const announcement = document.createElement("div");
                announcement.setAttribute("role", "status");
                announcement.setAttribute("aria-live", "polite");
                announcement.className = "sr-only";
                announcement.textContent = "Flag dialog closed.";
                document.body.appendChild(announcement);
                setTimeout(() => document.body.removeChild(announcement), 3000);
              }
            }}
          >
            <div
              ref={flagDialogRef}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative focus:outline-none"
              tabIndex={-1}
            >
              <div role="status" aria-live="assertive" className="sr-only">
                Flag video dialog opened.
              </div>

              <h2
                id="flag-dialog-title"
                className="text-lg font-bold mb-2 flex items-center gap-2"
              >
                <Flag className="w-5 h-5 text-red-500" aria-hidden="true" />
                Flag this video
              </h2>
              <p id="flag-dialog-description" className="mb-4 text-gray-600">
                Why are you flagging this video? Please provide a detailed
                reason.
              </p>
              <Textarea
                ref={flagTextareaRef}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Describe the reason for flagging (required)"
                className="mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 "
                rows={4}
                disabled={flagLoading}
                aria-label="Reason for flagging this video"
                aria-describedby="flag-help"
                aria-invalid={!flagReason.trim() ? "true" : "false"}
                aria-required="true"
                onKeyDown={(e) => {
                  // Handle keyboard navigation within dialog
                  if (e.key === "Tab") {
                    // Allow natural tab navigation within dialog
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setFlagOpen(false);
                  }
                }}
              />
              <p id="flag-help" className="text-sm text-gray-500 mb-4">
                Examples: Inappropriate content, spam, harassment, copyright
                violation, etc.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFlagOpen(false);
                    setFlagReason("");
                    // Announce to screen readers
                    const announcement = document.createElement("div");
                    announcement.setAttribute("role", "status");
                    announcement.setAttribute("aria-live", "polite");
                    announcement.className = "sr-only";
                    announcement.textContent =
                      "Flag dialog canceled and closed.";
                    document.body.appendChild(announcement);
                    setTimeout(
                      () => document.body.removeChild(announcement),
                      3000
                    );
                  }}
                  disabled={flagLoading}
                  className="focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                  aria-label="Cancel flagging and close dialog"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFlag}
                  disabled={flagLoading || !flagReason.trim()}
                  className="bg-red-500 hover:bg-red-600 focus:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
                  aria-label={
                    flagLoading
                      ? "Submitting flag report, please wait"
                      : `Submit flag report${
                          !flagReason.trim()
                            ? " (disabled: reason required)"
                            : ""
                        }`
                  }
                  aria-describedby={
                    !flagReason.trim() ? "submit-disabled-help" : undefined
                  }
                >
                  {flagLoading ? "Flagging..." : "Submit Flag"}
                </Button>
                {!flagReason.trim() && (
                  <span id="submit-disabled-help" className="sr-only">
                    Submit button is disabled because a reason is required
                  </span>
                )}
              </div>

              {/* Live region for flag submission status */}
              <div role="status" aria-live="polite" className="sr-only">
                {flagLoading && "Submitting flag report, please wait..."}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </article>
  );
}
