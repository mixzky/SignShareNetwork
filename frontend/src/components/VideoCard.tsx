"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Flag, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Database } from "@/types/database";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import Review from "./Review";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* User Info Section */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={video.user.avatar_url || "/default-avatar.png"}
            alt={`${video.user.display_name}'s avatar`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-grow">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">
                {video.user.display_name}
              </span>
              {video.user.role === "moderator" && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
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
    </div>
  );
}
