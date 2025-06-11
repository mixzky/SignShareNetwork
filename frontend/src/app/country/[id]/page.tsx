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
    <main className="flex flex-col min-h-screen bg-[#fafafa]">
      {/* TopMenu fixed with dark bg */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#0a0e18] h-24 flex items-center">
        <TopMenu />
      </div>
      {/* Content area with padding top to avoid overlap */}
      <div className="flex-1 w-full p-12 pt-28 flex flex-col items-center">
        <div className="w-full max-w-xl p-4 mb-8">
          <form className="w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="search a keyword"
                className="w-full px-5 py-3 pr-10 rounded-full border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base transition duration-200 ease-in-out"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xl"
                aria-label="Clear"
                tabIndex={-1}
              >
                ×
              </button>
            </div>
          </form>
        </div>
        <div className="w-full max-w-11/12 bg-white rounded-2xl shadow-md p-0 mb-8">
          {/* Top section: Now : Thailand */}
          <div className="flex justify-center pt-6 pb-6">
            <div className="px-6 py-2  rounded-full border w-96 border-[#cccccc] bg-[#fafafa] text-center text-base font-semibold">
              <span className="text-green-400">Now :</span>{" "}
              <span className="font-bold">{country.properties?.name}</span>{" "}
              <span role="img" aria-label="thailand-flag"></span>
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-[#dedede] " />
          {/* Bottom section: user info and upload button */}
          <div className="flex flex-row items-center justify-center gap-8 px-8 py-6">
            {/* User info */}
            <div className="flex justify-center items-center min-w-0 basis-1/2">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="avatar"
                className="w-14 h-14 rounded-full mr-4"
              />
              <span className="text-xl font-medium text-gray-600 truncate">
                haha hoho
              </span>
            </div>
            {/* Vertical divider */}
            <div className="h-20 w-px bg-[#dedede]" />
            {/* Upload button */}
            <button
              type="button"
              className="bg-green-50 border border-green-200 text-green-900 font-semibold px-8 py-4 rounded-xl shadow-sm hover:bg-green-100 flex items-center text-lg transition basis-1/2 justify-center"
            >
              Upload Your Video
              <span className="ml-2 text-2xl">⤴️</span>
            </button>
          </div>
        </div>
        <div className="w-full min-h-screen max-w-11/12 bg-white rounded-2xl shadow-md p-0 mb-8">
          {/* Placeholder for content, e.g., video feed or user posts */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">User Posts</h2>
            <p className="text-gray-600">
              This is where user posts will appear.
            </p>
            {/* Add more content here as needed */}
          </div>
        </div>
      </div>
    </main>
  );
}
