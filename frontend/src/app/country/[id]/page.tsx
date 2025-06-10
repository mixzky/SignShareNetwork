import { notFound } from "next/navigation";

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

  console.log("Found country:", country);
  if (!country) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Country Information</h1>
      <p className="text-lg mb-2">ID: {id}</p>
      <p className="text-lg mb-2">
        Name: {country.properties ? country.properties.name : "Unknown"}
      </p>
      <pre className="text-xs bg-gray-200 p-2 rounded max-w-xl overflow-x-auto">
        {JSON.stringify(country.properties, null, 2)}
      </pre>
    </div>
  );
}
