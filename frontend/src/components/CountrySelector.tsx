"use client";

import { useRouter } from "next/navigation";

const countries = [
  { code: "TH", name: "Thailand" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

export default function CountrySelector() {
  const router = useRouter();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 text-md opacity-80 hover:opacity-100 transition-opacity"
        style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
        <span>Browse by Country</span>
      </button>

      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
        {countries.map((country) => (
          <button
            key={country.code}
            onClick={() => router.push(`/country/${country.code}`)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
          >
            <span className="text-2xl">
              {country.code === "TH" ? "🇹🇭" : 
               country.code === "US" ? "🇺🇸" :
               country.code === "GB" ? "🇬🇧" :
               country.code === "JP" ? "🇯🇵" :
               country.code === "KR" ? "🇰🇷" :
               country.code === "CN" ? "🇨🇳" :
               country.code === "IN" ? "🇮🇳" :
               country.code === "AU" ? "🇦🇺" :
               country.code === "DE" ? "🇩🇪" :
               country.code === "FR" ? "🇫🇷" : "🌍"}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {country.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 