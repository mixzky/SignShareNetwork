'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser, getUserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

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
          router.push('/login');
          return;
        }

        const userProfile = await getUserProfile(user.id);
        console.log("Loaded user profile:", userProfile); // Debug log
        setProfile(userProfile);
        setLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile. Please try again.');
        setLoading(false);
        
        // Retry up to 3 times
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadProfile(), 1000); // Retry after 1 second
        }
      }
    };

    loadProfile();
  }, [router, retryCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
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
                We couldn't load your profile. Please try again.
              </p>
              <Button onClick={() => setRetryCount(0)}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {profile.display_name?.[0] || '?'}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                <p className="text-gray-600">@{profile.username}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-gray-600">
                {profile.bio || 'No bio yet.'}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Account Details</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Role:</span>{' '}
                  <span className="capitalize">{profile.role}</span>
                </p>
                <p>
                  <span className="font-medium">Member since:</span>{' '}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button onClick={() => router.push('/profile/edit')}>
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 