"use client";
import Link from "next/link";
import Image from "next/image";
import CountrySearchBar from "./CountrySearchBar";

export default function CountryTopMenu() {
  return (
    <nav className="text-white fixed w-full z-50 top-6">
      <div className="w-full">
        <div className="relative flex items-center justify-center h-16">
          {/* Most left: SignShare Network */}
         <div className="absolute left-4 pl-4 mb-2.5 flex items-center h-full">
            <Link href="/">
              <Image
                src="https://njzzkhcoecjmnyuizobo.supabase.co/storage/v1/object/public/assets//signsharewhite.png"
                alt="SignShare Network Logo"
                width={120}
                height={48}
                className="object-contain"
                priority
              />
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
