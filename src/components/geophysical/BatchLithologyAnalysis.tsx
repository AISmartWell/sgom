import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Layers, Play, ArrowUpDown, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WellSummary {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
}

interface LithResult {
  well: WellSummary;
  totalThickness: number;
  sandFt: number;
  siltFt: number;
  shaleFt: number;
  sandPct: number;
  siltPct: number;
  shalePct: number;
  intervalCount: number;
  avgGR: number;
  pointCount: number;
}

type SortKey = "well_name" | "sandPct" | "siltPct" | "shalePct" | "totalThickness" | "avgGR";

const classifyGR = (gr: number): "sand" | "silt" | "shale" => {
  if (gr <= 45) return "sand";
  if (gr <= 75) return "silt";
  return "shale";
};

const BatchLithologyAnalysis = () => {
  const [wells, setWells] = useState<WellSummary[]>([]);
  const [results, setResults] = useState<LithResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [processed, setProcessed] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("sandPct");
  const [sortAsc, setSortAsc] = useState(false);

  // Load wells list
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .order("well_name", { ascending: true })
        .limit(200);
      setWells(data || []);
      setInitialLoading(false);
    })();
  }, []);

  const runBatchAnalysis = async () => {
    setLoading(true);
    setProcessed(0);
    const batchResults: LithResult[] = [];

    for (let i = 0; i < wells.length; i++) {
      const well = wells[i];
      const { data: logs } = await supabase
        .from("well_logs")
        .select("measured_depth, gamma_ray")
        .eq("well_id", well.id)
        .order("measured_depth", { ascending: true })
        .limit(1000);

      if (!logs || logs.length < 2) {
        setProcessed(i + 1);
        continue;
      }

      // Classify and accumulate
      let sandFt = 0, siltFt = 0, shaleFt = 0;
      let grSum = 0, grCount = 0;
      let intervals = 0;
      let prevLith: string | null = null;

      for (let j = 0; j < logs.length; j++) {
        const gr = logs[j].gamma_ray ?? 50;
        const lith = classifyGR(gr);
        const step = j > 0 ? Math.abs(logs[j].measured_depth - logs[j - 1].measured_depth) : 0.5;

        if (lith === "sand") sandFt += step;
        else if (lith === "silt") siltFt += step;
        else shaleFt += step;

        grSum += gr;
        grCount++;

        if (lith !== prevLith) { intervals++; prevLith = lith; }
      }

      const total = sandFt + siltFt + shaleFt;
      if (total > 0) {
        batchResults.push({
          well,
          totalThickness: Math.round(total * 10) / 10,
          sandFt: Math.round(sandFt * 10) / 10,
          siltFt: Math.round(siltFt * 10) / 10,
          shaleFt: Math.round(shaleFt * 10) / 10,
          sandPct: Math.round((sandFt / total) * 1000) / 10,
          siltPct: Math.round((siltFt / total) * 1000) / 10,
          shalePct: Math.round((shaleFt / total) * 1000) / 10,
          intervalCount: intervals,
          avgGR: Math.round((grSum / grCount) * 10) / 10,
          pointCount: grCount,
        });
      }

      setProcessed(i + 1);
    }

    setResults(batchResults);
    setLoading(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case "well_name": va = a.well.well_name || ""; vb = b.well.well_name || ""; break;
        case "sandPct": va = a.sandPct; vb = b.sandPct; break;
        case "siltPct": va = a.siltPct; vb = b.siltPct; break;
        case "shalePct": va = a.shalePct; vb = b.shalePct; break;
        case "totalThickness": va = a.totalThickness; vb = b.totalThickness; break;
        case "avgGR": va = a.avgGR; vb = b.avgGR; break;
        default: va = a.sandPct; vb = b.sandPct;
      }
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [results, sortKey, sortAsc]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (results.length === 0) return null;
    const avgSand = results.reduce((s, r) => s + r.sandPct, 0) / results.length;
    const avgSilt = results.reduce((s, r) => s + r.siltPct, 0) / results.length;
    const avgShale = results.reduce((s, r) => s + r.shalePct, 0) / results.length;
    const bestSand = results.reduce((best, r) => r.sandPct > best.sandPct ? r : best, results[0]);
    return { avgSand, avgSilt, avgShale, bestSand, totalWells: results.length };
  }, [results]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground text-sm">Loading wells...</span>
      </div>
    );
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === field && <ArrowUpDown className="h-3 w-3 text-primary" />}
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Header & Run button */}
      <Card className="bg-muted/20 border-border/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Batch Lithology Analysis
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Run GR lithology classification across all {wells.length} wells
              </p>
            </div>
            <Button
              onClick={runBatchAnalysis}
              disabled={loading || wells.length === 0}
              size="sm"
              className="gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {processed}/{wells.length}
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Analyze All Wells
                </>
              )}
            </Button>
          </div>

          {/* Progress bar */}
          {loading && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${wells.length > 0 ? (processed / wells.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Processing well {processed} of {wells.length}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Card className="bg-muted/20 border-border/30">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{summaryStats.totalWells}</div>
              <div className="text-[10px] text-muted-foreground">Wells Analyzed</div>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/30">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-success">{summaryStats.avgSand.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground">Avg Sand</div>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-warning">{summaryStats.avgSilt.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground">Avg Silt</div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-destructive">{summaryStats.avgShale.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground">Avg Shale</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-3 text-center">
              <div className="text-sm font-bold text-primary truncate">
                {summaryStats.bestSand.well.well_name || summaryStats.bestSand.well.api_number || "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Best Sand ({summaryStats.bestSand.sandPct}%)
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Table */}
      {results.length > 0 && (
        <Card className="bg-muted/20 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Lithology Comparison ({results.length} wells)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <tr className="border-b border-border/30">
                    <SortHeader label="Well" field="well_name" />
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Formation</th>
                    <SortHeader label="Total (ft)" field="totalThickness" />
                    <SortHeader label="Sand %" field="sandPct" />
                    <SortHeader label="Silt %" field="siltPct" />
                    <SortHeader label="Shale %" field="shalePct" />
                    <SortHeader label="Avg GR" field="avgGR" />
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.well.id} className="border-b border-border/10 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                        {r.well.well_name || r.well.api_number || r.well.id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.well.formation || "—"}</td>
                      <td className="px-3 py-2.5 font-mono">{r.totalThickness.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono text-success font-semibold">{r.sandPct}%</td>
                      <td className="px-3 py-2.5 font-mono text-warning font-semibold">{r.siltPct}%</td>
                      <td className="px-3 py-2.5 font-mono text-destructive font-semibold">{r.shalePct}%</td>
                      <td className="px-3 py-2.5 font-mono">{r.avgGR} API</td>
                      <td className="px-3 py-2.5">
                        {/* Mini stacked bar */}
                        <div className="flex h-4 w-24 rounded overflow-hidden border border-border/30">
                          <div
                            className="h-full bg-success"
                            style={{ width: `${r.sandPct}%` }}
                            title={`Sand: ${r.sandPct}%`}
                          />
                          <div
                            className="h-full bg-warning"
                            style={{ width: `${r.siltPct}%` }}
                            title={`Silt: ${r.siltPct}%`}
                          />
                          <div
                            className="h-full bg-destructive"
                            style={{ width: `${r.shalePct}%` }}
                            title={`Shale: ${r.shalePct}%`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !loading && (
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Click "Analyze All Wells" to run batch lithology classification
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchLithologyAnalysis;
