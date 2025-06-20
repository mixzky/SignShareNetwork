"use client"
import { useState } from "react";
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

export default function SearchAssistant({ countryId, defaultVideos }: { countryId: string, defaultVideos: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setIsSearchMode(true);
    try {
      const supabase = createClient();

      // Call the smart-search edge function with proper error handling
      const { data, error } = await supabase.functions.invoke<{
        results: SearchResult[];
        error?: string;
      }>('smart-search', {
        body: JSON.stringify({
          query: searchQuery,
          region: countryId,
          limit: 20
        })
      });

      if (error) {
        console.error('Edge function error:', error);
        setSearchResults([]);
        setHasSearched(true);
        return;
      }

      if (!data) {
        console.error('No data returned from search');
        setSearchResults([]);
        setHasSearched(true);
        return;
      }

      if ('error' in data) {
        console.error('Search returned error:', data.error);
        setSearchResults([]);
        setHasSearched(true);
        return;
      }

      // Transform the results to match the required type
      const transformedResults = data.results.map((result: any): SearchResult => ({
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
          role: result.user?.role || "user"
        }
      }));

      setSearchResults(transformedResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error (frontend catch block):', error);
      setSearchResults([]);
      setHasSearched(true);
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
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for signs..."
              value={searchQuery}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      {/* Search Results or Default Videos */}
      <div>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-64 h-36 bg-gray-200 rounded-md flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isSearchMode ? (
          searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div key={result.id} className="w-full">
                  <VideoCard
                    video={result}
                  />
                </div>
              ))}
            </div>
          ) : hasSearched && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No videos found for your search</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {defaultVideos.map((video) => (
              <div key={video.id} className="w-full">
                <VideoCard
                  video={video}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}