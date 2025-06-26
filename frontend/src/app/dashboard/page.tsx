import TopMenu from "@/components/TopMenu";
import UserFeed from "@/components/UserFeed";
import UserStats from "@/components/UserStats";
import UserVideoList from "@/components/UserVideoList";
import React from "react";

export default async function DashboardPage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#F0F2F5]">
      {/* Top Menu */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] shadow-md h-24 flex items-center">
        <TopMenu />
      </div>

      <div className="w-full flex justify-center items-center bg-[#ffffff] h-16 mt-24 shadow z-40 relative">
        <span className="flex items-center gap-3 text-black text-2xl font-bold tracking-wide">
          {/* Dashboard icon */}
          <svg
            className="w-8 h-8 text-[#2563eb]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="4"
              fill="#2563eb"
              opacity="0.12"
            />
            <path
              d="M7 17v-2a4 4 0 014-4h2a4 4 0 014 4v2"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="9" r="2" stroke="#2563eb" strokeWidth="2" />
          </svg>
          User's Dashboard
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 mt-10 w-full">
        {/* Two UserStats cards side by side */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-145/192 justify-center items-center">
          <UserFeed />
          <UserStats />
        </div>
        {/* UserVideoList below */}
        <div className="w-full max-w-5xl flex justify-center">
          <UserVideoList />
        </div>
      </div>
    </main>
  );
}
