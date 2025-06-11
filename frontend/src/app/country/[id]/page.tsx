import { notFound } from "next/navigation";
import TopMenu from "@/components/TopMenu";

export default async function CountryInfo({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params; // Await params as required by Next.js

  // Fetch world-atlas data
  const res = await fetch("https://unpkg.com/world-atlas/countries-110m.json");
  const worldData = await res.json();
  const topojson = await import("topojson-client");

  // Convert TopoJSON to GeoJSON
  const featureCollection = topojson.feature(
    worldData,
    worldData.objects.countries
  ) as unknown as GeoJSON.FeatureCollection;
  const countries = featureCollection.features;

  // Find country by id
  const country = countries.find((c: any) => String(c.id) === String(id));

  if (!country) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e18]">
      <TopMenu />

      {/* Background div for everything under TopMenu */}
      <div
        className="w-full flex-1 pt-24 flex flex-col items-center"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        <div className="relative z-10 w-full max-w-3xl rounded-3xl shadow-2xl p-8 bg-white border-4 border-blue-300">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Country "sprite" or flag placeholder */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner border border-gray-300 mb-4">
                {/* You can put a flag or image here */}
                <span className="text-6xl text-gray-400">🌍</span>
              </div>
              <div className="text-center text-gray-700 font-semibold">
                {country.properties?.name}
              </div>
            </div>
            {/* Info panel */}
            <div className="flex-1 flex flex-col gap-4">
              <h1 className="text-3xl font-bold text-blue-400 drop-shadow mb-2">
                Country Information
              </h1>
              <div className="bg-blue-100 rounded-xl p-4 shadow border border-blue-300 flex flex-col gap-2">
                <div className="flex flex-wrap gap-4">
                  <span className="font-mono text-lg text-gray-700">
                    <span className="font-bold">ID:</span> {id}
                  </span>
                  <span className="font-mono text-lg text-gray-700">
                    <span className="font-bold">Name:</span>{" "}
                    {country.properties?.name}
                  </span>
                </div>
                {country.properties?.region && (
                  <span className="font-mono text-lg text-gray-700">
                    <span className="font-bold">Region:</span>{" "}
                    {country.properties.region}
                  </span>
                )}
              </div>
              <div className="bg-gray-100 rounded-xl p-4 shadow-inner border border-gray-300 mt-2">
                <pre className="text-xs text-gray-700 max-w-xl overflow-x-auto">
                  {JSON.stringify(country.properties, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
