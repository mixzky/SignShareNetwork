"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import TopMenu from "@/components/TopMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
} from "@/lib/supabase";
import { Pencil } from "lucide-react";

const profileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const loadProfile = async () => {
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

        reset({
          display_name: profile.display_name || "",
          bio: profile.bio || "",
        });
        setAvatarUrl(profile.avatar_url || undefined);
        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
        router.push("/profile");
      }
    };

    loadProfile();
  }, [router, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await updateUserProfile(userId, {
        ...data,
        avatar_url: avatarUrl,
      });
      toast.success("Profile updated successfully");
      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files || !e.target.files[0]) return;

    try {
      setUploading(true);
      const file = e.target.files[0];

      // Delete old avatar if exists
      if (avatarUrl) {
        await deleteAvatar(userId, avatarUrl);
      }

      // Upload new avatar
      const newAvatarUrl = await uploadAvatar(userId, file);
      setAvatarUrl(newAvatarUrl);
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading profile editor"
      >
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#F0F2F5] relative overflow-hidden"
      role="main"
    >
      {/* TopMenu fixed */}
      <div 
        className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] h-24 flex items-center"
        role="banner"
      >
        <TopMenu />
      </div>
      <div 
        className="w-full flex justify-center items-center bg-[#ffffff] h-16 mt-24 shadow z-40 relative"
        role="heading"
        aria-level={1}
      >
        <span className="flex items-center gap-3 text-black text-2xl font-bold tracking-wide">
          <Pencil className="w-8 h-8 text-[#2563eb]" aria-hidden="true" />
          Edit Profile
        </span>
      </div>
      {/* Center the card vertically and horizontally */}
      <div className="flex items-center justify-center mt-20">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
              aria-label="Edit profile form"
            >
              <div className="space-y-4">
                <div 
                  className="flex items-center gap-4"
                  role="group"
                  aria-labelledby="avatar-label"
                >
                  <div className="relative w-24 h-24">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Your profile picture"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center"
                        role="img"
                        aria-label="Profile picture placeholder"
                      >
                        <span className="text-2xl text-gray-500" aria-hidden="true">?</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label id="avatar-label" htmlFor="avatar">Profile Picture</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                      className="mt-1 cursor-pointer"
                      aria-describedby="avatar-status"
                    />
                    {uploading && (
                      <p 
                        id="avatar-status" 
                        className="text-sm text-gray-500 mt-1"
                        role="status"
                        aria-live="polite"
                      >
                        Uploading...
                      </p>
                    )}
                  </div>
                </div>

                <div role="group" aria-labelledby="name-label">
                  <Label id="name-label" htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    {...register("display_name")}
                    className="mt-1"
                    aria-describedby={errors.display_name ? "name-error" : undefined}
                    aria-invalid={errors.display_name ? "true" : "false"}
                  />
                  {errors.display_name && (
                    <p 
                      id="name-error" 
                      className="text-sm text-red-500 mt-1"
                      role="alert"
                    >
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                <div role="group" aria-labelledby="bio-label">
                  <Label id="bio-label" htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register("bio")}
                    className="mt-1"
                    rows={4}
                    aria-describedby={errors.bio ? "bio-error" : undefined}
                    aria-invalid={errors.bio ? "true" : "false"}
                  />
                  {errors.bio && (
                    <p 
                      id="bio-error" 
                      className="text-sm text-red-500 mt-1"
                      role="alert"
                    >
                      {errors.bio.message}
                    </p>
                  )}
                </div>
              </div>

              <div 
                className="flex justify-end gap-4"
                role="group"
                aria-label="Form actions"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => router.push("/profile")}
                  aria-label="Cancel editing profile"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                  aria-label={isSubmitting ? "Saving changes..." : "Save profile changes"}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Animated blobs - decorative elements */}
      <div 
        className="absolute top-[-60px] left-[-60px] w-72 h-72 bg-blue-200 rounded-full opacity-30 animate-pulse"
        aria-hidden="true"
      ></div>
      <div 
        className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-pink-200 rounded-full opacity-20 animate-pulse"
        aria-hidden="true"
      ></div>
    </div>
  );
}
