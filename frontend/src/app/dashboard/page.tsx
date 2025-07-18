"use client";
import TopMenu from "@/components/TopMenu";
import UserFeed from "@/components/UserFeed";
import UserStats from "@/components/UserStats";
import UserVideoList from "@/components/UserVideoList";
import React, { useState, useEffect } from "react";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

// Screen reader only CSS
const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .sr-only.focus\\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds loading time

    // Animate loading bar
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15; // Random increment for realistic feel
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);

  // Add keyboard event handler for better navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Alt + M to go to main content
    if (event.altKey && event.key === "m") {
      event.preventDefault();
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <main
      className="flex flex-col min-h-screen bg-[#F0F2F5]"
      onKeyDown={handleKeyDown}
      aria-label="Dashboard main content"
    >
      <style dangerouslySetInnerHTML={{ __html: srOnlyStyles }} />

      {/* Page announcement for screen readers */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        You are now on the User Dashboard page. This page contains your
        statistics, activity feed, and video management tools.
      </div>

      {/* Top Menu */}
      <div
        className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] shadow-md h-24 flex items-center"
        role="banner"
        aria-label="Site navigation"
      >
        <TopMenu />
      </div>

      <div
        className="w-full flex justify-center items-center bg-[#ffffff] h-16 mt-24 shadow z-40 relative"
        role="region"
        aria-label="Page header"
      >
        <h1 className="text-black text-2xl font-bold tracking-wide">
          <span className="flex items-center gap-3">
            <DashboardOutlinedIcon
              fontSize="large"
              className="text-[#2563eb]"
              aria-hidden="true"
            />
            User's Dashboard
          </span>
        </h1>
      </div>

      {/* Loading Bar */}
      {isLoading && (
        <div className="w-full bg-gray-200 h-1 relative overflow-hidden z-30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(loadingProgress, 100)}%` }}
            role="progressbar"
            aria-valuenow={Math.min(loadingProgress, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Dashboard loading progress"
          />
          {/* Animated shimmer effect */}
          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>
      )}

      <div
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-10 mt-10 w-full"
        role="main"
        aria-label="Dashboard content"
        tabIndex={-1}
      >
        {/* Two components side by side */}
        <section
          id="user-stats"
          className="flex flex-col md:flex-row gap-8 w-full max-w-145/192 justify-center items-center"
          role="region"
          aria-labelledby="overview-heading"
        >
          <h2 id="overview-heading" className="sr-only">
            Activity and Statistics Overview
          </h2>
          <UserFeed />
          <UserStats />
        </section>

        {/* UserVideoList below */}
        <section
          id="video-management"
          className="w-full max-w-5xl flex justify-center"
          role="region"
          aria-labelledby="video-heading"
        >
          <h2 id="video-heading" className="sr-only">
            Video Management
          </h2>
          <UserVideoList />
        </section>
      </div>
    </main>
  );
}
