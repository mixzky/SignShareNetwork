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
    <aside className="hidden md:block sticky top-28 h-[calc(98vh-7rem)] w-84 bg-white rounded-xl shadow-md">
      <div className="p-4 h-full flex flex-col">
        {" "}
        {/* Trending Section */}
        <div>
          <div className="font-bold text-2xl">Trending</div>
          {/* Tags Section */}
          {tags.length > 0 && (
            <div className="mt-4 mb-6">
              {" "}
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 5).map((tagItem, index) => (
                  <span
                    key={index}
                    onClick={() =>
                      router.push(`/country/${id}?tag=${tagItem.tag}`)
                    }
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-[#fcd9db]  text-[#d88c92] cursor-pointer hover:bg-[#f9e5e7] transition-colors"
                  >
                    {tagItem.tag}
                    <span className="ml-1 text-xs text-[#e3a3a9]">
                      ({tagItem.tag_count})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6">
            {loading && (
              <span className="flex text-black text-2xl ml-4">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:200ms]">
                  .
                </span>
                <span className="animate-bounce [animation-delay:400ms]">
                  .
                </span>
              </span>
            )}
            {error && <p className="text-red-500">{error}</p>}{" "}
            {stats && (
              <ul className="space-y-1 max-h-80 overflow-auto">
                {stats.slice(0, 4).map((stat) => {
                  const code = stat.country.toString().padStart(3, "0");
                  const countryName = countryMap[code] ?? stat.country;
                  const alpha2 = countries.numericToAlpha2(code);

                  return (
                    <li key={stat.id} className="border-b last:border-none">
                      <Link
                        href={`/country/${code}`}
                        className="flex items-center space-x-4 px-3 py-3 hover:bg-gray-100 rounded-lg"
                      >
                        {alpha2 ? (
                          <img
                            src={`https://flagcdn.com/w320/${alpha2.toLowerCase()}.png`}
                            alt={`${countryName} flag`}
                            className="w-8 h-8 rounded-full border border-black object-cover flex-shrink-0"
                          />
                        ) : (
                          <span className="w-8 h-8 flex items-center justify-center text-xl">
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
          </div>{" "}
        </div>
        {/* Bottom Section: hr and links */}
        <div className="mt-auto">
          <hr className="border-zinc-200 dark:border-zinc-700 mb-2" />
          <div className="flex flex-col gap-2">
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
      </div>
    </aside>
  );
}
