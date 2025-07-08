"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getUserProfile, formatDate } from "@/lib/supabase";
import { toast } from "sonner";
import TopMenu from "@/components/TopMenu";
import Particles from "react-tsparticles";
import { User } from "lucide-react"; // Add this import at the top

type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        console.log("Profile page user:", user);
        if (!user) {
          router.push("/login");
          return;
        }

        const userProfile = await getUserProfile(user.id);
        console.log("Loaded user profile:", userProfile); // Debug log
        setProfile(userProfile);
        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile. Please try again.");
        setLoading(false);

        // Retry up to 3 times
        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => loadProfile(), 1000); // Retry after 1 second
        }
      }
    };

    loadProfile();
  }, [router, retryCount]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading profile"
      >
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        className="container max-w-2xl py-8"
        role="alert"
        aria-live="polite"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
              <p className="text-gray-600 mb-4">
                We couldn't load your profile. Please try again.
              </p>
              <Button 
                onClick={() => setRetryCount(0)}
                aria-label="Retry loading profile"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <User className="w-8 h-8 text-[#2563eb]" aria-hidden="true" />
          User Profile
        </span>
      </div>
      {/* Center the card vertically and horizontally */}
      <div className="flex items-center justify-center mt-20">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div 
                className="flex items-center gap-4"
                role="region"
                aria-label="Profile information"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.display_name}'s profile picture`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"
                    role="img"
                    aria-label={`${profile.display_name}'s profile picture placeholder`}
                  >
                    <span className="text-2xl text-gray-500">
                      {profile.display_name?.[0] || "?"}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                  <p className="text-gray-600">@{profile.username}</p>
                </div>
              </div>

              <div 
                role="region"
                aria-labelledby="about-heading"
              >
                <h3 id="about-heading" className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-600">{profile.bio || "No bio yet."}</p>
              </div>

              <div 
                role="region"
                aria-labelledby="account-details-heading"
              >
                <h3 id="account-details-heading" className="text-lg font-semibold mb-2">Account Details</h3>
                <div 
                  className="space-y-2 bg-[#dedede] rounded-2xl p-4"
                  role="list"
                >
                  <p role="listitem">
                    <span className="font-medium">Role:</span>{" "}
                    <span className="capitalize">{profile.role}</span>
                  </p>
                  <p role="listitem">
                    <span className="font-medium">Member since:</span>{" "}
                    <time dateTime={profile.created_at}>
                      {formatDate(profile.created_at)}
                    </time>
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push("/profile/edit")}
                className="cursor-pointer"
                aria-label="Edit your profile"
              >
                Edit Profile
              </Button>
            </div>
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
