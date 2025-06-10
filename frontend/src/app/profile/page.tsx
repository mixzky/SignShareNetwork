"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthState, getUserProfile, UserProfile } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuthState();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!initialized || authLoading) {
      console.log("Auth not yet initialized or still loading. Skipping profile load.");
      return;
    }

    if (!user) {
      console.log("User not authenticated after initialization. Redirecting to login...");
      toast.info("Please log in to view your profile.");
      router.replace("/login");
      return;
    }

    const loadUserProfileData = async () => {
      try {
        setLoadingProfile(true);
        console.log("Attempting to load profile for user:", user.id);
        const profileData = await getUserProfile(user.id);
        setProfile(profileData);
        console.log("Profile loaded:", profileData);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error(
          "Failed to load profile. Please ensure it exists or try again."
        );
        router.replace("/");
      } finally {
        setLoadingProfile(false);
      }
    };

    if (user) {
      loadUserProfileData();
    }
  }, [user, initialized, authLoading, router]);

  if (authLoading || !initialized || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You must be logged in to view this page.
            </p>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
              <p className="text-gray-600 mb-4">
                Your profile data could not be loaded. It might need to be
                created.
              </p>
              <Button onClick={() => router.push("/profile/edit")}>
                Create/Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push("/profile/edit")}>
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Avatar and Display Name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl text-gray-500">
                    {profile.display_name
                      ? profile.display_name[0].toUpperCase()
                      : profile.username
                      ? profile.username[0].toUpperCase()
                      : user?.email
                      ? user.email[0].toUpperCase()
                      : "?"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-3xl font-semibold">
                {profile.display_name || profile.username || "N/A"}
              </h3>
              <p className="text-sm text-gray-500">@{profile.username}</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Bio</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Other Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-800">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-gray-800 capitalize">{profile.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-gray-800">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t flex justify-end">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 