"use client";
import TopMenu from "@/components/TopMenu";
import UserFeed from "@/components/UserFeed";
import UserStats from "@/components/UserStats";
import UserVideoList from "@/components/UserVideoList";
import React from "react";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

export default function DashboardPage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#F0F2F5]">
      {/* Top Menu */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] shadow-md h-24 flex items-center">
        <TopMenu />
      </div>

      <div className="w-full flex justify-center items-center bg-[#ffffff] h-16 mt-24 shadow z-40 relative">
        <span className="flex items-center gap-3 text-black text-2xl font-bold tracking-wide">
          {/* Dashboard icon */}
          <DashboardOutlinedIcon fontSize="large" className="text-[#2563eb]" />
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
