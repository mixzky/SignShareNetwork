"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Logout from "./Logout";
import EditProfileModal from "./EditProfileModal";
import { getUserProfile } from "@/lib/supabase";

type UserProfile = {
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
};
export default function UserProfileButton() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        return;
      }
      
      setUser(data.user);
      
      if (data.user) {
        try {
          const userProfile = await getUserProfile(data.user.id);
          console.log('Loaded profile:', userProfile); // Debug log
          setProfile(userProfile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };

    getUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const userProfile = await getUserProfile(session.user.id);
          console.log('Auth change - loaded profile:', userProfile); // Debug log
          setProfile(userProfile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProfileUpdate = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id);
        console.log('Updated profile:', userProfile); // Debug log
        setProfile(userProfile);
      } catch (err) {
        console.error('Error updating profile:', err);
      }
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="relative inline-block">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className="w-16 h-16 rounded-full shadow-lg cursor-pointer flex items-center justify-center text-white text-xl overflow-hidden"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-500 flex items-center justify-center">
            {profile.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {showMenu && (
        <div className="absolute right-0 mt-2 p-4 bg-white rounded-xl shadow-xl w-64 z-10">
          <div className="mb-4">
            <p className="font-semibold">{profile.display_name || user.email}</p>
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-1">
                {profile.bio}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setShowEditModal(true);
              setShowMenu(false);
            }}
            className="w-full bg-blue-500 text-white py-2 rounded mb-2 hover:bg-blue-600"
          >
            Edit Profile
          </button>
          <Logout />
        </div>
      )}

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}