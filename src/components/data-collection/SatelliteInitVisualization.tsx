import { useState, useEffect, useRef } from "react";
import { Satellite, Grid3X3, CheckCircle2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SatelliteInitVisualizationProps {
  stage: "idle" | "initializing" | "scanning" | "analyzing" | "filtering" | "cleanup" | "complete";
}

// Field coordinates (Oklahoma/Texas basins)
const FIELD_CENTER: [number, number] = [35.2, -98.5];
const FIELD_BOUNDS: [[number, number], [number, number]] = [
  [33.5, -103.0],
  [36.5, -95.5],
];

// Grid squares matching FIELD_NAMES in FieldScanDemo
const GRID_CELLS = [
  { label: "A1", name: "Anadarko NW" }, { label: "A2", name: "Anadarko NE" },
  { label: "A3", name: "Anadarko C" }, { label: "A4", name: "Woodford W" },
  { label: "A5", name: "Woodford E" }, { label: "A6", name: "Woodford SE" },
  { label: "B1", name: "SCOOP W" }, { label: "B2", name: "SCOOP C" },
  { label: "B3", name: "SCOOP E" }, { label: "B4", name: "STACK W" },
  { label: "B5", name: "STACK C" }, { label: "B6", name: "STACK E" },
  { label: "C1", name: "Permian NW" }, { label: "C2", name: "Permian N" },
  { label: "C3", name: "Permian NE" }, { label: "C4", name: "Permian C" },
  { label: "C5", name: "Permian SW" }, { label: "C6", name: "Permian SE" },
  { label: "D1", name: "Delaware W" }, { label: "D2", name: "Delaware C" },
  { label: "D3", name: "Delaware E" }, { label: "D4", name: "Midland W" },
  { label: "D5", name: "Midland C" }, { label: "D6", name: "Midland E" },
];

export const SatelliteInitVisualization = ({ stage }: SatelliteInitVisualizationProps) => {
  const [satelliteLoaded, setSatelliteLoaded] = useState(false);
  const [gridOverlay, setGridOverlay] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);

  const isActive = stage !== "idle";
  const pastInit = ["scanning", "analyzing", "filtering", "cleanup", "complete"].includes(stage);

  // Initialize map
  useEffect(() => {
    if (!isActive || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: FIELD_CENTER,
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    // ESRI World Imagery — free satellite tiles
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 }
    ).addTo(map);

    mapRef.current = map;

    // Detect when tiles load
    map.whenReady(() => {
      setTimeout(() => setSatelliteLoaded(true), 800);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isActive]);

  // Scan line animation
  useEffect(() => {
    if (stage !== "initializing") return;
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 3;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [stage]);

  // GIS grid overlay
  useEffect(() => {
    if (!satelliteLoaded || !mapRef.current) return;

    if (stage === "initializing") {
      const timer = setTimeout(() => {
        addGridOverlay();
        setGridOverlay(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (pastInit && !gridOverlay) {
      addGridOverlay();
      setGridOverlay(true);
    }
  }, [satelliteLoaded, stage, pastInit]);

  // Reset on idle
  useEffect(() => {
    if (stage === "idle") {
      setSatelliteLoaded(false);
      setGridOverlay(false);
      setScanProgress(0);
      if (gridLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    }
  }, [stage]);

  const addGridOverlay = () => {
    if (!mapRef.current || gridLayerRef.current) return;

    const group = L.layerGroup();
    const [south, west] = FIELD_BOUNDS[0];
    const [north, east] = FIELD_BOUNDS[1];
    const rows = 4;
    const cols = 6;
    const latStep = (north - south) / rows;
    const lngStep = (east - west) / cols;

    // Draw grid lines
    for (let r = 0; r <= rows; r++) {
      const lat = south + r * latStep;
      L.polyline([[lat, west], [lat, east]], {
        color: "hsl(199, 89%, 48%)",
        weight: 1,
        opacity: 0.6,
        dashArray: "4 4",
      }).addTo(group);
    }
    for (let c = 0; c <= cols; c++) {
      const lng = west + c * lngStep;
      L.polyline([[south, lng], [north, lng]], {
        color: "hsl(199, 89%, 48%)",
        weight: 1,
        opacity: 0.6,
        dashArray: "4 4",
      }).addTo(group);
    }

    // Add cell labels
    GRID_CELLS.forEach((cell, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const lat = north - row * latStep - latStep * 0.15;
      const lng = west + col * lngStep + lngStep * 0.08;

      const icon = L.divIcon({
        className: "",
        html: `<div style="color:hsl(199,89%,48%);font-size:9px;font-family:monospace;text-shadow:0 0 4px rgba(0,0,0,0.9)">${cell.label}</div>`,
        iconSize: [20, 14],
      });
      L.marker([lat, lng], { icon, interactive: false }).addTo(group);
    });

    group.addTo(mapRef.current);
    gridLayerRef.current = group;
  };

  if (!isActive) return null;

  return (
    <div className="relative rounded-lg overflow-hidden border border-border bg-black">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-2 text-[10px]">
          <Satellite className={`h-3 w-3 ${satelliteLoaded ? "text-success" : "text-primary animate-pulse"}`} />
          <span className={satelliteLoaded ? "text-success" : "text-primary"}>
            {satelliteLoaded ? "ESRI World Imagery loaded" : "Loading satellite imagery..."}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <Grid3X3 className={`h-3 w-3 ${gridOverlay ? "text-success" : "text-muted-foreground"}`} />
          <span className={gridOverlay ? "text-success" : "text-muted-foreground"}>
            {gridOverlay ? "GIS grid active" : "GIS grid pending"}
          </span>
          {gridOverlay && satelliteLoaded && <CheckCircle2 className="h-3 w-3 text-success" />}
        </div>
      </div>

      {/* Map container */}
      <div className="relative h-52">
        <div ref={containerRef} className="absolute inset-0 z-0" />

        {/* Scan line effect */}
        {stage === "initializing" && scanProgress < 100 && (
          <div
            className="absolute left-0 right-0 h-[2px] bg-primary/80 shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)] z-[999]"
            style={{ top: `${scanProgress}%`, transition: "top 0.05s linear" }}
          />
        )}
      </div>

      {/* Coordinates bar */}
      <div className="relative z-[1000] flex justify-between px-2 py-1 bg-black/80 text-[8px] font-mono text-muted-foreground border-t border-border/50">
        <span>33.5°N–36.5°N / 95.5°W–103.0°W</span>
        <span>ESRI World Imagery • NAD83</span>
        <span>Source: ArcGIS Online</span>
      </div>
    </div>
  );
};
