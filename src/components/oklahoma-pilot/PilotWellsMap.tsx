import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  selectedIds?: Set<string>;
  activeWellId?: string;
  onWellClick?: (wellId: string) => void;
  onPolygonSelect?: (wellIds: string[]) => void;
}

const getMarkerColor = (waterCut: number | null): string => {
  if (waterCut == null) return "#6b7280";
  if (waterCut > 70) return "#ef4444";
  if (waterCut > 50) return "#f59e0b";
  return "#22c55e";
};

// Point-in-polygon ray casting
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

const PilotWellsMap = ({ wells, selectedIds, activeWellId, onWellClick, onPolygonSelect }: PilotWellsMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const wellsRef = useRef(wells);
  wellsRef.current = wells;
  const onPolygonSelectRef = useRef(onPolygonSelect);
  onPolygonSelectRef.current = onPolygonSelect;

  useEffect(() => {
    if (!mapRef.current || wells.length === 0) return;

    const validWells = wells.filter((w) => w.latitude && w.longitude);
    if (validWells.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { scrollWheelZoom: true, zoomControl: true });
    mapInstanceRef.current = map;

    // Satellite imagery layer (ESRI World Imagery)
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri", maxZoom: 19 }
    );

    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    );

    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 18,
    });

    satellite.addTo(map);
    labels.addTo(map);

    L.control.layers(
      { "🛰️ Satellite": satellite, "🌑 Dark": dark },
      { "Labels": labels },
      { position: "topright" }
    ).addTo(map);

    // Well markers
    const markers: L.CircleMarker[] = [];

    validWells.forEach((well) => {
      const color = getMarkerColor(well.water_cut);
      const isActive = well.id === activeWellId;
      const isSelected = selectedIds?.has(well.id) ?? true;
      const radius = isActive ? 12 : isSelected ? 8 : 5;
      const opacity = isSelected ? 0.9 : 0.35;

      const marker = L.circleMarker([well.latitude!, well.longitude!], {
        radius,
        fillColor: color,
        color: isActive ? "#ffffff" : isSelected ? color : "#6b7280",
        weight: isActive ? 3 : isSelected ? 2 : 1,
        opacity: 1,
        fillOpacity: opacity,
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
          ${isSelected ? '<div style="margin-top:6px;font-size:10px;color:#22c55e;">✓ Selected for analysis</div>' : '<div style="margin-top:6px;font-size:10px;color:#888;">Click to select</div>'}
        </div>
      `);

      if (onWellClick) {
        marker.on("click", () => onWellClick(well.id));
      }

      markers.push(marker);
    });

    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.3));

    // Drawing controls for polygon selection
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: "#3b82f6",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
          },
        },
        rectangle: {
          shapeOptions: {
            color: "#3b82f6",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
          },
        },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Handle polygon/rectangle created
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      // Find wells inside the drawn shape
      const currentWells = wellsRef.current.filter(w => w.latitude && w.longitude);
      let insideIds: string[] = [];

      if (event.layerType === "rectangle") {
        const bounds = layer.getBounds() as L.LatLngBounds;
        insideIds = currentWells
          .filter(w => bounds.contains(L.latLng(w.latitude!, w.longitude!)))
          .map(w => w.id);
      } else {
        // Polygon - use ray casting
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const polygon: [number, number][] = latlngs.map((ll: L.LatLng) => [ll.lat, ll.lng]);
        insideIds = currentWells
          .filter(w => isPointInPolygon([w.latitude!, w.longitude!], polygon))
          .map(w => w.id);
      }

      if (onPolygonSelectRef.current && insideIds.length > 0) {
        onPolygonSelectRef.current(insideIds);
      }

      // Show count tooltip
      const center = layer.getBounds().getCenter();
      L.popup()
        .setLatLng(center)
        .setContent(`<div style="font-family:system-ui;text-align:center;"><b>${insideIds.length}</b> wells selected</div>`)
        .openOn(map);
    });

    map.on(L.Draw.Event.DELETED, () => {
      // Clear polygon selection — don't deselect wells, just remove shape
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [wells, selectedIds, activeWellId, onWellClick]);

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Oklahoma Wells ({wells.length})
        </CardTitle>
        <p className="text-[11px] text-muted-foreground mt-1">
          🖊️ Draw a polygon or rectangle on the map to select wells in an area
        </p>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="h-[450px] rounded-lg overflow-hidden border border-border/50" />
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> WC &lt; 50%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" /> WC 50–70%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> WC &gt; 70%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-muted-foreground opacity-40" /> Not selected
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-primary" /> Selected
          </span>
          <span className="ml-auto flex items-center gap-1 font-medium">
            🖊️ Polygon / ▭ Rectangle = area select
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PilotWellsMap;
