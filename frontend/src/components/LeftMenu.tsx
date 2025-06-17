"use client";
import Link from "next/link";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

export default function LeftMenu() {
  return (
    <aside className="hidden md:block sticky top-28 h-[calc(98vh-7rem)] w-84 bg-white rounded-xl shadow-md">
      {/* Left menu content */}
      <div className="p-4 space-y-2">
        <div className="font-bold text-2xl">Trending</div>
        <button className="text-left w-full hover:bg-gray-100 p-2 rounded">
          Home
        </button>
        <button className="text-left w-full hover:bg-gray-100 p-2 rounded">
          Saved
        </button>
        <button className="text-left w-full hover:bg-gray-100 p-2 rounded">
          Trending
        </button>
        <hr className="border-zinc-200 dark:border-zinc-700 mt-100" />
        <div className=" flex flex-col gap-2 pt-6">
          <Link
            href="/"
            className="flex items-center text-xl gap-2 font-semibold text-black hover:text-blue-600 hover:bg-blue-400/10 rounded-xl px-2 py-1 transition"
          >
            <HomeOutlinedIcon fontSize="large" />
            Home
          </Link>
          <Link
            href="/profile"
            className="flex items-center text-xl gap-2 font-semibold text-black hover:text-blue-600 hover:bg-blue-400/10 rounded-xl px-2 py-1 transition"
          >
            <PersonOutlineOutlinedIcon fontSize="large" />
            Profile
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center text-xl gap-2 font-semibold text-black hover:text-blue-600 hover:bg-blue-400/10 rounded-xl px-2 py-1 transition"
          >
            <DashboardOutlinedIcon fontSize="large" />
            Dashboard
          </Link>
        </div>
      </div>
    </aside>
  );
}
