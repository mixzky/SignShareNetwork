"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import { User } from "@supabase/supabase-js";
import UserProfileDropdown from "./UserProfileDrowdown";
import { getSupabaseClient } from "@/lib/supabase"; // your wrapper
// or import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="text-white fixed w-full z-50 top-6">
      <div className="max-w-7xl mx-auto px-20">
        <div className="relative flex items-center h-16 justify-center">
          {/* Left section - Home */}
          <div className="absolute left-0 flex-shrink-0 pl-4">
            <Link
              href="/"
              className="text-md opacity-80 hover:opacity-100 transition-opacity"
              style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
            >
              Home
            </Link>
          </div>

          {/* Center section - SignShare Network (largest) */}
          <div className="mx-auto">
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

          {/* Right section - Navigation Items */}
          <div className="absolute right-0 flex items-center gap-6 ">
            {!user ? (
              <Link
                href="/login"
                className="text-md opacity-80 hover:opacity-100 transition-opacity"
                style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
              >
                Login
              </Link>
            ) : (
              <UserProfileDropdown user={user} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
