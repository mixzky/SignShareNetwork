"use client";
import GlobeComponent from "@/components/GlobeComponent";
import TopMenu from "@/components/TopMenu";
import { useState, useRef, useEffect, useCallback } from "react";
import CountryLoading from "@/components/CountryLoading";
import { BiSearch } from "react-icons/bi";
import * as d3 from "d3-geo";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  let countryNavi: string | null = null;
  const globeRef = useRef<{
    pointOfView: (
      view: { lat: number; lng: number; altitude: number },
      duration: number
    ) => void;
  } | null>(null);
  const [countries, setCountries] = useState<
    GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]
  >([]);
  const [countryNow, setCountryNow] = useState<string>("");

  // Track timeouts for cleanup
  const activeTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
      activeTimeouts.current.clear();
    };
  }, []);

  // Function to load countries data if not already loaded
  const loadCountriesData = async () => {
    if (countries.length === 0) {
      try {
        const res = await fetch(
          "https://unpkg.com/world-atlas/countries-110m.json"
        );
        const worldData = await res.json();
        const topojson = await import("topojson-client");

        const countriesData = (
          topojson.feature(
            worldData,
            worldData.objects.countries
          ) as unknown as GeoJSON.FeatureCollection<
            GeoJSON.Geometry,
            GeoJSON.GeoJsonProperties
          >
        ).features;

        setCountries(countriesData);
        return countriesData;
      } catch (error) {
        console.error("Error loading countries data:", error);
        return [];
      }
    }
    return countries;
  };

  async function handleSearch(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    console.log(`Searching for: ${searchQuery}`);

    // Load countries data if not already loaded
    const countriesData = await loadCountriesData();

    // More intelligent search logic
    const searchLower = searchQuery.toLowerCase().trim();

    // If search is just one letter and not a country code, require more characters
    if (searchLower.length === 1) {
      console.log("Please enter at least 2 characters to search");
      return;
    }

    // Search priority:
    // 1. Exact match
    // 2. Starts with search query
    // 3. Contains search query
    let foundCountry = countriesData.find(
      (country: any) => country.properties.name.toLowerCase() === searchLower
    );

    if (!foundCountry) {
      foundCountry = countriesData.find((country: any) =>
        country.properties.name.toLowerCase().startsWith(searchLower)
      );
    }

    if (!foundCountry) {
      // For partial matches, only consider if search is at least 3 characters
      if (searchLower.length >= 3) {
        foundCountry = countriesData.find((country: any) =>
          country.properties.name.toLowerCase().includes(searchLower)
        );
      }
    }

    if (foundCountry) {
      if (foundCountry.properties) {
        console.log(`Found country: ${foundCountry.properties.name}`);
        setCountryNow(foundCountry.properties.name);
        countryNavi = foundCountry.id ? String(foundCountry.id) : null;
        console.log("Country properties:", foundCountry.id);
      } else {
        console.log("Found country, but properties are null.");
      }

      // Get centroid of the country
      setIsLoading(true);
      const centroid = d3.geoCentroid(foundCountry);

      // Access the globe instance through ref and fly to country
      if (globeRef.current) {
        const globe = globeRef.current;
        globe.pointOfView(
          { lat: centroid[1], lng: centroid[0], altitude: 0.5 },
          2000
        );
      }

      // Clear search after successful navigation
      setSearchQuery("");
      setSuggestions([]);
      const timeoutId = setTimeout(() => {
        activeTimeouts.current.delete(timeoutId);
        router.push(`/country/${countryNavi}`);
      }, 2000);
      activeTimeouts.current.add(timeoutId);
    } else {
      console.log("Country not found");
      // You could add a visual indicator here that the country wasn't found
    }
  }

  // Suggestion logic - memoized for performance
  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (value.trim().length >= 2) {
        const countriesData = await loadCountriesData();
        const searchLower = value.toLowerCase();
        const matches = countriesData
          .map((country: any) => country.properties.name)
          .filter((name: string) => name.toLowerCase().includes(searchLower))
          .slice(0, 5);
        setSuggestions(matches);
      } else {
        setSuggestions([]);
      }
    },
    []
  );

  const handleSuggestionClick = useCallback((name: string) => {
    setSearchQuery(name);
    setSuggestions([]);
  }, []);

  // Memoize handlers to prevent unnecessary re-renders, but NOT the globe component
  const handlePolygonClick = useCallback(
    (country: any) => {
      setCountryNow(country.properties?.name || "");
      setIsLoading(true);
      // Optionally, animate globe or do other logic here
      const timeoutId = setTimeout(() => {
        activeTimeouts.current.delete(timeoutId);
        router.push(`/country/${country.id}`);
      }, 2000); // Wait for animation if needed
      activeTimeouts.current.add(timeoutId);
    },
    [router]
  );

  return (
    <main className="bg-[#0a0e18] h-screen overflow-hidden fixed inset-0">
      <TopMenu />
      {/* Enhanced search form below TopMenu */}
      <div className="flex justify-center pt-24 pb-4 relative z-40">
        <form onSubmit={handleSearch} className="relative w-72">
          <div
            className={`flex items-center border transition-all duration-300 rounded-full overflow-hidden shadow-lg ${
              isSearchFocused
                ? "bg-black/60 border-blue-400/60 pr-3"
                : "bg-black/50 border-gray-400/30 pr-1"
            }`}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setIsSearchFocused(false);
                const timeoutId = setTimeout(() => {
                  activeTimeouts.current.delete(timeoutId);
                  setSuggestions([]);
                }, 150);
                activeTimeouts.current.add(timeoutId);
              }}
              placeholder="Find countries..."
              className="bg-transparent outline-none px-4 py-2 w-full transition-all duration-300 placeholder-blue-200/50 text-blue-100 text-sm"
              style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)" }}
            />
            <button
              type="submit"
              className={`flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                isSearchFocused
                  ? "text-blue-300 bg-blue-400/20 p-1.5"
                  : "text-blue-200/70 p-1"
              }`}
              aria-label="Search"
            >
              <BiSearch size={18} />
            </button>
          </div>
          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-2 bg-[#181e2a]/80 border border-blue-400/30 rounded-xl shadow-lg z-50">
              {suggestions.map((name) => (
                <li
                  key={name}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-400/20 text-blue-100"
                  onMouseDown={() => handleSuggestionClick(name)}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          {/* Enhanced glow effect when focused */}
          {isSearchFocused && (
            <div className="absolute inset-0 -z-10 rounded-full blur-md bg-blue-500/15"></div>
          )}

          {/* Permanent subtle glow for better visibility even when not focused */}
          <div className="absolute inset-0 -z-20 rounded-full blur-lg bg-blue-500/5"></div>
        </form>
      </div>
      <div className="absolute inset-0 -z-10">
        <GlobeComponent ref={globeRef} onPolygonClick={handlePolygonClick} />
      </div>

      {/* Loading spinner */}
      {isLoading && <CountryLoading countryName={countryNow || ""} />}
    </main>
  );
}
