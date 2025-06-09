"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Logout from "./Logout";
import EditProfileModal from "./EditProfileModal";
import Image from "next/image";

export default function UserProfileButton() {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error);
      else {
        setUser(data.user);
      }
    };

    getUser();
  }, []);

  const handleProfileUpdate = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.display_name;

  return (
    <div className="relative inline-block">
      <div
        onClick={() => setShowMenu(!showMenu)}
        className="w-16 h-16 rounded-full shadow-lg cursor-pointer flex items-center justify-center text-white text-xl overflow-hidden"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile"
            width={64}
            height={64}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-500 flex items-center justify-center">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {showMenu && (
        <div className="absolute right-0 mt-2 p-4 bg-white rounded-xl shadow-xl w-64 z-10">
          <div className="mb-4">
            <p className="font-semibold">{displayName || user.email}</p>
            {user.user_metadata?.bio && (
              <p className="text-sm text-gray-600 mt-1">
                {user.user_metadata.bio}
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
