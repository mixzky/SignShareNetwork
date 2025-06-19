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

export default function SearchAssistant({ countryId }: { countryId: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Call the smart-search edge function
      const { data: edgeFunctionResponse, error } = await supabase.functions.invoke('smart-search', {
        body: {
          query: searchQuery,
          region: countryId,
          limit: 20
        }
      });

      if (error) {
        console.error('Search error:', error);
        // You might want to display an error message to the user here
        setSearchResults([]); // Clear previous results on error
        setHasSearched(true);
        return;
      }

      // --- FIX IS HERE ---
      // Access the 'results' array from the edgeFunctionResponse object
      const resultsArray = edgeFunctionResponse?.results || [];

      // Transform the results to match the required type
      const transformedResults = resultsArray.map((result: any): SearchResult => ({
        id: result.id, // Ensure ID is always present
        created_at: result.created_at || new Date().toISOString(),
        updated_at: result.updated_at || new Date().toISOString(),
        title: result.title || "No Title", // Provide default for critical fields
        description: result.description || "",
        video_url: result.video_url || "", // Ensure video_url is present
        user_id: result.user_id || "",
        language: result.language || "",
        region: result.region || countryId, // Use result.region if available, else countryId
        status: result.status || "verified", // Default status
        tags: result.tags || [], // Default to empty array if no tags
        similarity: result.similarity, // Optional, might be undefined for text search
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
      // You might want to display an error message to the user here
      setSearchResults([]); // Clear previous results on error
      setHasSearched(true);
    } finally {
      setIsLoading(false);
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
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Search Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : hasSearched && (
        <div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((result) => (
                <VideoCard
                  key={result.id}
                  video={result}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No videos found for your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}