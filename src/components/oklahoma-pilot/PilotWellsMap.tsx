import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  water_cut: number | null;
  production_oil: number | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
}

interface PilotWellsMapProps {
  wells: WellRecord[];
  activeWellId?: string;
}

const getMarkerColor = (waterCut: number | null): string => {
  if (waterCut == null) return "#6b7280";
  if (waterCut > 70) return "#ef4444"; // destructive — high water cut
  if (waterCut > 50) return "#f59e0b"; // warning — moderate
  return "#22c55e"; // success — stable
};

const PilotWellsMap = ({ wells, activeWellId }: PilotWellsMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || wells.length === 0) return;

    const validWells = wells.filter((w) => w.latitude && w.longitude);
    if (validWells.length === 0) return;

    // Cleanup previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);

    const markers: L.CircleMarker[] = [];

    validWells.forEach((well, idx) => {
      const color = getMarkerColor(well.water_cut);
      const isActive = well.id === activeWellId;
      const radius = isActive ? 12 : 8;

      const marker = L.circleMarker([well.latitude!, well.longitude!], {
        radius,
        fillColor: color,
        color: isActive ? "#ffffff" : color,
        weight: isActive ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${well.well_name || "Unknown"}</div>
          <div style="font-size: 11px; color: #888; margin-bottom: 6px;">API: ${well.api_number || "—"}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
            <span style="color: #888;">Operator:</span><span>${well.operator || "—"}</span>
            <span style="color: #888;">County:</span><span>${well.county || "—"}</span>
            <span style="color: #888;">Oil:</span><span style="font-weight: 600;">${well.production_oil?.toFixed(1) ?? "—"} bbl/d</span>
            <span style="color: #888;">Water Cut:</span><span style="font-weight: 600; color: ${color};">${well.water_cut?.toFixed(1) ?? "—"}%</span>
          </div>
        </div>
      `);

      // Number label
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width: ${radius * 2}px; height: ${radius * 2}px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: white;
          pointer-events: none;
        ">${idx + 1}</div>`,
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
      });

      L.marker([well.latitude!, well.longitude!], { icon, interactive: false }).addTo(map);
      markers.push(marker);
    });

    // Fit bounds
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.3));

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [wells, activeWellId]);

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Well Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="h-[350px] rounded-lg overflow-hidden border border-border/50" />
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> WC &lt; 50%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" /> WC 50–70%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> WC &gt; 70%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PilotWellsMap;
