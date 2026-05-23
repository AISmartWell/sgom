import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Play, Loader2, CheckCircle2, AlertTriangle, Layers, Cpu, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import FieldScanStageViz from "@/components/oklahoma-pilot/FieldScanStageViz";
import ClassificationStageViz from "@/components/oklahoma-pilot/stage-viz/ClassificationStageViz";
import CoreAnalysisStageViz from "@/components/oklahoma-pilot/stage-viz/CoreAnalysisStageViz";
import CumulativeStageViz from "@/components/oklahoma-pilot/stage-viz/CumulativeStageViz";
import SeismicStageViz from "@/components/oklahoma-pilot/stage-viz/SeismicStageViz";
import SPTProjectionStageViz from "@/components/oklahoma-pilot/stage-viz/SPTProjectionStageViz";
import EconomicStageViz from "@/components/oklahoma-pilot/stage-viz/EconomicStageViz";
import GeophysicalStageViz from "@/components/oklahoma-pilot/stage-viz/GeophysicalStageViz";

const STAGES = [
  { key: "field_scan",              label: "Field Scanning",          n: 1, icon: "🛰️" },
  { key: "classification",          label: "Data Classification",     n: 2, icon: "📂" },
  { key: "core_analysis",           label: "Core Analysis (CV)",      n: 3, icon: "🔬" },
  { key: "cumulative",              label: "Cumulative Analysis",     n: 4, icon: "📈" },
  { key: "seismic_reinterpretation",label: "Seismic Reinterpretation",n: 5, icon: "🌊" },
  { key: "spt_projection",          label: "SPT Projection",          n: 6, icon: "🎯" },
  { key: "economic",                label: "Economic Analysis",       n: 7, icon: "💰" },
  { key: "geophysical",             label: "Geophysical Expertise",   n: 8, icon: "📊" },
  { key: "eor",                     label: "EOR Recommendation",      n: 9, icon: "⚙️" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface StageResult {
  title?: string;
  verdict?: string;
  metrics?: { label: string; value: string; color?: string }[];
  [k: string]: any;
}

interface StageState {
  status: "idle" | "running" | "done" | "error";
  result?: StageResult;
  error?: string;
}

// ─── Aramco demo well pool ────────────────────────────────────────────────────
const ARAMCO_WELLS: WellRecord[] = [
  {
    id: "aramco-ghw-a-184",
    well_name: "GHW-A-184", api_number: "ARM-1840184", operator: "Saudi Aramco",
    county: "Eastern Province", state: "SA", formation: "Arab-D",
    production_oil: 312, production_gas: 145, water_cut: 38,
    total_depth: 7250, well_type: "Producer", status: "Active",
    latitude: 25.71, longitude: 49.51,
  },
  {
    id: "aramco-ghw-s-072",
    well_name: "GHW-S-072", api_number: "ARM-1840072", operator: "Saudi Aramco",
    county: "Eastern Province", state: "SA", formation: "Arab-D",
    production_oil: 245, production_gas: 120, water_cut: 44,
    total_depth: 6980, well_type: "Producer", status: "Active",
    latitude: 25.05, longitude: 49.42,
  },
  {
    id: "aramco-khr-n-031",
    well_name: "KHR-N-031", api_number: "ARM-1830031", operator: "Saudi Aramco",
    county: "Khurais Field", state: "SA", formation: "Arab-D",
    production_oil: 388, production_gas: 162, water_cut: 29,
    total_depth: 7510, well_type: "Producer", status: "Active",
    latitude: 25.12, longitude: 48.13,
  },
  {
    id: "aramco-brr-k-118",
    well_name: "BRR-K-118", api_number: "ARM-1820118", operator: "Saudi Aramco",
    county: "Berri Field", state: "SA", formation: "Hanifa",
    production_oil: 198, production_gas: 95, water_cut: 51,
    total_depth: 8120, well_type: "Producer", status: "Active",
    latitude: 27.41, longitude: 49.62,
  },
];

export default function AramcoStageRunner() {
  const [wellId, setWellId] = useState<string>(ARAMCO_WELLS[0].id);
  const [stages, setStages] = useState<Record<StageKey, StageState>>(
    () =>
      Object.fromEntries(STAGES.map((s) => [s.key, { status: "idle" }])) as Record<
        StageKey,
        StageState
      >
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeStage, setActiveStage] = useState<StageKey | null>(null);
  const [stageProgress, setStageProgress] = useState(0);

  const well = useMemo(
    () => ARAMCO_WELLS.find((w) => w.id === wellId) ?? ARAMCO_WELLS[0],
    [wellId]
  );

  const completedCount = useMemo(
    () => Object.values(stages).filter((s) => s.status === "done").length,
    [stages]
  );

  const resetStages = () => {
    setStages(
      Object.fromEntries(STAGES.map((s) => [s.key, { status: "idle" }])) as Record<
        StageKey,
        StageState
      >
    );
    setActiveStage(null);
    setStageProgress(0);
  };

  const runStage = async (stageKey: StageKey) => {
    setActiveStage(stageKey);
    setStageProgress(10);
    setStages((p) => ({ ...p, [stageKey]: { status: "running" } }));

    const interval = setInterval(() => {
      setStageProgress((v) => Math.min(v + 4, 92));
    }, 250);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-well-stage", {
        body: { well, stageKey },
      });
      if (error) throw new Error(error.message || "Edge function error");
      if (data?.error) throw new Error(data.error);
      clearInterval(interval);
      setStageProgress(100);
      setStages((p) => ({ ...p, [stageKey]: { status: "done", result: data } }));
      return true;
    } catch (e: any) {
      clearInterval(interval);
      setStageProgress(0);
      setStages((p) => ({
        ...p,
        [stageKey]: { status: "error", error: e?.message || "Unknown error" },
      }));
      toast.error(`Stage ${STAGES.find((s) => s.key === stageKey)?.n} failed: ${e?.message}`);
      return false;
    } finally {
      setActiveStage(null);
    }
  };

  const runAll = async () => {
    setIsRunning(true);
    resetStages();
    for (const s of STAGES) {
      const ok = await runStage(s.key);
      if (!ok) break;
      await new Promise((r) => setTimeout(r, 150));
    }
    setIsRunning(false);
    toast.success("Pipeline complete — review per-stage evidence below");
  };

  const renderStageViz = (key: StageKey) => {
    switch (key) {
      case "field_scan":
        return <FieldScanStageViz well={well} allWells={ARAMCO_WELLS} />;
      case "classification":
        return <ClassificationStageViz well={well} allWells={ARAMCO_WELLS} />;
      case "core_analysis":
        return <CoreAnalysisStageViz well={well} />;
      case "cumulative":
        return <CumulativeStageViz well={well} />;
      case "seismic_reinterpretation":
        return <SeismicStageViz well={well} />;
      case "spt_projection":
        return <SPTProjectionStageViz well={well} />;
      case "economic":
        return <EconomicStageViz well={well} />;
      case "geophysical":
        return <GeophysicalStageViz well={well} />;
      case "eor":
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <Layers className="h-4 w-4 text-primary" />
          9-Stage AI Pipeline — Live Runner
          <Badge variant="outline" className="text-[10px] ml-auto">
            {completedCount}/9 stages complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Well picker + controls */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border/40 bg-muted/10">
          <div className="flex flex-wrap gap-1.5">
            {ARAMCO_WELLS.map((w) => (
              <Button
                key={w.id}
                size="sm"
                variant={w.id === wellId ? "default" : "outline"}
                className="text-xs h-7"
                disabled={isRunning}
                onClick={() => {
                  setWellId(w.id);
                  resetStages();
                }}
              >
                {w.well_name}
                <span className="ml-1 text-[10px] opacity-70">
                  {w.formation} · WC {w.water_cut}%
                </span>
              </Button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resetStages}
              disabled={isRunning}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={runAll} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Running pipeline…
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Run All 9 Stages
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-9 gap-1">
          {STAGES.map((s) => {
            const st = stages[s.key].status;
            return (
              <div
                key={s.key}
                className={`p-1.5 rounded text-center border text-[10px] ${
                  st === "done"
                    ? "border-success/40 bg-success/10 text-success"
                    : st === "running"
                    ? "border-primary/40 bg-primary/10 text-primary animate-pulse"
                    : st === "error"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border/40 bg-background/40 text-muted-foreground"
                }`}
                title={s.label}
              >
                <div className="text-sm leading-none">{s.icon}</div>
                <div className="font-semibold">S{s.n}</div>
              </div>
            );
          })}
        </div>

        {/* Per-stage cards */}
        <div className="space-y-3">
          {STAGES.map((s) => {
            const st = stages[s.key];
            const isActive = activeStage === s.key;
            return (
              <div
                key={s.key}
                className={`rounded-lg border p-3 transition-colors ${
                  st.status === "done"
                    ? "border-success/30 bg-success/5"
                    : st.status === "error"
                    ? "border-destructive/30 bg-destructive/5"
                    : isActive
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-background/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                      Stage {s.n}
                    </Badge>
                    <h3 className="font-semibold text-sm">{s.label}</h3>
                    {st.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {st.status === "error" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {isActive && (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => runStage(s.key)}
                    disabled={isRunning || isActive}
                  >
                    <Cpu className="h-3 w-3 mr-1" />
                    {st.status === "done" ? "Re-run" : "Run"}
                  </Button>
                </div>

                {isActive && (
                  <Progress value={stageProgress} className="h-1.5 mt-2" />
                )}

                {st.status === "done" && st.result && (
                  <>
                    {st.result.verdict && (
                      <p className="text-xs mt-2 text-muted-foreground whitespace-pre-wrap">
                        {st.result.verdict}
                      </p>
                    )}
                    {st.result.metrics && st.result.metrics.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {st.result.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-muted/20 border border-border/30"
                          >
                            <p className="text-[10px] text-muted-foreground">
                              {m.label}
                            </p>
                            <p className="text-xs font-semibold">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator className="my-3" />
                    {renderStageViz(s.key)}
                  </>
                )}

                {st.status === "error" && (
                  <p className="text-xs mt-2 text-destructive">{st.error}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
