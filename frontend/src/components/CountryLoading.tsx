import React from "react";

export default function CountryLoading({
  countryName,
}: {
  countryName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div
        className="px-8 py-6 rounded-xl bg-black/70 border-2 border-blue-400 shadow-2xl"
        style={{ backdropFilter: "blur(6px)" }}
      >
        <div
          className="text-xl font-semibold text-blue-300 mb-2 animate-pulse drop-shadow-lg text-center"
          style={{ textShadow: "0 2px 8px #2563eb, 0 0 2px #000" }}
        >
          Going to <span className="font-bold">{countryName}</span>
        </div>
        <div className="flex justify-center mt-2">
          <span
            className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></span>
          <span
            className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce mx-1"
            style={{ animationDelay: "0.2s" }}
          ></span>
          <span
            className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></span>
        </div>
      </div>
    </div>
  );
}
