import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Database,
  Download,
  Loader2,
  MapPin,
  Activity,
} from "lucide-react";
import { WellDetailDialog } from "./WellDetailDialog";

interface WellRecord {
  id: string;
  api_number: string;
  well_name: string;
  operator: string;
  well_type: string;
  status: string;
  county: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  formation: string | null;
  total_depth: number | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  spud_date: string | null;
  completion_date: string | null;
}

interface DbStats {
  total: number;
  byCounty: { county: string; count: number }[];
  byType: { well_type: string; count: number }[];
  withCoords: number;
}

const OKLAHOMA_COUNTIES = [
  "ALL", "CANADIAN", "CADDO", "GRADY", "OKLAHOMA", "BLAINE", "KINGFISHER", "LOGAN", "GARVIN", "MCCLAIN", "STEPHENS", "CARTER"
];

export const RealDataPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [wells, setWells] = useState<WellRecord[]>([]);
  const [stats, setStats] = useState<DbStats | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("ALL");
  const [selectedWell, setSelectedWell] = useState<WellRecord | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const { count: total } = await supabase.from("wells").select("*", { count: "exact", head: true });

      const { data: countyData } = await supabase.rpc("get_well_stats_by_county" as never) as { data: null };
      
      // Fallback: query manually
      const { data: allWells } = await supabase.from("wells").select("county, well_type, latitude").limit(1000);
      
      if (allWells) {
        const byCounty: Record<string, number> = {};
        const byType: Record<string, number> = {};
        let withCoords = 0;

        allWells.forEach((w: { county: string | null; well_type: string | null; latitude: number | null }) => {
          const c = w.county || "Unknown";
          const t = w.well_type || "Unknown";
          byCounty[c] = (byCounty[c] || 0) + 1;
          byType[t] = (byType[t] || 0) + 1;
          if (w.latitude) withCoords++;
        });

        setStats({
          total: total || allWells.length,
          byCounty: Object.entries(byCounty).map(([county, count]) => ({ county, count })).sort((a, b) => b.count - a.count),
          byType: Object.entries(byType).map(([well_type, count]) => ({ well_type, count })).sort((a, b) => b.count - a.count),
          withCoords,
        });
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWells = async () => {
    let query = supabase.from("wells").select("id, api_number, well_name, operator, well_type, status, county, state, latitude, longitude, formation, total_depth, production_oil, production_gas, water_cut, spud_date, completion_date").order("api_number", { ascending: false }).limit(50);
    if (selectedCounty !== "ALL") {
      query = query.eq("county", selectedCounty);
    }
    const { data } = await query;
    if (data) setWells(data as WellRecord[]);
  };

  const fetchFromOCC = async () => {
    setIsFetching(true);
    try {
      const county = selectedCounty === "ALL" ? undefined : selectedCounty;
      const { data, error } = await supabase.functions.invoke("fetch-wells", {
        body: { county, limit: 200 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Fetched ${data.fetched} wells from OCC, stored ${data.stored}`);
      await loadStats();
      await loadWells();
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to fetch wells");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadWells();
  }, []);

  useEffect(() => {
    loadWells();
  }, [selectedCounty]);

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Real Well Data — Oklahoma OCC
          <Badge className="bg-success/20 text-success border-success/30 ml-2">LIVE API</Badge>
        </CardTitle>
        <CardDescription>
          Connected to Oklahoma Corporation Commission ArcGIS API — real well records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Wells</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <p className="text-2xl font-bold">{stats.withCoords.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">With Coordinates</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg text-center">
              <p className="text-2xl font-bold">{stats.byCounty.length}</p>
              <p className="text-xs text-muted-foreground">Counties</p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg text-center">
              <p className="text-2xl font-bold">{stats.byType.length}</p>
              <p className="text-xs text-muted-foreground">Well Types</p>
            </div>
          </div>
        )}

        {/* County breakdown */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-medium mb-2">By County</p>
              <div className="space-y-1">
                {stats.byCounty.slice(0, 6).map((c) => (
                  <div key={c.county} className="flex justify-between text-sm px-2 py-1 rounded bg-muted/30">
                    <span>{c.county}</span>
                    <span className="font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">By Type</p>
              <div className="space-y-1">
                {stats.byType.slice(0, 6).map((t) => (
                  <div key={t.well_type} className="flex justify-between text-sm px-2 py-1 rounded bg-muted/30">
                    <span>{t.well_type}</span>
                    <span className="font-medium">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {OKLAHOMA_COUNTIES.map((c) => (
                <SelectItem key={c} value={c}>{c === "ALL" ? "All Counties" : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchFromOCC} disabled={isFetching}>
            {isFetching ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />Fetch from OCC API</>
            )}
          </Button>
        </div>

        {/* Wells table */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground px-2 py-1 border-b">
              <span>API #</span>
              <span>Well Name</span>
              <span>Operator</span>
              <span>Type</span>
              <span>County</span>
              <span>Coords</span>
            </div>
            {wells.map((well) => (
              <div key={well.id} className="grid grid-cols-6 gap-2 text-xs px-2 py-1.5 rounded hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedWell(well)}>
                <span className="font-mono">{well.api_number}</span>
                <span className="truncate">{well.well_name}</span>
                <span className="truncate">{well.operator}</span>
                <Badge variant="outline" className="text-[10px] h-5 w-fit">
                  {well.well_type || "—"}
                </Badge>
                <span>{well.county || "—"}</span>
                <span>
                  {well.latitude ? (
                    <MapPin className="h-3 w-3 text-success inline" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            ))}
            {wells.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No wells loaded yet. Click "Fetch from OCC API" to import real data.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <WellDetailDialog
        well={selectedWell}
        open={!!selectedWell}
        onOpenChange={(open) => !open && setSelectedWell(null)}
      />
    </Card>
  );
};
