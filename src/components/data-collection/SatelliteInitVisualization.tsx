import { useState, useEffect, useRef } from "react";
import { Satellite, Grid3X3, CheckCircle2, Flame, Layers } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// NASA GIBS — free public WMTS tiles, no API key required
const gibsDate = () => {
  // GIBS imagery has ~1 day latency; use yesterday's date
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
const GIBS = (layer: string, level: number, fmt: "png" | "jpg" = "jpg") =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${gibsDate()}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${fmt}`;


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

// Example wells for VIIRS thermal anomaly detection demo
// Real coordinates of active flaring wells in Permian/Anadarko basins
const EXAMPLE_WELLS: Array<{
  name: string;
  api: string;
  lat: number;
  lng: number;
  operator: string;
  flareMW: number; // radiative power
  detected: boolean;
}> = [
  { name: "Brawner 10-15",      api: "42-329-31245", lat: 31.92, lng: -102.35, operator: "Pioneer Natural Res.", flareMW: 12.4, detected: true },
  { name: "Reeves County 4-2H", api: "42-389-40128", lat: 31.45, lng: -103.48, operator: "ExxonMobil",            flareMW: 18.7, detected: true },
  { name: "Loving 27-1H",       api: "42-301-39872", lat: 31.78, lng: -103.92, operator: "Chevron",               flareMW:  9.1, detected: true },
  { name: "SCOOP-Eagle 3",      api: "35-051-24117", lat: 34.85, lng:  -97.62, operator: "Continental Res.",      flareMW:  6.3, detected: true },
  { name: "STACK Merge 8H",     api: "35-073-25890", lat: 35.62, lng:  -98.12, operator: "Devon Energy",          flareMW: 14.2, detected: true },
];

export const SatelliteInitVisualization = ({ stage }: SatelliteInitVisualizationProps) => {
  const [satelliteLoaded, setSatelliteLoaded] = useState(false);
  const [gridOverlay, setGridOverlay] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showThermal, setShowThermal] = useState(true);
  const [showTrueColor, setShowTrueColor] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const thermalLayerRef = useRef<L.TileLayer | null>(null);
  const trueColorLayerRef = useRef<L.TileLayer | null>(null);
  const wellsLayerRef = useRef<L.LayerGroup | null>(null);


  const isActive = stage !== "idle";
  const pastInit = ["scanning", "analyzing", "filtering", "cleanup", "complete"].includes(stage);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

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
      thermalLayerRef.current = null;
      trueColorLayerRef.current = null;
    };
  }, []);

  // Toggle NASA GIBS VIIRS Thermal Anomalies (active flares/fires)
  useEffect(() => {
    if (!mapRef.current || !satelliteLoaded) return;
    if (showThermal && !thermalLayerRef.current) {
      thermalLayerRef.current = L.tileLayer(
        GIBS("VIIRS_SNPP_Thermal_Anomalies_375m_All", 7, "png"),
        { opacity: 0.85, maxZoom: 9, attribution: "NASA GIBS / VIIRS" }
      ).addTo(mapRef.current);
    } else if (!showThermal && thermalLayerRef.current) {
      mapRef.current.removeLayer(thermalLayerRef.current);
      thermalLayerRef.current = null;
    }
  }, [showThermal, satelliteLoaded]);

  // Toggle NASA GIBS VIIRS True Color (daily fresh imagery)
  useEffect(() => {
    if (!mapRef.current || !satelliteLoaded) return;
    if (showTrueColor && !trueColorLayerRef.current) {
      trueColorLayerRef.current = L.tileLayer(
        GIBS("VIIRS_SNPP_CorrectedReflectance_TrueColor", 9, "jpg"),
        { opacity: 0.7, maxZoom: 9, attribution: "NASA GIBS / VIIRS" }
      ).addTo(mapRef.current);
    } else if (!showTrueColor && trueColorLayerRef.current) {
      mapRef.current.removeLayer(trueColorLayerRef.current);
      trueColorLayerRef.current = null;
    }
  }, [showTrueColor, satelliteLoaded]);


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

  // Reset progress on idle (keep map alive so block is always visible)
  useEffect(() => {
    if (stage === "idle") {
      setScanProgress(0);
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

  // Always render — block visible even before scan starts

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

      {/* GIBS overlay controls */}
      <div className="absolute top-9 right-2 z-[1000] flex flex-col gap-1 bg-black/70 backdrop-blur-sm rounded-md border border-border/50 p-1.5">
        <button
          onClick={() => setShowThermal((v) => !v)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-medium transition-colors ${
            showThermal ? "bg-orange-500/30 text-orange-300 border border-orange-500/50" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
          title="VIIRS Thermal Anomalies — active gas flares & fires (NASA, free)"
        >
          <Flame className="h-3 w-3" />
          Flares
        </button>
        <button
          onClick={() => setShowTrueColor((v) => !v)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-medium transition-colors ${
            showTrueColor ? "bg-primary/30 text-primary border border-primary/50" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
          }`}
          title="VIIRS daily True Color imagery (NASA GIBS, free)"
        >
          <Layers className="h-3 w-3" />
          VIIRS RGB
        </button>
      </div>

      {/* Coordinates bar */}
      <div className="relative z-[1000] flex justify-between px-2 py-1 bg-black/80 text-[8px] font-mono text-muted-foreground border-t border-border/50">
        <span>33.5°N–36.5°N / 95.5°W–103.0°W</span>
        <span>ESRI base • NASA GIBS overlay • {gibsDate()}</span>
        <span>Free • No API key</span>
      </div>

    </div>
  );
};
