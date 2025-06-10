"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState, getUserProfile, updateUserProfile, uploadAvatar, deleteAvatar, UserProfile, createUserProfile } from '@/lib/supabase';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuthState();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    console.log('EditProfilePage useEffect running. Initial state: initialized=', initialized, 'authLoading=', authLoading, 'user=', user ? user.id : 'null');

    if (!initialized || authLoading) {
      console.log('Auth not yet initialized or still loading. Skipping profile load.');
      return;
    }

    if (!user) {
      console.log('User not authenticated after initialization. Redirecting to login...');
      toast.info('Please log in to edit your profile.');
      router.replace('/login');
      return;
    }

    const loadUserProfileData = async () => {
      try {
        setLoadingProfile(true); 
        console.log('Attempting to load profile for user:', user.id);
        const profileData = await getUserProfile(user.id);
        console.log('*** DEBUG: profileData immediately after getUserProfile (before null check):', profileData);
        setProfile(profileData);

        if (!profileData) {
          console.log('*** DEBUG: No profile data received. Setting display/bio to empty, avatar to null, and returning.');
          setDisplayName('');
          setBio('');
          setAvatarPreview(null);
          setLoadingProfile(false); // Ensure loading is false even if no profile
          return; // Exit early if no profile data
        }

        console.log('*** DEBUG: Reached line 53: profileData is NOT null. Value:', profileData); // NEW: Check right before the error line
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        if (profileData.avatar_url) {
          setAvatarPreview(profileData.avatar_url);
        } else {
          setAvatarPreview(null); // Ensure avatar preview is null if no URL
        }
        console.log('Profile loaded successfully:', profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile. Please ensure it exists or try again.');
        router.replace('/profile');
      } finally {
        setLoadingProfile(false); // Finish loading profile data
      }
    };

    // If user is available after initialization, load their profile
    if (user) {
      loadUserProfileData();
    }
  }, [user, initialized, authLoading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('User is not authenticated.');
      return;
    }

    try {
      setSaving(true);
      let newAvatarUrl = profile?.avatar_url; // Use optional chaining for profile
      let updatedProfile: UserProfile;

      // Handle avatar upload/deletion
      if (avatarFile) {
        if (profile?.avatar_url) { // Use optional chaining
          try {
            await deleteAvatar(user.id, profile.avatar_url);
            console.log('Old avatar successfully marked for deletion.');
          } catch (deleteError) {
            console.warn('Failed to delete old avatar from storage (non-blocking):', deleteError);
          }
        }
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
        toast.success('New avatar uploaded.');
      } else if (!avatarFile && avatarPreview === null && profile?.avatar_url) { // Use optional chaining
        try {
          await deleteAvatar(user.id, profile.avatar_url);
          console.log('Existing avatar successfully deleted from storage.');
          newAvatarUrl = null;
        } catch (deleteError) {
          console.error('Failed to delete avatar from storage:', deleteError);
          toast.error('Failed to remove avatar from storage. Please try again.');
          setSaving(false);
          return;
        }
      } else if (profile) { // Only assign if profile exists to avoid issues if it's new
        newAvatarUrl = profile.avatar_url;
      }

      const baseUpdates = {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: newAvatarUrl,
      };

      if (!profile) {
        // Create new profile
        const username = user.email?.split('@')[0] || user.id; // Derive username from email or use user ID as fallback
        updatedProfile = await createUserProfile(user.id, username, baseUpdates);
        toast.success('Profile created successfully!');
      } else {
        // Update existing profile
        updatedProfile = await updateUserProfile(user.id, baseUpdates);
        toast.success('Profile updated successfully!');
      }
      
      setProfile(updatedProfile);

      router.push('/profile');
    } catch (error) {
      console.error('Error updating/creating profile:', error);
      toast.error(`Failed to update/create profile: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // --- Conditional Rendering ---
  if (authLoading || !initialized || loadingProfile) {
    console.log('Rendering loading state: authLoading=', authLoading, 'initialized=', initialized, 'loadingProfile=', loadingProfile);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    console.log('Rendering access denied: user is null.');
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You must be logged in to view this page.
            </p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    console.log('Rendering profile data missing: profile is null.');
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Profile Data Missing</h2>
              <p className="text-gray-600 mb-4">
                We couldn't find your profile data. It might need to be created or there was an issue.
              </p>
              <Button onClick={() => router.push('/profile')}>
                Back to Profile
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
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Avatar Section */}
            <div>
              <Label className="text-base font-semibold">Profile Picture</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative">
                  {avatarPreview || profile.avatar_url ? (
                    <img
                      src={avatarPreview || profile.avatar_url!}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-500">
                        {displayName ? displayName[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="w-auto"
                    />
                  </div>
                  {(avatarPreview || profile.avatar_url) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                maxLength={50}
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {bio.length}/500 characters
              </p>
            </div>

            {/* Read-only fields */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label>Username</Label>
                <Input
                  value={profile.username}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Username cannot be changed.
                </p>
              </div>

              <div>
                <Label>Role</Label>
                <Input
                  value={profile.role}
                  disabled
                  className="bg-gray-50 capitalize"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}