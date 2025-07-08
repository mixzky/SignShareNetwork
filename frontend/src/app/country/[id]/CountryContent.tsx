"use client";

import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserProfile, uploadVideo } from "@/lib/supabase";
import { getSupabaseClient } from "@/lib/supabase";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  language: z.string().min(1, "Language is required"),
  region: z.string().min(1, "Region is required"),
  video: z.instanceof(File).optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

type CountryContentProps = {
  id: string;
};

export default function CountryContent({ id }: CountryContentProps) {
  const [countryData, setCountryData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    avatar_url: string | null;
    display_name: string | null;
    id: string;
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  // Fetch country data
  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const res = await fetch(
          "https://unpkg.com/world-atlas/countries-110m.json"
        );
        const worldData = await res.json();
        const topojson = await import("topojson-client");

        const featureCollection = topojson.feature(
          worldData,
          worldData.objects.countries
        ) as unknown as GeoJSON.FeatureCollection;
        const countries = featureCollection.features;
        const country = countries.find((c: any) => String(c.id) === String(id));

        if (!country) {
          notFound();
        }

        setCountryData(country);
      } catch (error) {
        console.error("Error fetching country data:", error);
      }
    };

    fetchCountryData();
  }, [id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = await getCurrentUser();
        console.log("Profile page user:", user);
        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);
        const profile = await getUserProfile(user.id);
        if (!profile) {
          toast.error("Profile not found");
          router.push("/profile");
          return;
        }

        setUserProfile(profile);
        setIsLoadingProfile(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
        router.push("/profile");
      }
    };

    fetchUserProfile();
  }, [router]);

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

  const onSubmit = async (data: UploadFormData) => {
    if (!videoFile) {
      toast.error("Please select a video file");
      // Announce error to screen readers
      const errorAnnouncement = document.createElement("div");
      errorAnnouncement.setAttribute("role", "status");
      errorAnnouncement.setAttribute("aria-live", "assertive");
      errorAnnouncement.className = "sr-only";
      errorAnnouncement.textContent =
        "Error: Please select a video file before uploading.";
      document.body.appendChild(errorAnnouncement);
      setTimeout(() => document.body.removeChild(errorAnnouncement), 3000);
      return;
    }

    setIsUploading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Please sign in to upload videos");
        router.push("/login");
        return;
      }

      // Upload video to Supabase Storage
      const uploadResult = await uploadVideo(user.id, videoFile);
      if (!uploadResult) {
        throw new Error("Failed to upload video");
      }

      // Save video metadata to database
      const supabase = getSupabaseClient();

      const { data: videoData, error: dbError } = await supabase
        .from("sign_videos")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          language: data.language,
          region: id,
          video_url: uploadResult.storagePath,
          status: "processing",
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        if (dbError.code === "42501") {
          toast.error("Permission denied. Please make sure you are signed in.");
          router.push("/login");
          return;
        }
        throw dbError;
      }

      toast.success("Video uploaded successfully");

      // Announce success to screen readers
      const successAnnouncement = document.createElement("div");
      successAnnouncement.setAttribute("role", "status");
      successAnnouncement.setAttribute("aria-live", "assertive");
      successAnnouncement.className = "sr-only";
      successAnnouncement.textContent = `Success! Your video "${data.title}" has been uploaded and is now processing. The dialog will close automatically.`;
      document.body.appendChild(successAnnouncement);
      setTimeout(() => document.body.removeChild(successAnnouncement), 5000);

      setIsUploadDialogOpen(false);
      reset();
      setVideoFile(null);
      router.refresh();
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video. Please try again.");

      // Announce error to screen readers
      const errorAnnouncement = document.createElement("div");
      errorAnnouncement.setAttribute("role", "status");
      errorAnnouncement.setAttribute("aria-live", "assertive");
      errorAnnouncement.className = "sr-only";
      errorAnnouncement.textContent =
        "Error: Failed to upload video. Please check your connection and try again.";
      document.body.appendChild(errorAnnouncement);
      setTimeout(() => document.body.removeChild(errorAnnouncement), 5000);
    } finally {
      setIsUploading(false);
      setIsTagging(false);
    }
  };

  return (
    <div className="flex-1 w-full pt-28 flex flex-col items-center">
      <div className="w-full max-w-8/12 bg-white rounded-2xl shadow-md p-0  mt-8 ">
        {/* Top section: Now : Thailand */}
        <div className="flex justify-center pt-6 pb-6">
          <div
            className="px-6 py-2  rounded-full border w-96 border-[#cccccc] bg-[#fafafa] text-center text-base font-semibold"
            role="banner"
            aria-label={`Currently viewing ${
              countryData?.properties?.name || id
            }`}
          >
            <span className="text-green-400" aria-label="Currently viewing">
              Now :
            </span>{" "}
            <span className="font-bold">
              {countryData?.properties?.name || id}
            </span>{" "}
            <span role="img" aria-label="country flag"></span>
          </div>
        </div>
        {/* Divider */}
        <div
          className="border-t border-[#dedede]"
          role="separator"
          aria-hidden="true"
        />
        {/* Bottom section: user info and upload button */}
        <div
          className="flex flex-row items-center justify-center gap-8 px-8 py-6"
          role="region"
          aria-label="User profile and video upload section"
        >
          {/* User info */}
          <div
            className="flex justify-center items-center min-w-0 basis-1/2"
            role="region"
            aria-label="Current user profile"
          >
            {isLoadingProfile ? (
              <>
                <div
                  className="w-14 h-14 rounded-full mr-4 bg-gray-200 animate-pulse"
                  aria-hidden="true"
                />
                <span className="sr-only">Loading user profile...</span>
              </>
            ) : (
              <>
                <img
                  src={
                    userProfile?.avatar_url || "https://via.placeholder.com/56"
                  }
                  alt={`${userProfile?.display_name || "User"} profile picture`}
                  className="w-14 h-14 rounded-full mr-4 object-cover"
                />
                <span className="sr-only">Logged in as:</span>
              </>
            )}
            <span
              className="text-xl font-medium text-gray-600 truncate"
              aria-label={
                isLoadingProfile
                  ? "Loading username"
                  : `Username: ${userProfile?.display_name || "No name set"}`
              }
            >
              {isLoadingProfile ? (
                <>
                  <div
                    className="w-32 h-6 bg-gray-200 animate-pulse rounded"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Loading username...</span>
                </>
              ) : (
                userProfile?.display_name || "No name set"
              )}
            </span>
          </div>
          {/* Vertical divider */}
          <div
            className="h-20 w-px bg-[#dedede]"
            role="separator"
            aria-hidden="true"
          />
          {/* Upload button */}
          <button
            type="button"
            onClick={() => {
              setIsUploadDialogOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsUploadDialogOpen(true);
              }
            }}
            className="bg-green-50 border-2 border-green-200 text-green-900 font-semibold px-8 py-4 rounded-xl shadow-sm hover:bg-green-100 focus:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center transition-200 text-lg transition basis-1/2 justify-center cursor-pointer group"
            aria-label={`Upload a new sign language video to ${
              countryData?.properties?.name || id
            }`}
            tabIndex={0}
          >
            <span className="transition-transform duration-300 group-hover:scale-105">
              Upload Your Video
            </span>
            <span
              className="ml-2 mb-2 text-2xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-125"
              aria-hidden="true"
            >
              <UploadFileIcon />
            </span>
          </button>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            // Dialog is being closed — clear the video
            setVideoFile(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Sign Language Video</DialogTitle>
            <DialogDescription>
              Share your sign language video with the community. Please fill in
              all the required information below. Use Tab to navigate between
              fields.
            </DialogDescription>
          </DialogHeader>

          <div role="status" aria-live="assertive" className="sr-only">
            Upload dialog opened. Fill out the form to upload your sign language
            video.
          </div>

          <div className="space-y-6 py-4">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              aria-label="Video upload form"
            >
              {/* Step 1: Video File */}
              <div className="space-y-2">
                <Label htmlFor="video" className="text-base font-semibold">
                  Video File (MP4 or WebM) *
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition hover:border-[#2563eb] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
                    videoFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                  onClick={() => document.getElementById("video")?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (
                      file &&
                      (file.type === "video/mp4" || file.type === "video/webm")
                    ) {
                      setVideoFile(file);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    videoFile
                      ? `Selected video: ${videoFile.name}. Click to change.`
                      : "Click to select a video file or drag and drop here"
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("video")?.click();
                    }
                  }}
                >
                  {videoFile ? (
                    <>
                      <video
                        src={URL.createObjectURL(videoFile)}
                        controls
                        className="w-full max-h-40 rounded mb-2"
                        aria-label={`Preview of selected video: ${videoFile.name}`}
                      />
                      <p className="text-sm text-green-700 font-medium">
                        Selected: {videoFile.name}
                      </p>
                    </>
                  ) : (
                    <span className="text-gray-400">
                      Drag & drop or click to select a video file
                    </span>
                  )}
                  <Input
                    id="video"
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-describedby="video-help"
                  />
                </div>
                <p id="video-help" className="text-sm text-gray-600">
                  Supported formats: MP4, WebM. Maximum file size recommended:
                  100MB.
                </p>
                {errors.video && (
                  <p
                    className="text-sm text-red-500"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.video.message}
                  </p>
                )}
              </div>

              {/* Step 2: Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Title *
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter a descriptive title for your video"
                  className={errors.title ? "border-red-500" : ""}
                  aria-describedby="title-help"
                  aria-invalid={errors.title ? "true" : "false"}
                />
                <p id="title-help" className="text-sm text-gray-600">
                  Choose a clear, descriptive title that explains what sign
                  language content is shown.
                </p>
                {errors.title && (
                  <p
                    className="text-sm text-red-500"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Step 3: Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Provide details about the sign language content, context, or any special instructions"
                  className={errors.description ? "border-red-500" : ""}
                  rows={4}
                  aria-describedby="description-help"
                  aria-invalid={errors.description ? "true" : "false"}
                />
                <p id="description-help" className="text-sm text-gray-600">
                  Describe the signs demonstrated, their meaning, usage context,
                  or any cultural significance.
                </p>
                {errors.description && (
                  <p
                    className="text-sm text-red-500"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Step 4: Language & Region */}
              <fieldset className="grid grid-cols-2 gap-4">
                <legend className="sr-only">
                  Language and Region Information
                </legend>
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-base font-semibold">
                    Language *
                  </Label>
                  <Input
                    id="language"
                    {...register("language")}
                    placeholder="e.g., Thai Sign Language"
                    className={errors.language ? "border-red-500" : ""}
                    aria-describedby="language-help"
                    aria-invalid={errors.language ? "true" : "false"}
                  />
                  <p id="language-help" className="text-sm text-gray-600">
                    Specify the sign language variant or dialect.
                  </p>
                  {errors.language && (
                    <p
                      className="text-sm text-red-500"
                      role="alert"
                      aria-live="polite"
                    >
                      {errors.language.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-base font-semibold">
                    Region *
                  </Label>
                  <Input
                    id="region"
                    {...register("region")}
                    placeholder="e.g., Bangkok"
                    className={errors.region ? "border-red-500" : ""}
                    aria-describedby="region-help"
                    aria-invalid={errors.region ? "true" : "false"}
                  />
                  <p id="region-help" className="text-sm text-gray-600">
                    Specify the regional variant or where this sign is commonly
                    used.
                  </p>
                  {errors.region && (
                    <p
                      className="text-sm text-red-500"
                      role="alert"
                      aria-live="polite"
                    >
                      {errors.region.message}
                    </p>
                  )}
                </div>
              </fieldset>

              {/* Step 5: Actions */}
              <div className="flex justify-end gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading || isTagging}
                  aria-label="Cancel upload and close dialog"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || isTagging}
                  className="relative cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={
                    isUploading
                      ? "Uploading video, please wait"
                      : isTagging
                      ? "Generating tags, please wait"
                      : "Upload video to the platform"
                  }
                >
                  {(isUploading || isTagging) && (
                    <span className="absolute left-4" aria-hidden="true">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="Loading"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                    </span>
                  )}
                  {isUploading
                    ? "Uploading..."
                    : isTagging
                    ? "Generating tags..."
                    : "Upload Video"}
                </Button>
              </div>

              {/* Live region for form status announcements */}
              <div role="status" aria-live="polite" className="sr-only">
                {isUploading && "Video is being uploaded, please wait..."}
                {isTagging && "Generating tags for your video, please wait..."}
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
