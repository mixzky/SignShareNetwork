"use client";
import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onUpdate,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );
  const [bio, setBio] = useState(user?.user_metadata?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ""
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const supabase = createClient();

      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          bio: bio,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col items-center">
            <div
              onClick={handleAvatarClick}
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer mb-2 hover:opacity-90"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-2xl">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-sm">Change</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your display name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
