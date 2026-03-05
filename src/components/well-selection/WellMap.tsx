import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { WellRanking } from "@/hooks/useWellRanking";

interface WellMapProps {
  rankings: WellRanking[] | null;
  region: string;
}

const REGION_CENTERS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  Oklahoma: { center: [35.5, -98.0], zoom: 7, label: "Anadarko Basin" },
  Texas: { center: [31.9, -102.5], zoom: 7, label: "Permian Basin" },
  NewMexico: { center: [32.3, -104.2], zoom: 7, label: "Delaware Basin" },
};

// Mock well positions keyed by region
const WELL_COORDS: Record<string, Record<string, [number, number]>> = {
  Oklahoma: {
    "W-001": [35.62, -98.35],
    "W-002": [35.48, -97.85],
    "W-003": [35.55, -98.10],
    "W-004": [35.72, -97.50],
    "W-005": [35.38, -97.70],
    "W-006": [35.25, -97.30],
    "W-007": [35.10, -98.20],
    "W-008": [35.05, -97.60],
  },
  Texas: {
    "W-001": [31.95, -102.10],
    "W-002": [32.10, -102.50],
    "W-003": [31.80, -102.30],
    "W-004": [32.25, -101.90],
    "W-005": [31.70, -102.60],
    "W-006": [32.00, -103.00],
    "W-007": [31.60, -102.80],
    "W-008": [32.15, -103.20],
  },
  NewMexico: {
    "W-001": [32.40, -104.10],
    "W-002": [32.55, -104.40],
    "W-003": [32.30, -104.25],
    "W-004": [32.65, -103.90],
    "W-005": [32.20, -104.50],
    "W-006": [32.50, -103.70],
    "W-007": [32.10, -104.60],
    "W-008": [32.60, -104.30],
  },
};

const getPotentialColor = (potential?: string): string => {
  switch (potential) {
    case "high": return "#22c55e";
    case "medium": return "#f59e0b";
    case "low": return "#ef4444";
    default: return "#6b7280";
  }
};

const WellMap = ({ rankings, region }: WellMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const regionConfig = REGION_CENTERS[region] || REGION_CENTERS.Oklahoma;
    const coords = WELL_COORDS[region] || WELL_COORDS.Oklahoma;

    const map = L.map(mapRef.current, { scrollWheelZoom: true, zoomControl: true });
    mapInstanceRef.current = map;

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri", maxZoom: 19 }
    );
    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    );
    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OSM &copy; CARTO",
      maxZoom: 18,
    });

    satellite.addTo(map);
    labels.addTo(map);

    L.control.layers(
      { "🛰️ Satellite": satellite, "🌑 Dark": dark },
      { Labels: labels },
      { position: "topright" }
    ).addTo(map);

    // Add well markers
    const markers: L.CircleMarker[] = [];
    Object.entries(coords).forEach(([wellId, [lat, lng]]) => {
      const ranking = rankings?.find((r) => r.wellId === wellId);
      const color = getPotentialColor(ranking?.potential);
      const radius = ranking?.potential === "high" ? 10 : ranking?.potential === "medium" ? 8 : 6;

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: color,
        color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:160px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${wellId}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
            <span style="color:#888;">Potential:</span>
            <span style="font-weight:600;color:${color};">${ranking?.potential?.toUpperCase() || "N/A"}</span>
            <span style="color:#888;">Score:</span>
            <span style="font-weight:600;">${ranking?.score?.toFixed(1) ?? "—"}</span>
          </div>
          ${ranking?.recommendation ? `<div style="font-size:10px;color:#aaa;margin-top:6px;border-top:1px solid #333;padding-top:4px;">${ranking.recommendation.slice(0, 80)}…</div>` : ""}
        </div>
      `);

      markers.push(marker);
    });

    if (markers.length > 0) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));
    } else {
      map.setView(regionConfig.center, regionConfig.zoom);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [rankings, region]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Well Field Map — {region}
        </CardTitle>
        <CardDescription>
          {(REGION_CENTERS[region] || REGION_CENTERS.Oklahoma).label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="h-80 rounded-lg overflow-hidden border border-border/50" />
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> High Potential
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-500" /> Not Analyzed
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellMap;
