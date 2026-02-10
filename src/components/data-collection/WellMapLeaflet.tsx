import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Download } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapWell {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  well_type: string | null;
  status: string | null;
  county: string | null;
  latitude: number;
  longitude: number;
  production_oil: number | null;
  formation: string | null;
}

const getMarkerColor = (status: string | null): string => {
  if (!status) return "#6b7280";
  const s = status.toUpperCase();
  if (s.includes("ACTIVE") || s.includes("PRODUCING")) return "#22c55e";
  if (s.includes("SHUT") || s.includes("INACTIVE")) return "#f59e0b";
  if (s.includes("PLUGGED") || s.includes("ABANDONED")) return "#ef4444";
  return "#6b7280";
};

const generateKML = (wells: MapWell[]): string => {
  const placemarks = wells.map((w) => {
    const color = getMarkerColor(w.status);
    // KML uses aaBBGGRR format
    const hex = color.replace("#", "");
    const kmlColor = `ff${hex.slice(4, 6)}${hex.slice(2, 4)}${hex.slice(0, 2)}`;
    return `    <Placemark>
      <name>${escapeXml(w.well_name || "Unknown")}</name>
      <description><![CDATA[
API: ${w.api_number || "N/A"}
Operator: ${w.operator || "N/A"}
Formation: ${w.formation || "N/A"}
Status: ${w.status || "N/A"}
County: ${w.county || "N/A"}
Oil Production: ${w.production_oil != null ? w.production_oil.toLocaleString() + " bbl" : "N/A"}
      ]]></description>
      <Style>
        <IconStyle>
          <color>${kmlColor}</color>
          <scale>0.8</scale>
          <Icon><href>http://maps.google.com/mapfiles/kml/shapes/oil.png</href></Icon>
        </IconStyle>
      </Style>
      <Point>
        <coordinates>${w.longitude},${w.latitude},0</coordinates>
      </Point>
    </Placemark>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Well Locations</name>
    <description>Exported from SGOM Platform</description>
${placemarks}
  </Document>
</kml>`;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const WellMapLeaflet = () => {
  const [wells, setWells] = useState<MapWell[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, well_type, status, county, latitude, longitude, production_oil, formation")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(500);
      if (data) setWells(data as MapWell[]);
      setIsLoading(false);
    };
    load();
  }, []);

  const center: [number, number] = wells.length > 0
    ? [
        wells.reduce((s, w) => s + w.latitude, 0) / wells.length,
        wells.reduce((s, w) => s + w.longitude, 0) / wells.length,
      ]
    : [35.5, -97.5]; // Oklahoma default

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Well Location Map
          <Badge className="bg-success/20 text-success border-success/30 ml-2">
            {wells.length} wells
          </Badge>
          {wells.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => {
                const kml = generateKML(wells);
                const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "wells.kml";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Export KML
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Interactive map showing wells with GPS coordinates from the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : wells.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No wells with coordinates found. Fetch data from OCC API first.</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] rounded-lg overflow-hidden border border-border/50">
            <MapContainer
              center={center}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {wells.map((well) => (
                <CircleMarker
                  key={well.id}
                  center={[well.latitude, well.longitude]}
                  radius={6}
                  pathOptions={{
                    color: getMarkerColor(well.status),
                    fillColor: getMarkerColor(well.status),
                    fillOpacity: 0.8,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="text-sm space-y-1 min-w-[180px]">
                      <p className="font-bold">{well.well_name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">API: {well.api_number}</p>
                      {well.operator && <p>Operator: {well.operator}</p>}
                      {well.formation && <p>Formation: {well.formation}</p>}
                      {well.status && <p>Status: {well.status}</p>}
                      {well.county && <p>County: {well.county}</p>}
                      {well.production_oil != null && (
                        <p>Oil: {well.production_oil.toLocaleString()} bbl</p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Legend */}
        {wells.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span>Inactive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span>Plugged/Abandoned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#6b7280]" />
              <span>Unknown</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WellMapLeaflet;
