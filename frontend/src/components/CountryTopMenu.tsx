"use client";
import Link from "next/link";
import CountrySearchBar from "./CountrySearchBar";

export default function CountryTopMenu() {
  return (
    <nav className="text-white fixed w-full z-50 top-6">
      <div className="w-full">
        <div className="relative flex items-center justify-center h-16">
          {/* Most left: SignShare Network */}
          <div className="absolute left-0 pl-4">
            <Link
              href="/"
              className="text-3xl md:text-4xl font-bold text-white"
              style={{
                textShadow:
                  "0 4px 8px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)",
              }}
            >
              SignShare Network
            </Link>
          </div>

          {/* Center: CountrySearchBar */}
          <div className="w-full max-w-2xl mx-auto flex justify-center mt-4">
            <CountrySearchBar />
          </div>
        </div>
      </div>
    </nav>
  );
}
