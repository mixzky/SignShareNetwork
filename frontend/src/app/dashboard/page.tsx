import TopMenu from "@/components/TopMenu";
import UserStats from "@/components/UserStats";
import UserVideoList from "@/components/UserVideoList";
import React from "react";

export default async function DashboardPage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#F0F2F5]">
      {/* Top Menu */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] h-24 flex items-center">
        <TopMenu />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 mt-36">
        <UserStats />
        <UserVideoList />
      </div>
    </main>
  );
}
