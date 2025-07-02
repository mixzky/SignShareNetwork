"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";
import { toast } from "sonner";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  language: z.string().min(1, "Language is required"),
  region: z.string().min(1, "Region is required"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "video/mp4" && file.type !== "video/webm") {
        toast.error("Please upload an MP4 or WebM video file");
        return;
      }
      setVideoFile(file);
    }
  };

  const generateTags = async (title: string, description: string) => {
    try {
      const response = await fetch("/api/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await response.json();
      if (data.tags) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error("Error generating tags:", error);
      toast.error("Failed to generate tags");
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload video to Supabase Storage
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(fileName);

      // 3. Generate tags if not already generated
      if (tags.length === 0) {
        await generateTags(data.title, data.description);
      }

      // 4. Save video metadata to database
      const { error: dbError } = await supabase.from("sign_videos").insert({
        title: data.title,
        description: data.description,
        language: data.language,
        region: data.region,
        video_url: publicUrl,
        tags,
        status: "pending",
      });

      if (dbError) throw dbError;

      toast.success("Video uploaded successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Sign Language Video</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video">Video File (MP4 or WebM)</Label>
              <Input
                id="video"
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter video title"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter video description"
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  {...register("language")}
                  placeholder="e.g., Thai Sign Language"
                />
                {errors.language && (
                  <p className="text-sm text-red-500">
                    {errors.language.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  {...register("region")}
                  placeholder="e.g., Bangkok"
                />
                {errors.region && (
                  <p className="text-sm text-red-500">
                    {errors.region.message}
                  </p>
                )}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="space-y-2">
                <Label>Generated Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
