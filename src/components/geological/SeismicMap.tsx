import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface SeismicHorizon {
  name: string;
  depth: number;
  color: string;
  polygon: [number, number][];
}

interface WellMarker {
  name: string;
  lat: number;
  lng: number;
  formation: string;
  depth: number;
  status: string;
}

const SeismicMap = () => {
  // Center on Permian Basin area (West Texas)
  const center: [number, number] = [31.95, -102.1];

  const horizons: SeismicHorizon[] = useMemo(
    () => [
      {
        name: "Top Wolfcamp A",
        depth: 6800,
        color: "#ef4444",
        polygon: [
          [32.05, -102.3],
          [32.1, -102.0],
          [31.95, -101.85],
          [31.85, -102.05],
          [31.9, -102.35],
        ],
      },
      {
        name: "Base Bone Spring",
        depth: 8200,
        color: "#f59e0b",
        polygon: [
          [32.0, -102.25],
          [32.08, -101.95],
          [31.92, -101.82],
          [31.82, -102.0],
          [31.88, -102.3],
        ],
      },
      {
        name: "Top Spraberry",
        depth: 5400,
        color: "#22c55e",
        polygon: [
          [32.12, -102.35],
          [32.18, -101.9],
          [32.0, -101.75],
          [31.88, -101.95],
          [31.92, -102.4],
        ],
      },
      {
        name: "Basement Reflection",
        depth: 12000,
        color: "#8b5cf6",
        polygon: [
          [32.15, -102.45],
          [32.22, -101.85],
          [32.02, -101.7],
          [31.82, -101.9],
          [31.88, -102.5],
        ],
      },
    ],
    []
  );

  const wells: WellMarker[] = useMemo(
    () => [
      { name: "Permian-A1", lat: 32.02, lng: -102.15, formation: "Wolfcamp A", depth: 7200, status: "Producing" },
      { name: "Permian-B3", lat: 31.92, lng: -102.0, formation: "Bone Spring", depth: 8500, status: "Producing" },
      { name: "Midland-C7", lat: 31.98, lng: -101.9, formation: "Spraberry", depth: 5800, status: "Shut-in" },
      { name: "Delaware-D2", lat: 31.88, lng: -102.2, formation: "Wolfcamp A", depth: 7100, status: "Drilling" },
      { name: "Basin-E5", lat: 32.08, lng: -102.05, formation: "Bone Spring", depth: 8100, status: "Producing" },
      { name: "WTX-F9", lat: 32.0, lng: -102.3, formation: "Wolfcamp A", depth: 7400, status: "Completed" },
    ],
    []
  );

  const wellIcon = (status: string) => {
    const color =
      status === "Producing" ? "#22c55e" :
      status === "Drilling" ? "#3b82f6" :
      status === "Shut-in" ? "#ef4444" : "#f59e0b";

    return L.divIcon({
      className: "custom-well-marker",
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};border:2px solid white;
        box-shadow:0 0 6px ${color}80;
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="font-semibold text-sm">Horizons:</span>
        {horizons.map((h) => (
          <span key={h.name} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: h.color, opacity: 0.5 }} />
            {h.name} ({h.depth.toLocaleString()} ft)
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="font-semibold text-sm">Wells:</span>
        {[
          { label: "Producing", color: "#22c55e" },
          { label: "Drilling", color: "#3b82f6" },
          { label: "Shut-in", color: "#ef4444" },
          { label: "Completed", color: "#f59e0b" },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Map */}
      <div className="h-[500px] rounded-lg overflow-hidden border border-border">
        <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Seismic Horizons as polygons */}
          {horizons.map((h) => (
            <Polygon
              key={h.name}
              positions={h.polygon}
              pathOptions={{ color: h.color, fillColor: h.color, fillOpacity: 0.15, weight: 2 }}
            >
              <Tooltip sticky>
                <strong>{h.name}</strong><br />
                Depth: {h.depth.toLocaleString()} ft
              </Tooltip>
            </Polygon>
          ))}

          {/* Well markers */}
          {wells.map((w) => (
            <Marker key={w.name} position={[w.lat, w.lng]} icon={wellIcon(w.status)}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm">{w.name}</p>
                  <p>Formation: {w.formation}</p>
                  <p>TD: {w.depth.toLocaleString()} ft</p>
                  <p>Status: <strong>{w.status}</strong></p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default SeismicMap;
