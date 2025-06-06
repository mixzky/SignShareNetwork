"use client";
import Link from "next/link";

export default function TopMenu() {
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

          {/* Right section - Login */}
          <div className="flex-shrink-0">
            <Link
              href="/login"
              className="text-md opacity-80 hover:opacity-100 transition-opacity"
              style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
