"use client";

import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";
import { getUserProfile } from "@/lib/supabase";

type UserProfileDropdownProps = {
  user: User;
};

type MenuItemProps = {
  active: boolean;
};

type UserProfile = {
  avatar_url: string | null;
  display_name: string | null;
};

export default function UserProfileDropdown({
  user,
}: UserProfileDropdownProps) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile(user.id);
        console.log("Dropdown - loaded profile:", userProfile); // Debug log
        setProfile(userProfile);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    loadProfile();
  }, [user.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          className="flex items-center gap-2 text-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Open user menu"
          aria-haspopup="true"
        >
          <div 
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
            role="img"
            aria-label={profile?.avatar_url ? `Profile picture of ${profile.display_name || user.email}` : "Default profile picture"}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
            ) : (
              <span 
                className="text-sm text-gray-600"
                aria-hidden="true"
              >
                {profile?.display_name?.[0]?.toUpperCase() ||
                  user.email?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <span>{profile?.display_name || user.email}</span>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          className="absolute right-[-50px] mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="px-1 py-1" role="none">
            <Menu.Item>
              {({ active }: MenuItemProps) => (
                <Link
                  href="/profile"
                  className={`${
                    active ? "bg-gray-100" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                  role="menuitem"
                  aria-label="View your profile"
                >
                  View Profile
                </Link>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }: MenuItemProps) => (
                <Link
                  href="/dashboard"
                  className={`${
                    active ? "bg-gray-100" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}
                  role="menuitem"
                  aria-label="Go to your dashboard"
                >
                  Dashboard
                </Link>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1" role="none">
            <Menu.Item>
              {({ active }: MenuItemProps) => (
                <button
                  onClick={handleSignOut}
                  className={`${
                    active ? "bg-gray-100" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600 cursor-pointer`}
                  role="menuitem"
                  aria-label="Sign out of your account"
                >
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
