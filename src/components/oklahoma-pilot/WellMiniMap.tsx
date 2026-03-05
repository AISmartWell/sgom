import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WellMiniMapProps {
  lat: number;
  lng: number;
  name?: string | null;
}

const WellMiniMap = ({ lat, lng, name }: WellMiniMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      dragging: true,
      attributionControl: false,
    }).setView([lat, lng], 12);

    mapRef.current = map;

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 7,
      fillColor: "hsl(210, 100%, 56%)",
      color: "hsl(210, 100%, 70%)",
      weight: 2,
      fillOpacity: 0.9,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-size:11px;font-weight:600;">${name || "Well"}</div>
         <div style="font-size:10px;color:#888;">${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W</div>`
      );

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return (
    <div className="relative overflow-hidden rounded-md border border-border/30">
      <div ref={containerRef} className="h-[160px] w-full" />
      <div className="absolute bottom-1 left-1 z-[1000] bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[9px] text-muted-foreground">
        {lat.toFixed(4)}°N, {Math.abs(lng).toFixed(4)}°W
      </div>
    </div>
  );
};

export default WellMiniMap;
