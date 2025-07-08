"use client";
import Link from "next/link";
import Image from "next/image";
import CountrySearchBar from "./CountrySearchBar";

export default function CountryTopMenu() {
  return (
    <nav
      className="text-white fixed w-full z-50 top-6"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="w-full">
        <div className="relative flex items-center justify-center h-16">
          {/* Most left: SignShare Network */}
          <div className="absolute left-4 pl-4 mb-2.5 flex items-center h-full">
            <Link
              href="/"
              aria-label="SignShare Network - Go to homepage"
              className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0e18] rounded"
            >
              <div className="transition-transform duration-300 hover:scale-110 hover:rotate-6 focus:scale-110 focus:rotate-6">
                <Image
                  src="https://njzzkhcoecjmnyuizobo.supabase.co/storage/v1/object/public/assets//signsharewhite.png"
                  alt="SignShare Network Logo"
                  width={120}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Center: CountrySearchBar */}
          <div className="w-full max-w-4xl mx-auto flex justify-center mt-4 px-4">
            <div
              role="search"
              aria-label="Search for countries"
              className="w-full"
            >
              <CountrySearchBar />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
