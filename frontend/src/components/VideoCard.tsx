"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Flag, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Database } from "@/types/database";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);

  useEffect(() => {
    // Get public URL for the video
    const supabase = getSupabaseClient();
    // Extract bucket and path from the full storage path
    const [bucket, ...pathParts] = video.video_url.split("/");
    const path = pathParts.join("/");
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setVideoUrl(data.publicUrl);
  }, [video.video_url]);

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
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
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
    try {
      const supabase = getSupabaseClient();
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You must be logged in to flag a video.");
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
      } else {
        toast.success("Video flagged for review.");
        setFlagOpen(false);
        setFlagReason("");
      }
    } catch (e) {
      toast.error("Unexpected error flagging video.");
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">      {/* User Info Section */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={video.user.avatar_url || "/default-avatar.png"}
            alt={`${video.user.display_name}'s avatar`}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">
                {video.user.display_name}
              </span>
              {video.user.role === "moderator" && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
            </div>            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-wrap gap-1">
                {(showAllTags ? tags : tags.slice(0, 5)).map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => router.push(`/country/${video.region}?tag=${tag}`)}
                    className="px-2 py-0.5 text-[#002b4f] border-2 border-[#bcd8ec] text-xs rounded-full cursor-pointer hover:bg-[#d2ecff] hover:border-[#d2ecff]  hover:text-[#005a9e] transition-colors duration-150"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 5 && !showAllTags && (
                  <span 
                    onClick={() => setShowAllTags(true)}
                    className="px-2 py-0.5  text-[#002b4f] border-2 border-[#bcd8ec] text-xs rounded-full cursor-pointer hover:bg-[#d2ecff] hover:border-[#d2ecff] hover:text-[#005a9e] transition-colors duration-150"
                  >
                    +{tags.length - 5} more
                  </span>
                )}
                {showAllTags && tags.length > 5 && (
                  <span 
                    onClick={() => setShowAllTags(false)}
                    className="px-2 py-0.5 text-[#002b4f] border-2 border-[#bcd8ec] text-xs rounded-full cursor-pointer hover:bg-[#d2ecff] hover:border-[#d2ecff] hover:text-[#005a9e] transition-colors duration-150"
                  >
                    show less
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title and Description */}
      <div className="px-4 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {video.title}
        </h2>
        {video.description && (
          <p className="text-gray-600 text-sm whitespace-pre-wrap">
            {video.description}
          </p>
        )}
      </div>

      {/* Video Section */}
      <div ref={videoContainerRef} className="relative aspect-video bg-black">
        {videoUrl && (
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover cursor-pointer"
            src={videoUrl}
            muted={isMuted}
            loop
            playsInline
            onClick={togglePlay}
          />
        )}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      <Review videoId={video.id} />

      {/* Flag Button and Dialog */}
      <div className="flex justify-end p-4">
        <Button variant="outline" size="sm" onClick={() => setFlagOpen(true)}>
          <Flag className="w-4 h-4 mr-1 text-red-500" />
          Flag
        </Button>
      </div>
      {flagOpen && (
        <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Flag this video
              </h2>
              <p className="mb-4 text-gray-600">Why are you flagging this video?</p>
              <Textarea
                value={flagReason}
                onChange={e => setFlagReason(e.target.value)}
                placeholder="Describe the reason for flagging (required)"
                className="mb-4"
                rows={4}
                disabled={flagLoading}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setFlagOpen(false)} disabled={flagLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFlag}
                  disabled={flagLoading || !flagReason.trim()}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {flagLoading ? "Flagging..." : "Submit Flag"}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
