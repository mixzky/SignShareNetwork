"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as topojson from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import * as THREE from "three";
import * as d3 from "d3-geo";

const GlobeComponent = forwardRef((props, ref) => {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef(null);
  const countryColors = useRef(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Generate pastel color function
  const generatePastelColor = (countryId: string) => {
    if (!countryColors.current.has(countryId)) {
      const hue = Math.floor(Math.random() * 360);
      const color = `hsla(${hue}, 70%, 80%, 0.8)`;
      const sideColor = `hsla(${hue}, 70%, 70%, 0.5)`;
      const strokeColor = `hsla(${hue}, 70%, 60%, 1)`;
      countryColors.current.set(countryId, { color, sideColor, strokeColor });
    }
    return countryColors.current.get(countryId);
  };

  useImperativeHandle(ref, () => ({
    // Expose methods that parent components can call
    pointOfView: (
      params: { lat: number; lng: number; altitude: number },
      duration?: number
    ) => {
      if (globeInstance.current) {
        globeInstance.current.pointOfView(params, duration);
      }
    },
  }));

  useEffect(() => {
    const loadGlobe = async () => {
      try {
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
            // Use transparent background
            .backgroundColor("rgba(0, 0, 0, 0)")
            // Optimize globe material
            .globeMaterial(
              new THREE.MeshPhongMaterial({
                color: "#ffffff",
                emissive: "#ffffff",
                emissiveIntensity: 0.05,
                shininess: 30,
                transparent: true,
                opacity: 0.85,
              })
            )
            .polygonsData(countries.features)
            .polygonCapColor(
              (d: any) => generatePastelColor(d.properties.name).color
            )
            .polygonSideColor(
              (d: any) => generatePastelColor(d.properties?.name).sideColor
            )
            .polygonStrokeColor(
              (d: any) =>
                generatePastelColor(d.properties?.name || "").strokeColor
            )
            .polygonAltitude(0.06)

            // Initialize with no labels - they'll be added conditionally
            .labelsData([])

            // Configure hover behavior
            .polygonLabel((polygon) => {
              const name = (polygon as any).properties?.name || "";
              const colors = generatePastelColor(name);
              return `<div style="
                  background-color: ${colors.color};
                  color: #1a1a1a;
                  padding: 8px 12px;
                  border-radius: 8px;
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                  letter-spacing: 0.5px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  border: 1px solid ${colors.strokeColor};
                ">${name}</div>`;
            })
            .onPolygonClick((polygon: any) => {
              const name = polygon?.properties?.name;
              if (name) {
                const centroid = d3.geoCentroid(polygon);
                globe.pointOfView(
                  { lat: centroid[1], lng: centroid[0], altitude: 2.5 },
                  1000
                );
              }
            });

          // Create reference to track zoom level
          let currentZoomDistance = 400;
          let lastUpdateTime = 0;

          // Performance-optimized label visibility
          const updateLabelVisibility = () => {
            // Throttle updates to reduce performance impact
            const now = Date.now();
            if (now - lastUpdateTime < 100) return; // Only update every 100ms
            lastUpdateTime = now;

            const labelsVisible = currentZoomDistance <= 250;

            // Only update if visibility state changes - prevents unnecessary DOM updates
            if (
              (labelsVisible && globe.labelsData().length === 0) ||
              (!labelsVisible && globe.labelsData().length > 0)
            ) {
              globe.labelsData(labelsVisible ? countries.features : []);
            }
          };

          // Configure label appearance for when they're visible
          globe
            .labelLat((d) => {
              const centroid = d3.geoCentroid(d as any);
              return centroid[1];
            })
            .labelLng((d) => {
              const centroid = d3.geoCentroid(d as any);
              return centroid[0];
            })
            .labelText((d: any) => d.properties?.name || "")
            .labelSize(() => 0.5)
            .labelDotRadius(0.1) // Smaller dot
            .labelColor(() => "#000000")
            .labelAltitude(0.07)
            .labelResolution(1); // Reduced resolution for better performance

          // Event listener for zoom with debouncing
          let zoomTimeout: ReturnType<typeof setTimeout> | null = null;
          globe.controls().addEventListener("change", () => {
            const cameraPosition = globe.camera().position;
            const cameraDistance = new THREE.Vector3()
              .copy(cameraPosition)
              .length();
            currentZoomDistance = cameraDistance;

            // Clear previous timeout
            if (zoomTimeout) clearTimeout(zoomTimeout);

            // Set new timeout for handling label visibility
            zoomTimeout = setTimeout(() => {
              updateLabelVisibility();
            }, 100);
          });

          // Create stars efficiently
          const createStars = () => {
            // Use a single geometry for better performance
            const starsGeometry = new THREE.BufferGeometry();
            const starsMaterial = new THREE.PointsMaterial({
              color: 0xffffff,
              size: 0.7,
              transparent: true,
              opacity: 0.8,
              sizeAttenuation: true,
            });

            // Generate fewer stars
            const starsVertices = [];
            for (let i = 0; i < 1500; i++) {
              // Reduced from 3000
              const radius = 500;
              const theta = 2 * Math.PI * Math.random();
              const phi = Math.acos(2 * Math.random() - 1);

              const x = radius * Math.sin(phi) * Math.cos(theta);
              const y = radius * Math.sin(phi) * Math.sin(theta);
              const z = radius * Math.cos(phi);

              starsVertices.push(x, y, z);
            }

            starsGeometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(starsVertices, 3)
            );
            const starField = new THREE.Points(starsGeometry, starsMaterial);
            globe.scene().add(starField);

            // Add fewer colored stars
            for (let i = 0; i < 30; i++) {
              // Reduced from 100
              const starColor = new THREE.Color();
              starColor.setHSL(Math.random(), 0.3, 0.8);

              const bigStarMaterial = new THREE.PointsMaterial({
                color: starColor,
                size: Math.random() * 1.5 + 0.5,
                transparent: true,
                opacity: 0.9,
                sizeAttenuation: true,
              });

              const bigStarGeometry = new THREE.BufferGeometry();
              const vertex = new THREE.Vector3(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
              );

              bigStarGeometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(
                  [vertex.x, vertex.y, vertex.z],
                  3
                )
              );
              const bigStar = new THREE.Points(
                bigStarGeometry,
                bigStarMaterial
              );
              globe.scene().add(bigStar);
            }

            // Less frequent twinkling
            const addTwinkle = () => {
              globe.scene().traverse((object) => {
                if (
                  object instanceof THREE.Points &&
                  object !== starField &&
                  Math.random() > 0.7
                ) {
                  // Only update some stars
                  const material = object.material as THREE.PointsMaterial;
                  material.opacity = 0.5 + Math.random() * 0.5;
                  material.size = Math.random() * 1.5 + 0.5;
                }
              });

              setTimeout(addTwinkle, 2000 + Math.random() * 1000); // Less frequent updates
            };

            addTwinkle();
          };

          createStars();

          // Simplified lighting
          const ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
          globe.scene().add(ambientLight);

          // Single main light
          const mainLight = new THREE.PointLight(0xffffff, 0.8);
          mainLight.position.set(-150, 150, 100);
          globe.scene().add(mainLight);

          // Optimize atmosphere
          globe.atmosphereColor("rgb(255, 255, 255)").atmosphereAltitude(0.15);

          // Optimize controls
          globe.controls().maxDistance = 400;
          globe.controls().minDistance = 180;
          globe.controls().enableDamping = true; // Smooth zooming
          globe.controls().dampingFactor = 0.1; // Adjust as needed
          globe.controls().autoRotate = true;
          globe.controls().autoRotateSpeed = 0.35;
          globe.controls().enableZoom = true;
          globe.controls().rotateSpeed = 0.5; // Slower rotation for better control

          // Reduce auto-rotation interruptions
          let interactionTimeout: ReturnType<typeof setTimeout> | null = null;
          globe.controls().addEventListener("start", () => {
            globe.controls().autoRotate = false;
          });

          globe.controls().addEventListener("end", () => {
            // Clear previous timeout
            if (interactionTimeout) clearTimeout(interactionTimeout);

            // Set new timeout
            interactionTimeout = setTimeout(() => {
              globe.controls().autoRotate = true;
            }, 3000);
          });

          // Initial label visibility check
          updateLabelVisibility();

          // Optimize renderer
          globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio
          globe.renderer().setClearColor(new THREE.Color(0x000000), 1);

          // Store globe instance in ref so it can be accessed via forwarded ref
          globeInstance.current = globe;

          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading globe:", error);
        setIsLoading(false);
      }
    };

    loadGlobe();
  }, []);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-xl">Loading ...</div>
        </div>
      )}
      <div
        ref={globeEl}
        style={{
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(to bottom, #0f1621 0%, #0a0e18 100%)",
        }}
      />
    </>
  );
});

GlobeComponent.displayName = "GlobeComponent";

export default GlobeComponent;
