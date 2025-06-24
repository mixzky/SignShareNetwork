import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database";

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
};

// Cache for user profile data
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId: string) => {
  // Check cache first
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  // Update cache
  profileCache.set(userId, { data, timestamp: Date.now() });
  return data;
};

export const updateUserProfile = async (
  userId: string,
  updates: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
  }
) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  // Update cache
  profileCache.set(userId, { data, timestamp: Date.now() });
  return data;
};

export async function fetchTags(word: string): Promise<string[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search-tags`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ search_word: word }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch tags");
  }

  const data = await res.json();
  return data.tags || [];
}

export const fetchVideoUploadStats = async () => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("get_latest_upload_stats");

  if (error) {
    console.error("Error fetching latest stats:", error);
    throw error;
  }

  interface UploadStats {
    upload_count: number;
    [key: string]: any;
  }

  const sorted = (data as UploadStats[]).sort(
    (a, b) => b.upload_count - a.upload_count
  );

  return sorted;
};

export const getReviewsByVideoId = async (videoId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      user_id,
      rating,
      comment,
      user:users (
        id,
        avatar_url,
        display_name
      )
    `
    )
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const uploadAvatar = async (userId: string, file: File) => {
  const supabase = getSupabaseClient();

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file");
  }

  // Get file extension and create unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  // Create path: userId/filename to match RLS policies
  const filePath = `${userId}/${fileName}`;
  console.log("Uploading avatar with path:", filePath); // Debug log

  try {
    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatar")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(
        "Supabase upload error:",
        uploadError,
        JSON.stringify(uploadError)
      );
      throw uploadError;
    }

    console.log("Upload successful:", uploadData); // Debug log

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatar")
      .getPublicUrl(filePath);

    console.log("Generated public URL:", urlData); // Debug log

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      throw updateError;
    }

    console.log("Profile updated with URL:", urlData.publicUrl); // Debug log
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadAvatar:", error);
    throw error;
  }
};

export const deleteAvatar = async (userId: string, avatarUrl: string) => {
  const supabase = getSupabaseClient();

  try {
    // Extract filename from URL
    const urlParts = avatarUrl.split("/");
    const filePath = `${userId}/${urlParts[urlParts.length - 1]}`;

    const { error } = await supabase.storage.from("avatar").remove([filePath]);

    if (error) {
      console.error("Error deleting avatar:", error);
      throw error;
    }

    // Update user profile to remove avatar_url
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      throw updateError;
    }
  } catch (error) {
    console.error("Error in deleteAvatar:", error);
    throw error;
  }
};

type TagCount = {
  tag: string;
  tag_count: number;
};

export const getMostTagsByCountry = async (
  country: string
): Promise<TagCount[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("get_most_tags_by_country", {
    country_param: country,
  });

  if (error) {
    console.error("Failed to fetch tags by country:", error);
    throw error;
  }

  return data as TagCount[];
};

export const uploadVideo = async (userId: string, file: File) => {
  const supabase = getSupabaseClient();

  // Validate file type
  if (!file.type.startsWith("video/")) {
    throw new Error("Please upload a video file");
  }

  // Get file extension and create unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  // Create path: userId/filename to match RLS policies
  const filePath = `${userId}/${fileName}`;
  console.log("Uploading video with path:", filePath); // Debug log

  try {
    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("video")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(
        "Supabase upload error:",
        uploadError,
        JSON.stringify(uploadError)
      );
      throw uploadError;
    }

    console.log("Upload successful:", uploadData); // Debug log

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("video")
      .getPublicUrl(filePath);
 
    console.log("Generated public URL:", urlData); // Debug log

    // Return both the public URL and the storage path
    return {
      publicUrl: urlData.publicUrl,
      storagePath: `video/${filePath}`, // Include bucket name in the path
    };
  } catch (error) {
    console.error("Error in uploadVideo:", error);
    throw error;
  }
};
