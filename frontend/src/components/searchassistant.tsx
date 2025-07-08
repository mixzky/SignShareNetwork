"use client";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import VideoCard from "./VideoCard";

interface SearchResult {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  video_url: string;
  user_id: string;
  language: string;
  region: string;
  status: "verified" | "pending" | "flagged" | "processing";
  tags: string[];
  similarity?: number;
  user: {
    avatar_url: string | null;
    display_name: string;
    role: string;
  };
}

export default function SearchAssistant({
  countryId,
  defaultVideos,
}: {
  countryId: string;
  defaultVideos: any[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Function to announce messages to screen readers
  const announceToScreenReader = (
    message: string,
    priority: "polite" | "assertive" = "polite"
  ) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      statusRef.current.setAttribute("aria-live", priority);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setHasSearched(false);
      announceToScreenReader("Search cleared, showing default videos");
      return;
    }

    setIsLoading(true);
    setIsSearchMode(true);
    announceToScreenReader(`Searching for "${searchQuery}"...`, "assertive");

    try {
      const supabase = createClient();

      // Call the smart-search edge function with proper error handling
      const { data, error } = await supabase.functions.invoke<{
        results: SearchResult[];
        error?: string;
      }>("smart-search", {
        body: JSON.stringify({
          query: searchQuery,
          region: countryId,
          limit: 20,
        }),
      });

      if (error) {
        console.error("Edge function error:", error);
        setSearchResults([]);
        setHasSearched(true);
        announceToScreenReader("Search failed. Please try again.", "assertive");
        return;
      }

      if (!data) {
        console.error("No data returned from search");
        setSearchResults([]);
        setHasSearched(true);
        announceToScreenReader(
          "No search results returned. Please try again.",
          "assertive"
        );
        return;
      }

      if ("error" in data) {
        console.error("Search returned error:", data.error);
        setSearchResults([]);
        setHasSearched(true);
        announceToScreenReader(
          "Search encountered an error. Please try again.",
          "assertive"
        );
        return;
      }

      // Transform the results to match the required type
      const transformedResults = data.results.map(
        (result: any): SearchResult => ({
          id: result.id,
          created_at: result.created_at || new Date().toISOString(),
          updated_at: result.updated_at || new Date().toISOString(),
          title: result.title || "No Title",
          description: result.description || "",
          video_url: result.video_url || "",
          user_id: result.user_id || "",
          language: result.language || "",
          region: result.region || countryId,
          status: result.status || "verified",
          tags: result.tags || [],
          similarity: result.similarity,
          user: {
            avatar_url: result.user?.avatar_url || null,
            display_name: result.user?.display_name || "Unknown User",
            role: result.user?.role || "user",
          },
        })
      );

      setSearchResults(transformedResults);
      setHasSearched(true);
      announceToScreenReader(
        transformedResults.length > 0
          ? `Search completed. Found ${transformedResults.length} video${
              transformedResults.length === 1 ? "" : "s"
            }.`
          : "Search completed. No videos found for your search."
      );
    } catch (error) {
      console.error("Search error (frontend catch block):", error);
      setSearchResults([]);
      setHasSearched(true);
      announceToScreenReader(
        "Search failed due to a connection error. Please try again.",
        "assertive"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      setIsSearchMode(false);
      setHasSearched(false);
      announceToScreenReader("Search cleared", "polite");
    }
  };

  // Focus management on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      {/* Screen reader only heading */}
      <h2 className="sr-only">Smart Search for Sign Language Videos</h2>

      {/* Screen reader status announcements */}
      <div
        ref={statusRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></div>

      <form
        onSubmit={handleSearch}
        className="mb-6"
        role="search"
        aria-label="Search for sign language videos"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="smart-search-input" className="sr-only">
              Search for sign language videos using natural language or keywords
            </label>
            <Input
              id="smart-search-input"
              ref={searchInputRef}
              type="text"
              placeholder="Search for signs..."
              value={searchQuery}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-describedby="search-help"
              autoComplete="off"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              aria-hidden="true"
            />
            <p id="search-help" className="sr-only">
              Use natural language to search for sign language videos. Examples:
              "how to say hello", "numbers in sign language", or simple
              keywords.
            </p>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby="search-button-help"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
          <p id="search-button-help" className="sr-only">
            Press Enter or click this button to search for videos
          </p>
        </div>
      </form>

      {/* Search Results or Default Videos */}
      <main role="main" aria-label="Video search results">
        {isLoading ? (
          <section aria-label="Loading search results" role="status">
            <h3 className="sr-only">Loading Results</h3>
            <div className="space-y-4" aria-busy="true">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md p-4 animate-pulse"
                  role="presentation"
                >
                  <div className="flex gap-4">
                    <div
                      className="w-64 h-36 bg-gray-200 rounded-md flex-shrink-0"
                      aria-hidden="true"
                    ></div>
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-200 rounded w-3/4 mb-2"
                        aria-hidden="true"
                      ></div>
                      <div
                        className="h-4 bg-gray-200 rounded w-1/2"
                        aria-hidden="true"
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="sr-only">Searching for videos, please wait...</p>
          </section>
        ) : isSearchMode ? (
          searchResults.length > 0 ? (
            <section aria-label={`Search results for "${searchQuery}"`}>
              <h3 className="sr-only">
                Search Results ({searchResults.length} videos found)
              </h3>
              <div className="space-y-4" role="list">
                {searchResults.map((result, index) => (
                  <div key={result.id} className="w-full" role="listitem">
                    <VideoCard video={result} />
                    {/* Screen reader only result context */}
                    <span className="sr-only">
                      Result {index + 1} of {searchResults.length}
                      {result.similarity &&
                        ` (${Math.round(result.similarity * 100)}% match)`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            hasSearched && (
              <section aria-label="No search results" role="status">
                <div className="text-center py-8">
                  <h3 className="sr-only">No Results Found</h3>
                  <p className="text-gray-500 text-lg">
                    No videos found for your search
                  </p>
                  <p className="sr-only">
                    Try different keywords or check your spelling. You can also
                    browse the default videos below.
                  </p>
                </div>
              </section>
            )
          )
        ) : (
          <section aria-label="Default videos for this region">
            <h3 className="sr-only">
              Featured Videos ({defaultVideos.length} videos)
            </h3>
            <div className="space-y-4" role="list">
              {defaultVideos.map((video, index) => (
                <div key={video.id} className="w-full" role="listitem">
                  <VideoCard video={video} />
                  <span className="sr-only">
                    Featured video {index + 1} of {defaultVideos.length}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
