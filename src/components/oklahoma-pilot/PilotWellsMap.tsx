import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
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

const STATE_LABELS: Record<string, string> = {
  OK: "Oklahoma",
  TX: "Texas",
  KS: "Kansas",
  NM: "New Mexico",
  CO: "Colorado",
  ND: "North Dakota",
  WY: "Wyoming",
};

interface PilotWellsMapProps {
  wells: WellRecord[];
  selectedIds?: Set<string>;
  activeWellId?: string;
  analyzedIds?: Set<string>;
  onWellClick?: (wellId: string) => void;
  onPolygonSelect?: (wellIds: string[]) => void;
  selectedState?: string;
}

const getMarkerColor = (waterCut: number | null): string => {
  if (waterCut == null) return "#6b7280";
  if (waterCut > 70) return "#ef4444";
  if (waterCut > 50) return "#f59e0b";
  return "#22c55e";
};

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

const PilotWellsMap = ({ wells, selectedIds, activeWellId, analyzedIds, onWellClick, onPolygonSelect, selectedState }: PilotWellsMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const wellsRef = useRef(wells);
  wellsRef.current = wells;
  const onPolygonSelectRef = useRef(onPolygonSelect);
  onPolygonSelectRef.current = onPolygonSelect;
  const onWellClickRef = useRef(onWellClick);
  onWellClickRef.current = onWellClick;

  // Initialize map once when wells data loads
  useEffect(() => {
    if (!mapRef.current || wells.length === 0) return;

    const validWells = wells.filter((w) => w.latitude && w.longitude);
    if (validWells.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersRef.current.clear();

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

    // Create markers
    const allMarkers: L.CircleMarker[] = [];
    validWells.forEach((well) => {
      const color = getMarkerColor(well.water_cut);
      const marker = L.circleMarker([well.latitude!, well.longitude!], {
        radius: 8,
        fillColor: color,
        color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      const isAnalyzed = analyzedIds?.has(well.id) ?? false;
      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${well.well_name || "Unknown"} ${isAnalyzed ? '✅' : ''}</div>
          <div style="font-size: 11px; color: #888; margin-bottom: 6px;">API: ${well.api_number || "—"} ${isAnalyzed ? '<span style="color:#22c55e;font-weight:600;">Analyzed</span>' : ''}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
            <span style="color: #888;">Operator:</span><span>${well.operator || "—"}</span>
            <span style="color: #888;">County:</span><span>${well.county || "—"}</span>
            <span style="color: #888;">Oil:</span><span style="font-weight: 600;">${well.production_oil?.toFixed(1) ?? "—"} bbl/d</span>
            <span style="color: #888;">Water Cut:</span><span style="font-weight: 600; color: ${color};">${well.water_cut?.toFixed(1) ?? "—"}%</span>
          </div>
        </div>
      `);

      marker.on("click", () => {
        if (onWellClickRef.current) onWellClickRef.current(well.id);
      });

      markersRef.current.set(well.id, marker);
      allMarkers.push(marker);
    });

    const group = L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds().pad(0.3));

    // Drawing controls
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: "#3b82f6", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.15 },
        },
        rectangle: {
          shapeOptions: { color: "#3b82f6", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.15 },
        },
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      const currentWells = wellsRef.current.filter(w => w.latitude && w.longitude);
      let insideIds: string[] = [];

      if (event.layerType === "rectangle") {
        const bounds = layer.getBounds() as L.LatLngBounds;
        insideIds = currentWells
          .filter(w => bounds.contains(L.latLng(w.latitude!, w.longitude!)))
          .map(w => w.id);
      } else {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const polygon: [number, number][] = latlngs.map((ll: L.LatLng) => [ll.lat, ll.lng]);
        insideIds = currentWells
          .filter(w => isPointInPolygon([w.latitude!, w.longitude!], polygon))
          .map(w => w.id);
      }

      if (onPolygonSelectRef.current && insideIds.length > 0) {
        onPolygonSelectRef.current(insideIds);
      }

      const center = layer.getBounds().getCenter();
      L.popup()
        .setLatLng(center)
        .setContent(`<div style="font-family:system-ui;text-align:center;"><b>${insideIds.length}</b> wells selected</div>`)
        .openOn(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();
    };
    // Only re-init when wells array reference changes (data load)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wells]);

  // Update marker styles when selection/active/analyzed state changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker, wellId) => {
      const well = wells.find(w => w.id === wellId);
      if (!well) return;

      const color = getMarkerColor(well.water_cut);
      const isActive = wellId === activeWellId;
      const isSelected = selectedIds?.has(wellId) ?? true;
      const isAnalyzed = analyzedIds?.has(wellId) ?? false;
      const radius = isActive ? 12 : isSelected ? 8 : isAnalyzed ? 7 : 5;
      const opacity = isSelected ? 0.9 : isAnalyzed ? 0.6 : 0.35;

      marker.setRadius(radius);
      marker.setStyle({
        fillColor: isAnalyzed && !isSelected ? "#22c55e" : color,
        color: isActive ? "#ffffff" : isAnalyzed && !isSelected ? "#16a34a" : isSelected ? color : "#6b7280",
        weight: isActive ? 3 : isAnalyzed ? 2.5 : isSelected ? 2 : 1,
        fillOpacity: opacity,
      });
    });
  }, [wells, selectedIds, activeWellId, analyzedIds]);

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {STATE_LABELS[selectedState || "OK"] || selectedState} Wells ({wells.length})
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
            <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-green-600 bg-green-500/40" /> ✅ Analyzed
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full border border-muted-foreground opacity-40" /> Not selected
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
