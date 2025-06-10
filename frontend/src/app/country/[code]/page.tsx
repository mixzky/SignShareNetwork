"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Video = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  user: {
    display_name: string;
    avatar_url: string | null;
  };
};

const countries: { [key: string]: string } = {
  TH: "Thailand",
  US: "United States",
  GB: "United Kingdom",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
};

export default function CountryVideosPage() {
  const { code } = useParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from("sign_videos")
          .select(`
            id,
            title,
            description,
            video_url,
            user:users (
              display_name,
              avatar_url
            )
          `)
          .eq("region", code)
          .eq("status", "verified")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform the data to match the Video type
        const transformedData = data?.map(video => ({
          ...video,
          user: video.user[0] // Take the first user object from the array
        })) as Video[];

        setVideos(transformedData || []);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [code]);

  useEffect(() => {
    // Pause all videos except the current one
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const handleScroll = (event: React.WheelEvent) => {
    const delta = event.deltaY;
    if (delta > 0 && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (delta < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!code || !countries[code as string]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Country not found</h1>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">
          No videos from {countries[code as string]} yet
        </h1>
        <Link href="/upload">
          <Button>Upload First Video</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden bg-black"
      onWheel={handleScroll}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={`absolute inset-0 transition-transform duration-500 ${
            index === currentIndex ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="relative h-full">
            <video
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src={video.video_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={index !== currentIndex}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
              <div className="flex items-center gap-3 mb-2">
                {video.user.avatar_url ? (
                  <img
                    src={video.user.avatar_url}
                    alt={video.user.display_name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm text-gray-600">
                      {video.user.display_name[0]}
                    </span>
                  </div>
                )}
                <span className="font-semibold">{video.user.display_name}</span>
              </div>
              <h2 className="text-xl font-bold mb-2">{video.title}</h2>
              <p className="text-sm opacity-90">{video.description}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" className="bg-black/50 text-white">
            Back to Home
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Link href="/upload">
          <Button variant="outline" className="bg-black/50 text-white">
            Upload Video
          </Button>
        </Link>
      </div>
    </div>
  );
} 