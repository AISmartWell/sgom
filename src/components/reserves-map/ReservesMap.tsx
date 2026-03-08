import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Map, BarChart3, Droplets } from "lucide-react";
import { FORMATION_DB } from "@/lib/formation-db";
import "leaflet/dist/leaflet.css";

interface WellWithReserves {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  status: string | null;
  county: string | null;
  state: string;
  latitude: number;
  longitude: number;
  production_oil: number | null;
  water_cut: number | null;
  formation: string | null;
  total_depth: number | null;
  cumulativeOil: number;
  ioip: number;
  remainingReserves: number;
  recoveryFactor: number;
}

// IOIP volumetric: 7758 * A * h * phi * (1-Sw) / Bo
function calcIOIP(formationName: string | null): number {
  const A = 40; // acres
  const Bo = 1.15;
  let h = 30, phi = 0.12, Sw = 0.35;

  if (formationName) {
    const key = Object.keys(FORMATION_DB).find(
      k => k.toLowerCase() === formationName.toLowerCase() || formationName.toLowerCase().includes(k.toLowerCase())
    );
    if (key) {
      const f = FORMATION_DB[key];
      phi = (f.phiMin + f.phiMax) / 200; // avg as fraction
      // Estimate Sw from porosity range
      Sw = phi > 0.15 ? 0.25 : phi > 0.08 ? 0.35 : 0.45;
    }
  }

  return Math.round(7758 * A * h * phi * (1 - Sw) / Bo);
}

function getReservesColor(remainingPct: number): string {
  // remainingPct = remaining / ioip * 100
  if (remainingPct >= 95) return "hsl(142, 76%, 36%)"; // green - untapped
  if (remainingPct >= 90) return "hsl(142, 60%, 50%)";
  if (remainingPct >= 80) return "hsl(80, 60%, 50%)";  // yellow-green
  if (remainingPct >= 60) return "hsl(45, 90%, 50%)";  // yellow
  if (remainingPct >= 40) return "hsl(25, 90%, 50%)";  // orange
  return "hsl(0, 70%, 50%)";                           // red - depleted
}

function getReservesRadius(ioip: number): number {
  if (ioip > 1_000_000) return 12;
  if (ioip > 500_000) return 10;
  if (ioip > 200_000) return 8;
  return 6;
}

function AutoFit({ wells }: { wells: WellWithReserves[] }) {
  const map = useMap();
  useEffect(() => {
    if (wells.length === 0) return;
    const bounds = wells.map(w => [w.latitude, w.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  }, [wells, map]);
  return null;
}

const ReservesMap = () => {
  const [wells, setWells] = useState<WellWithReserves[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Fetch Mississippian wells with coordinates
      const { data: wellRows } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, status, county, state, latitude, longitude, production_oil, water_cut, formation, total_depth")
        .or("formation.ilike.%mississippian%,formation.ilike.%miss%lime%")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (!wellRows || wellRows.length === 0) {
        setWells([]);
        setLoading(false);
        return;
      }

      // Fetch cumulative production for each well
      const wellIds = wellRows.map(w => w.id);
      const { data: prodRows } = await supabase
        .from("production_history")
        .select("well_id, oil_bbl")
        .in("well_id", wellIds);

      // Sum cumulative oil per well
      const cumMap: Record<string, number> = {};
      (prodRows ?? []).forEach(r => {
        cumMap[r.well_id] = (cumMap[r.well_id] || 0) + (r.oil_bbl ?? 0);
      });

      const result: WellWithReserves[] = wellRows.map(w => {
        const cum = cumMap[w.id] || 0;
        const ioip = calcIOIP(w.formation);
        const remaining = Math.max(ioip - cum, 0);
        const rf = ioip > 0 ? (cum / ioip) * 100 : 0;
        return {
          ...w,
          latitude: w.latitude!,
          longitude: w.longitude!,
          cumulativeOil: cum,
          ioip,
          remainingReserves: remaining,
          recoveryFactor: rf,
        };
      });

      setWells(result);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    if (wells.length === 0) return null;
    const totalIOIP = wells.reduce((s, w) => s + w.ioip, 0);
    const totalCum = wells.reduce((s, w) => s + w.cumulativeOil, 0);
    const totalRemaining = wells.reduce((s, w) => s + w.remainingReserves, 0);
    const avgRF = totalIOIP > 0 ? (totalCum / totalIOIP) * 100 : 0;
    return { totalIOIP, totalCum, totalRemaining, avgRF };
  }, [wells]);

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Map className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Mississippian Reserves Map</CardTitle>
              <CardDescription>
                Remaining reserves (IOIP − Cumulative Production) by volumetric method
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">{wells.length} wells</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPI Summary */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-lg font-bold text-primary">{(stats.totalIOIP / 1_000_000).toFixed(2)}M</p>
                <p className="text-[10px] text-muted-foreground">Total IOIP (STB)</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-lg font-bold text-warning">{stats.totalCum.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Cumulative Prod (bbl)</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-lg font-bold text-success">{(stats.totalRemaining / 1_000_000).toFixed(2)}M</p>
                <p className="text-[10px] text-muted-foreground">Remaining (STB)</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-lg font-bold text-destructive">{stats.avgRF.toFixed(2)}%</p>
                <p className="text-[10px] text-muted-foreground">Avg Recovery Factor</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading Mississippian wells...</span>
            </div>
          ) : wells.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No Mississippian wells with coordinates found
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-border/30" style={{ height: 500 }}>
              <MapContainer
                center={[36.5, -97.5]}
                zoom={7}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="ESRI Satellite"
                />
                <AutoFit wells={wells} />
                {wells.map(w => {
                  const remainPct = w.ioip > 0 ? (w.remainingReserves / w.ioip) * 100 : 0;
                  return (
                    <CircleMarker
                      key={w.id}
                      center={[w.latitude, w.longitude]}
                      radius={getReservesRadius(w.ioip)}
                      pathOptions={{
                        color: getReservesColor(remainPct),
                        fillColor: getReservesColor(remainPct),
                        fillOpacity: 0.8,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 min-w-[200px]">
                          <p className="font-bold text-sm">{w.well_name || "Unknown"}</p>
                          <p className="text-muted-foreground">API: {w.api_number || "N/A"}</p>
                          <hr className="border-border/30" />
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            <span className="text-muted-foreground">Formation:</span>
                            <span className="font-medium">{w.formation || "N/A"}</span>
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-medium">{w.status || "N/A"}</span>
                            <span className="text-muted-foreground">IOIP:</span>
                            <span className="font-medium">{(w.ioip / 1000).toFixed(0)}K STB</span>
                            <span className="text-muted-foreground">Cumulative:</span>
                            <span className="font-medium">{w.cumulativeOil.toLocaleString()} bbl</span>
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="font-bold" style={{ color: getReservesColor(remainPct) }}>
                              {(w.remainingReserves / 1000).toFixed(0)}K STB
                            </span>
                            <span className="text-muted-foreground">RF:</span>
                            <span className="font-medium">{w.recoveryFactor.toFixed(2)}%</span>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="font-semibold text-xs text-foreground">Legend (Remaining %):</span>
            {[
              { label: "≥95% (Untapped)", color: getReservesColor(95) },
              { label: "80-95%", color: getReservesColor(85) },
              { label: "60-80%", color: getReservesColor(70) },
              { label: "40-60%", color: getReservesColor(50) },
              { label: "<40% (Depleted)", color: getReservesColor(30) },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservesMap;
