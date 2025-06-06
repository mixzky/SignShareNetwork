"use client";

import { useEffect, useRef } from "react";
import * as topojson from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import * as THREE from "three";

export default function GlobeComponent() {
  const globeEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGlobe = async () => {
      const Globe = (await import("globe.gl")).default;

      const res = await fetch(
        "https://unpkg.com/world-atlas/countries-110m.json"
      );
      const worldData = await res.json();

      const countries = topojson.feature(
        worldData,
        worldData.objects.countries
      ) as unknown as FeatureCollection<Geometry>;

      if (globeEl.current) {
        const globe = new Globe(globeEl.current)
          // Set globe background to deep space blue
          .backgroundColor("#080e24")

          // Set globe sphere to a gradient-like appearance
          .globeMaterial(
            new THREE.MeshPhongMaterial({
              color: "#0077be", // Deep blue base color
              emissive: "#004080", // Darker blue emissive
              emissiveIntensity: 0.2,
              shininess: 0.9,
            })
          )
          // Disable zoom for a cleaner look
          // Set country polygons with a green color scheme
          .polygonsData(countries.features)
          .polygonCapColor(() => "rgba(144, 238, 144, 0.8)") // Light green cap
          .polygonSideColor(() => "rgba(60, 179, 113, 0.5)") // Medium sea green sides
          .polygonStrokeColor(() => "#32cd32") // Lime green stroke
          .polygonAltitude(0.05) // Slightly raised polygons for better contrast

          // Keep the click functionality with enhanced labels
          .polygonLabel((polygon: { properties?: { name?: string } }) => {
            const name = polygon.properties?.name || "";
            return `<div style="
                background-color: rgba(0, 40, 20, 0.85); 
                color: white; 
                padding: 5px 10px; 
                border-radius: 5px; 
                font-family: Arial; 
                font-size: 14px;
                border: 1px solid #32cd32;
              ">${name}</div>`;
          })
          .onPolygonClick((polygon: any) => {
            const name = polygon?.properties?.name;

            if (name) alert(`You clicked on: ${name}`);
          });

        // Enhanced atmosphere glow with a blue gradient
        globe
          .atmosphereColor("#1e90ff") // Dodger blue atmosphere
          .atmosphereAltitude(0.2); // Keep the same altitude

        // Add ambient light with a slight green tint
        const ambLight = new THREE.AmbientLight(0xc8e6c9, 0.8); // Light green ambient
        globe.scene().add(ambLight);

        // Add a point light with a green tint
        const pointLight = new THREE.PointLight(0x98fb98, 0.6); // Pale green point light
        pointLight.position.set(200, 200, 400);
        globe.scene().add(pointLight);
      }
    };

    loadGlobe();
  }, []);

  return (
    <div
      ref={globeEl}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#080e24", // Match background color
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #0f1642 0%, #080e24 80%)",
      }}
    />
  );
}
