"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import Logout from "./Logout";
import { User } from "@supabase/supabase-js";
import UserProfileButton from "./UserProfileButton";

export default function TopMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);
  return (
    <nav className="text-white fixed w-full z-50 top-6">
      <div className="max-w-7xl mx-auto px-20">
        <div className="flex justify-between items-center h-16">
          {/* Left section - Home */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-md opacity-80 hover:opacity-100 transition-opacity"
              style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
            >
              Home
            </Link>
          </div>

          {/* Center section - SignShare Network (largest) */}
          <div className="flex-grow text-center">
            <Link
              href="/"
              className="text-3xl md:text-4xl font-bold text-white"
              style={{
                textShadow:
                  "0 4px 8px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              SignShare Network
            </Link>
          </div>

          {/* Right section - Login/Logout */}
          <div className="flex-shrink-0">
            {!user ? (
              <Link
                href="/login"
                className="text-md opacity-80 hover:opacity-100 transition-opacity"
                style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
              >
                Login
              </Link>
            ) : (
              <div
                className="flex items-center gap-x-2 text-md opacity-80 hover:opacity-100 transition-opacity"
                style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
              >
                <span>{user.email}</span>
                <Logout />
              </div>
            )}
          </div>
          {/* User Profile Button */}
          <UserProfileButton />
        </div>
      </div>
    </nav>
  );
}
