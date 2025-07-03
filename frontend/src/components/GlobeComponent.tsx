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
import { useRouter } from "next/navigation";

interface GlobeComponentProps {
  onPolygonClick?: (polygon: any) => void;
}

const GlobeComponent = forwardRef((props: GlobeComponentProps, ref) => {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const countryColors = useRef(new Map());
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Refs for cleanup tracking
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const intervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const animationFramesRef = useRef<Set<number>>(new Set());
  const eventListenersRef = useRef<
    Array<{ target: any; event: string; handler: any }>
  >([]);
  const isMountedRef = useRef(true);

  // Helper to add tracked timeout
  const addTimeout = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId);
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  };

  // Helper to add tracked event listener
  const addEventListenerTracked = (
    target: any,
    event: string,
    handler: any
  ) => {
    target.addEventListener(event, handler);
    eventListenersRef.current.push({ target, event, handler });
  };

  // Generate pastel color function with cache size limit
  const generatePastelColor = (countryId: string) => {
    if (!countryColors.current.has(countryId)) {
      // Limit cache size to prevent memory accumulation
      if (countryColors.current.size > 200) {
        // Clear oldest entries when cache gets too large
        const entries = Array.from(countryColors.current.entries());
        const toDelete = entries.slice(0, 50); // Remove oldest 50 entries
        toDelete.forEach(([key]) => countryColors.current.delete(key));
      }

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
    isMountedRef.current = true;

    const loadGlobe = async () => {
      if (!isMountedRef.current) return;

      try {
        const Globe = (await import("globe.gl")).default;

        if (!isMountedRef.current) return;

        const res = await fetch(
          "https://unpkg.com/world-atlas/countries-110m.json"
        );
        const worldData = await res.json();

        if (!isMountedRef.current) return;

        const countries = topojson.feature(
          worldData,
          worldData.objects.countries
        ) as unknown as FeatureCollection<Geometry>;

        if (globeEl.current && isMountedRef.current) {
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
              if (props.onPolygonClick) {
                props.onPolygonClick(polygon);
              }
              const name = polygon?.properties?.name;
              if (name) {
                const centroid = d3.geoCentroid(polygon);
                globe.pointOfView(
                  { lat: centroid[1], lng: centroid[0], altitude: 0.5 },
                  2000
                );
                addTimeout(() => {
                  router.push(`/country/${polygon.id}`);
                }, 2000);
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
          const handleZoomChange = () => {
            const cameraPosition = globe.camera().position;
            const cameraDistance = new THREE.Vector3()
              .copy(cameraPosition)
              .length();
            currentZoomDistance = cameraDistance;

            // Clear previous timeout
            if (zoomTimeout) {
              clearTimeout(zoomTimeout);
              timeoutsRef.current.delete(zoomTimeout);
            }

            // Set new timeout for handling label visibility
            zoomTimeout = addTimeout(() => {
              updateLabelVisibility();
            }, 100);
          };

          addEventListenerTracked(globe.controls(), "change", handleZoomChange);

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

            // Generate fewer stars for better performance
            const starsVertices = [];
            for (let i = 0; i < 800; i++) {
              // Reduced from 1500
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
            for (let i = 0; i < 15; i++) {
              // Reduced from 30
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

            // Simplified twinkling to reduce performance impact
            const addTwinkle = () => {
              if (!isMountedRef.current) return;

              // Only update a small subset of stars very infrequently
              let count = 0;
              globe.scene().traverse((object) => {
                if (
                  object instanceof THREE.Points &&
                  object !== starField &&
                  count < 2 && // Limit updates to only 2 stars
                  Math.random() > 0.9 // Even more selective
                ) {
                  const material = object.material as THREE.PointsMaterial;
                  material.opacity = 0.5 + Math.random() * 0.5;
                  material.size = Math.random() * 1.5 + 0.5;
                  count++;
                }
              });

              addTimeout(addTwinkle, 5000 + Math.random() * 3000); // Much less frequent updates
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
          const handleControlsStart = () => {
            globe.controls().autoRotate = false;
          };

          const handleControlsEnd = () => {
            // Clear previous timeout
            if (interactionTimeout) {
              clearTimeout(interactionTimeout);
              timeoutsRef.current.delete(interactionTimeout);
            }

            // Set new timeout
            interactionTimeout = addTimeout(() => {
              if (isMountedRef.current) {
                globe.controls().autoRotate = true;
              }
            }, 3000);
          };

          addEventListenerTracked(
            globe.controls(),
            "start",
            handleControlsStart
          );
          addEventListenerTracked(globe.controls(), "end", handleControlsEnd);

          // Initial label visibility check
          updateLabelVisibility();

          // Optimize renderer with better settings for performance
          globe
            .renderer()
            .setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Lower pixel ratio
          globe.renderer().setClearColor(new THREE.Color(0x000000), 1);
          globe.renderer().shadowMap.enabled = false; // Disable shadows for better performance

          // Store globe instance in ref so it can be accessed via forwarded ref
          globeInstance.current = globe;

          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading globe:", error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadGlobe();

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      // Clear all timeouts
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();

      // Clear all intervals
      intervalsRef.current.forEach((intervalId) => clearInterval(intervalId));
      intervalsRef.current.clear();

      // Clear all animation frames
      animationFramesRef.current.forEach((frameId) =>
        cancelAnimationFrame(frameId)
      );
      animationFramesRef.current.clear();

      // Remove all event listeners
      eventListenersRef.current.forEach(({ target, event, handler }) => {
        try {
          target.removeEventListener(event, handler);
        } catch (error) {
          console.warn("Error removing event listener:", error);
        }
      });
      eventListenersRef.current = [];

      // Cleanup globe instance and THREE.js resources
      if (globeInstance.current) {
        const globe = globeInstance.current;

        try {
          // Stop any animations and clear animation loops
          if (globe.controls) {
            globe.controls().autoRotate = false;
            globe.controls().enabled = false;
          }

          // Stop the globe's animation loop
          if (globe.renderer() && globe.renderer().setAnimationLoop) {
            globe.renderer().setAnimationLoop(null);
          }

          // Get scene and renderer for cleanup
          const scene = globe.scene();
          const renderer = globe.renderer();

          // Dispose of all geometries and materials
          scene.traverse((object: any) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material: any) => {
                  if (material.map) material.map.dispose();
                  if (material.normalMap) material.normalMap.dispose();
                  if (material.bumpMap) material.bumpMap.dispose();
                  material.dispose();
                });
              } else {
                if (object.material.map) object.material.map.dispose();
                if (object.material.normalMap)
                  object.material.normalMap.dispose();
                if (object.material.bumpMap) object.material.bumpMap.dispose();
                object.material.dispose();
              }
            }
          });

          // Clear the scene
          while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }

          // Dispose renderer and clear canvas
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();

          // Force garbage collection of WebGL context
          const gl = renderer.getContext();
          if (gl) {
            const loseContext = gl.getExtension("WEBGL_lose_context");
            if (loseContext) {
              loseContext.loseContext();
            }
          }

          // Clear the DOM element
          if (globeEl.current) {
            globeEl.current.innerHTML = "";
          }
        } catch (error) {
          console.warn("Error during globe cleanup:", error);
        }

        globeInstance.current = null;
      }

      // Clear color cache
      countryColors.current.clear();
    };
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
