import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WellLocationMapProps {
  latitude: number;
  longitude: number;
  wellName: string;
  formation?: string | null;
  status?: string | null;
}

const WellLocationMap = ({ latitude, longitude, wellName, formation, status }: WellLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 }
    ).addTo(map);

    // Pulsing marker
    const markerHtml = `
      <div style="position:relative;width:24px;height:24px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:hsl(var(--primary));opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:hsl(var(--primary));border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
    `;

    const icon = L.divIcon({
      html: markerHtml,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([latitude, longitude], { icon })
      .addTo(map)
      .bindPopup(
        `<div style="font-size:13px;line-height:1.4;">
          <strong>${wellName}</strong><br/>
          ${formation ? `Formation: ${formation}<br/>` : ""}
          ${status ? `Status: ${status}<br/>` : ""}
          <span style="opacity:0.7">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</span>
        </div>`
      );

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [latitude, longitude, wellName, formation, status]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[220px] rounded-lg overflow-hidden border border-border/50"
    />
  );
};

export default WellLocationMap;
