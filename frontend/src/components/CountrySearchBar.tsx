"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTags } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function CountrySearchBar() {
  const router = useRouter();
  const params = useParams();
  const regionId = params.id;

  const [searchWord, setSearchWord] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTagIndex, setSelectedTagIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchWord.trim().length >= 1) {
      router.push(
        `/country/${regionId}?search=${encodeURIComponent(searchWord.trim())}`
      );
      // Announce search to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "assertive");
      announcement.className = "sr-only";
      announcement.textContent = `Searching for "${searchWord.trim()}" in videos`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
    } else {
      // If search is empty, go to /country/regionId (remove all search/tag params)
      router.push(`/country/${regionId}`);
      // Announce clearing search
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.className = "sr-only";
      announcement.textContent = "Search cleared, showing all videos";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 3000);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchWord.length >= 3) {
        fetchAndSetTags(searchWord);
        setSelectedTagIndex(-1); // Reset selection when new suggestions load
      } else {
        setTags([]);
        setSelectedTagIndex(-1);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchWord]);

  const fetchAndSetTags = async (word: string) => {
    setLoading(true);
    try {
      const tags = await fetchTags(word);
      setTags(tags);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
    setSelectedTagIndex(-1); // Reset tag selection on input change
  };

  // Handle keyboard navigation for tag suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (tags.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedTagIndex((prev) => (prev + 1) % tags.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedTagIndex((prev) => (prev <= 0 ? tags.length - 1 : prev - 1));
        break;
      case "Enter":
        if (selectedTagIndex >= 0 && selectedTagIndex < tags.length) {
          e.preventDefault();
          onTagClick(tags[selectedTagIndex]);
        }
        break;
      case "Escape":
        setTags([]);
        setSelectedTagIndex(-1);
        inputRef.current?.focus();
        break;
    }
  };

  // Navigate to the same region page with the tag query parameter
  const onTagClick = (tag: string) => {
    router.push(`/country/${regionId}?tag=${encodeURIComponent(tag)}`);
    // Announce navigation to screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = `Filtering videos by tag: ${tag}`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 3000);
  };

  // Hide tag suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setTags([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-2xl mx-auto p-4 mb-8 relative"
      role="search"
      aria-label="Search for sign language videos"
    >
      <form className="w-full" onSubmit={onSubmit}>
        <div className="relative">
          <label htmlFor="country-search" className="sr-only">
            Search for sign language videos by keyword
          </label>
          <input
            id="country-search"
            ref={inputRef}
            type="text"
            placeholder="search a keyword"
            value={searchWord}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-6 py-4 pr-12 rounded-full border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg transition duration-200 ease-in-out shadow-sm"
            aria-autocomplete="list"
            aria-controls="tag-listbox"
            aria-expanded={tags.length > 0}
            aria-describedby="search-help"
            aria-activedescendant={
              selectedTagIndex >= 0 ? `tag-option-${selectedTagIndex}` : ""
            }
          />
          <p id="search-help" className="sr-only">
            Type at least 3 characters to see suggested tags. Use arrow keys to
            navigate suggestions, Enter to select, or Escape to close. Press
            Enter to search, or click on a suggested tag to filter.
          </p>
          {searchWord && (
            <button
              type="button"
              onClick={() => {
                setSearchWord("");
                setTags([]);
                setSelectedTagIndex(-1);
                // Announce clearing to screen readers
                const announcement = document.createElement("div");
                announcement.setAttribute("role", "status");
                announcement.setAttribute("aria-live", "polite");
                announcement.className = "sr-only";
                announcement.textContent = "Search field cleared";
                document.body.appendChild(announcement);
                setTimeout(() => document.body.removeChild(announcement), 2000);
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 rounded text-2xl"
              aria-label="Clear search field"
              tabIndex={0}
            >
              ×
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute left-4 right-4 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg px-6 py-3 flex justify-center items-center z-10"
            role="status"
            aria-live="polite"
            aria-label="Loading tag suggestions"
          >
            <span className="text-base text-blue-700 font-medium animate-pulse">
              Suggesting tags...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && tags.length > 0 && (
          <motion.ul
            id="tag-listbox"
            role="listbox"
            key="tags"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute left-4 right-4 mt-2 flex justify-center gap-3 flex-wrap bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-10"
            aria-label={`${tags.length} suggested tags`}
          >
            {tags.map((tag, index) => (
              <li
                key={tag}
                id={`tag-option-${index}`}
                role="option"
                aria-selected={selectedTagIndex === index}
                onClick={() => onTagClick(tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTagClick(tag);
                  }
                }}
                className={`bg-blue-100 text-blue-800 text-base font-medium px-5 py-2 rounded-full cursor-pointer transition hover:bg-blue-200 focus:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedTagIndex === index
                    ? "ring-2 ring-blue-500 bg-blue-200"
                    : ""
                }`}
                tabIndex={0}
                aria-label={`Filter by tag: ${tag}`}
              >
                {tag}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
