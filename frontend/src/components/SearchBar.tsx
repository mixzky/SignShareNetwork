"use client";

import { useState } from "react";
import { BiSearch } from "react-icons/bi";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div
          className={`flex items-center border transition-all duration-300 rounded-full overflow-hidden ${
            isSearchFocused
              ? "bg-black/50 border-blue-400/50 pr-2"
              : "bg-black/40 border-gray-600/30 pr-0"
          }`}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={placeholder}
            className="bg-transparent outline-none px-3 py-1.5 w-full transition-all duration-300 placeholder-gray-400 text-sm text-white"
            style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}
          />
          <button
            type="submit"
            className={`flex items-center justify-center rounded-full transition-all duration-300 ${
              isSearchFocused
                ? "text-blue-400 bg-blue-400/10 p-1"
                : "text-white/70 p-0.5"
            }`}
            aria-label="Search"
          >
            <BiSearch size={16} />
          </button>
        </div>

        {/* Subtle glow effect when focused */}
        {isSearchFocused && (
          <div className="absolute inset-0 -z-10 rounded-full blur-sm bg-blue-500/10"></div>
        )}
      </form>
    </div>
  );
}
