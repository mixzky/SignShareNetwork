"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { fetchVideoUploadStats } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import { getMostTagsByCountry } from "@/lib/supabase";

// Register English locale for country names & codes
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
type LeftMenuProps = {
  id: string;
};

export default function LeftMenu({ id }: LeftMenuProps) {
  const router = useRouter();
  const [stats, setStats] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Array<{ tag: string; tag_count: number }>>(
    []
  );

  useEffect(() => {
    async function loadCountryMap() {
      try {
        const res = await fetch(
          "https://unpkg.com/world-atlas/countries-110m.json"
        );
        const topojsonData = await res.json();
        const tagsData = await getMostTagsByCountry(id);
        //console.log("Tags by country:", tagsData);
        setTags(tagsData);
        console.log(tagsData);
        const geojson = feature(
          topojsonData,
          topojsonData.objects.countries
        ) as unknown as GeoJSON.FeatureCollection;

        const map: Record<string, string> = {};
        geojson.features.forEach((geoFeature) => {
          if (geoFeature.id && geoFeature.properties?.name) {
            map[geoFeature.id.toString().padStart(3, "0")] = geoFeature
              .properties.name as string;
          }
        });

        setCountryMap(map);
      } catch (err) {
        console.error("Failed to load country map:", err);
      }
    }

    async function loadStats() {
      try {
        const data = await fetchVideoUploadStats();
        setStats(data);
      } catch (err) {
        setError("Failed to load stats");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadCountryMap();
    loadStats();
  }, []);

  return (
    <aside
      className="hidden md:block sticky top-28 h-[calc(98vh-7rem)] w-84 bg-white rounded-xl shadow-md"
      role="complementary"
      aria-label="Trending content and navigation"
    >
      <div className="p-4 h-full flex flex-col">
        {/* Trending Section */}
        <div>
          <h2 className="font-bold text-2xl" id="trending-heading">
            Trending
          </h2>
          <div className="sr-only">
            This section shows trending tags and popular countries for sign
            language videos.
          </div>

          {/* Tags Section */}
          {tags.length > 0 && (
            <div
              className="mt-4 mb-6"
              role="region"
              aria-labelledby="trending-tags-heading"
            >
              <h3 className="sr-only" id="trending-tags-heading">
                Trending Tags
              </h3>
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="Trending tags"
              >
                {tags.slice(0, 5).map((tagItem, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(`/country/${id}?tag=${tagItem.tag}`);
                      // Announce navigation to screen readers
                      const announcement = document.createElement("div");
                      announcement.setAttribute("role", "status");
                      announcement.setAttribute("aria-live", "polite");
                      announcement.className = "sr-only";
                      announcement.textContent = `Filtering videos by tag: ${tagItem.tag}`;
                      document.body.appendChild(announcement);
                      setTimeout(
                        () => document.body.removeChild(announcement),
                        3000
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/country/${id}?tag=${tagItem.tag}`);
                      }
                    }}
                    className="bg-[#d1ecf1] text-[#0c5460] px-2 py-0.5 rounded-full text-sm font-semibold tracking-wide shadow-sm cursor-pointer hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md focus:outline-none transition-transform duration-150"
                    role="listitem"
                    aria-label={`Filter by tag: ${tagItem.tag}, ${tagItem.tag_count} videos`}
                    tabIndex={0}
                  >
                    {tagItem.tag}
                    <span
                      className="ml-1 text-xs text-[#31708f]"
                      aria-hidden="true"
                    >
                      ({tagItem.tag_count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="mt-6"
            role="region"
            aria-labelledby="popular-countries-heading"
          >
            <h3 className="sr-only" id="popular-countries-heading">
              Popular Countries
            </h3>
            {loading && (
              <div
                role="status"
                aria-live="polite"
                aria-label="Loading popular countries"
              >
                <span
                  className="flex text-black text-2xl ml-4"
                  aria-hidden="true"
                >
                  <span className="animate-bounce [animation-delay:0ms]">
                    .
                  </span>
                  <span className="animate-bounce [animation-delay:200ms]">
                    .
                  </span>
                  <span className="animate-bounce [animation-delay:400ms]">
                    .
                  </span>
                </span>
                <span className="sr-only">Loading popular countries...</span>
              </div>
            )}
            {error && (
              <p className="text-red-500" role="alert" aria-live="assertive">
                {error}
              </p>
            )}
            {stats && (
              <ul
                className="space-y-1 max-h-80 overflow-auto"
                role="list"
                aria-label="Popular countries by video count"
              >
                {stats.slice(0, 4).map((stat) => {
                  const code = stat.country.toString().padStart(3, "0");
                  const countryName = countryMap[code] ?? stat.country;
                  const alpha2 = countries.numericToAlpha2(code);

                  return (
                    <li
                      key={stat.id}
                      className="border-b last:border-none"
                      role="listitem"
                    >
                      <Link
                        href={`/country/${code}`}
                        className="flex items-center space-x-4 px-3 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none  rounded-lg transition-colors"
                        aria-label={`View ${countryName} - ${stat.upload_count} videos available`}
                      >
                        {alpha2 ? (
                          <img
                            src={`https://flagcdn.com/w320/${alpha2.toLowerCase()}.png`}
                            alt=""
                            className="w-8 h-8 rounded-full border border-black object-cover flex-shrink-0"
                            role="presentation"
                          />
                        ) : (
                          <span
                            className="w-8 h-8 flex items-center justify-center text-xl"
                            role="img"
                            aria-label="Flag not available"
                          >
                            🏳️
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {countryName}
                          </p>
                        </div>
                        <span className="text-gray-500 font-semibold text-sm tabular-nums">
                          {stat.upload_count} videos
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Section: hr and links */}
        <div className="mt-auto">
          <hr
            className="border-zinc-200 dark:border-zinc-700 mb-2"
            role="separator"
            aria-hidden="true"
          />
          <nav role="navigation" aria-label="Main site navigation">
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                className="flex items-center text-xl gap-2 font-semibold text-black hover:text-blue-600 hover:bg-blue-400/10 focus:text-blue-600 focus:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-xl px-2 py-1 transition"
                aria-label="Go to homepage"
              >
                <HomeOutlinedIcon fontSize="large" aria-hidden="true" />
                Home
              </Link>
              <Link
                href="/profile"
                className="flex items-center text-xl gap-2 font-semibold text-black hover:text-blue-600 hover:bg-blue-400/10 focus:text-blue-600 focus:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-xl px-2 py-1 transition"
                aria-label="Go to your profile page"
              >
                <PersonOutlineOutlinedIcon
                  fontSize="large"
                  aria-hidden="true"
                />
                Profile
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center text-xl gap-2 font-semibold text-black hover:text-blue-600 hover:bg-blue-400/10 focus:text-blue-600 focus:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-xl px-2 py-1 transition"
                aria-label="Go to your dashboard"
              >
                <DashboardOutlinedIcon fontSize="large" aria-hidden="true" />
                Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
