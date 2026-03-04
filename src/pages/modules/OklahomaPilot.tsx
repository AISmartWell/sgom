import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Droplets,
  Download,
  FileSpreadsheet,
  MapPin,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

// The 10 selected Oklahoma wells by API number
const TARGET_API_NUMBERS = [
  "3501537443", // HARTSHORN
  "3505136826", // FLOYD MCCAUGHTRY
  "3501537382", // WEST CEMENT UNIT
  "3501726054", // WATCH THIS 1208
  "3510938669", // MCKINNIS
  "3501726105", // HUFNAGEL
  "3501726050", // CHILES 22/15
  "3501726025", // AUSTIN 27_34
  "3501726059", // GARTH BROOKS 1107
  "3505136849", // H.L. JOHNSON "A"
];

const STAGES = [
  { key: "field_scan", label: "Field Scanning", badge: "Stage 1" },
  { key: "classification", label: "Data Classification", badge: "Stage 2" },
  { key: "core_analysis", label: "Core Analysis (CV)", badge: "Core" },
  { key: "cumulative", label: "Cumulative Analysis", badge: "Stage 3" },
  { key: "spt_projection", label: "SPT Projection", badge: "Stage 4" },
  { key: "economic", label: "Economic Analysis", badge: "Stage 5" },
  { key: "geophysical", label: "Geophysical Expertise", badge: "Stage 6" },
  { key: "eor", label: "EOR Recommendation", badge: "Final" },
];

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
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
}

interface WellAnalysis {
  well: WellRecord;
  stages: Map<string, StageResult>;
  status: "pending" | "running" | "done" | "error";
  error?: string;
}

const OklahomaPilot = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Map<string, WellAnalysis>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [currentWellIdx, setCurrentWellIdx] = useState(-1);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [stageProgress, setStageProgress] = useState(0);

  // Load the 10 target wells
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, county, state, formation, production_oil, production_gas, water_cut, total_depth, well_type, status, latitude, longitude")
        .in("api_number", TARGET_API_NUMBERS)
        .order("production_oil", { ascending: false });
      if (data) {
        setWells(data);
        const initial = new Map<string, WellAnalysis>();
        data.forEach((w) => initial.set(w.id, { well: w, stages: new Map(), status: "pending" }));
        setAnalyses(initial);
      }
      setLoading(false);
    };
    load();
  }, []);

  const analyzeStage = async (well: WellRecord, stageKey: string): Promise<StageResult> => {
    const { data, error } = await supabase.functions.invoke("analyze-well-stage", {
      body: { well, stageKey },
    });
    if (error) throw new Error(error.message || "AI analysis failed");
    if (data?.error) throw new Error(data.error);
    return data as StageResult;
  };

  const runBatchAnalysis = useCallback(async () => {
    if (wells.length === 0) return;
    setIsRunning(true);

    for (let wi = 0; wi < wells.length; wi++) {
      const well = wells[wi];
      setCurrentWellIdx(wi);

      setAnalyses((prev) => {
        const next = new Map(prev);
        const a = next.get(well.id)!;
        next.set(well.id, { ...a, status: "running", stages: new Map() });
        return next;
      });

      let failed = false;
      for (let si = 0; si < STAGES.length; si++) {
        setCurrentStageIdx(si);
        setStageProgress(10);

        const progressInterval = setInterval(() => {
          setStageProgress((prev) => Math.min(prev + 2, 90));
        }, 300);

        try {
          const result = await analyzeStage(well, STAGES[si].key);
          clearInterval(progressInterval);
          setStageProgress(100);
          await new Promise((r) => setTimeout(r, 200));

          setAnalyses((prev) => {
            const next = new Map(prev);
            const a = next.get(well.id)!;
            const stages = new Map(a.stages);
            stages.set(STAGES[si].key, result);
            next.set(well.id, { ...a, stages });
            return next;
          });
        } catch (err: any) {
          clearInterval(progressInterval);
          console.error(`Well ${well.well_name} Stage ${STAGES[si].key} failed:`, err);

          if (err.message?.includes("Rate limit")) {
            toast.error("Rate limit — pausing 10 seconds...");
            await new Promise((r) => setTimeout(r, 10000));
            si--; // retry this stage
            continue;
          }

          setAnalyses((prev) => {
            const next = new Map(prev);
            const a = next.get(well.id)!;
            next.set(well.id, { ...a, status: "error", error: err.message });
            return next;
          });
          failed = true;
          break;
        }
      }

      if (!failed) {
        setAnalyses((prev) => {
          const next = new Map(prev);
          const a = next.get(well.id)!;
          next.set(well.id, { ...a, status: "done" });
          return next;
        });
      }
    }

    setIsRunning(false);
    setCurrentWellIdx(-1);
    setCurrentStageIdx(-1);
    toast.success("Batch analysis complete!");
  }, [wells]);

  const reset = () => {
    setCurrentWellIdx(-1);
    setCurrentStageIdx(-1);
    setStageProgress(0);
    setIsRunning(false);
    const initial = new Map<string, WellAnalysis>();
    wells.forEach((w) => initial.set(w.id, { well: w, stages: new Map(), status: "pending" }));
    setAnalyses(initial);
  };

  const completedWells = Array.from(analyses.values()).filter((a) => a.status === "done").length;
  const overallProgress = wells.length > 0
    ? ((completedWells + (currentWellIdx >= 0 && currentWellIdx < wells.length
        ? (currentStageIdx + stageProgress / 100) / STAGES.length
        : 0)) / wells.length) * 100
    : 0;

  const handleExportCSV = () => {
    const rows: string[][] = [["Well Name", "API #", "County", "Operator", "Oil (bbl/d)", "Water Cut (%)", "Stage", "Metric", "Value", "Verdict"]];
    analyses.forEach((a) => {
      STAGES.forEach((stage) => {
        const result = a.stages.get(stage.key);
        if (!result) return;
        result.metrics.forEach((m, i) => {
          rows.push([
            i === 0 ? (a.well.well_name || "") : "",
            i === 0 ? (a.well.api_number || "") : "",
            i === 0 ? (a.well.county || "") : "",
            i === 0 ? (a.well.operator || "") : "",
            i === 0 ? String(a.well.production_oil ?? "") : "",
            i === 0 ? String(a.well.water_cut ?? "") : "",
            i === 0 ? stage.label : "",
            m.label,
            m.value,
            i === 0 ? result.verdict : "",
          ]);
        });
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oklahoma-pilot-10wells-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Extract SPT score from EOR stage
  const getSptScore = (a: WellAnalysis): string => {
    const eor = a.stages.get("eor");
    if (!eor) return "—";
    const m = eor.metrics.find((m) => m.label.toLowerCase().includes("score"));
    return m?.value || "—";
  };

  const getVerdict = (a: WellAnalysis): string => {
    const eor = a.stages.get("eor");
    return eor?.verdict || "—";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🛢️</span>
              <h1 className="text-3xl font-bold">Oklahoma Pilot — 10 Wells</h1>
              <Badge className="bg-success/20 text-success border-success/30">LIVE</Badge>
            </div>
            <p className="text-muted-foreground">
              Full 8-stage AI analysis pipeline running on 10 real Oklahoma wells
            </p>
          </div>
          <div className="flex gap-2">
            {completedWells > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button onClick={runBatchAnalysis} disabled={isRunning || wells.length === 0}>
              {isRunning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing {currentWellIdx + 1}/{wells.length}...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" />Run Full Analysis (10 wells)</>
              )}
            </Button>
            <Button variant="outline" onClick={reset} disabled={isRunning}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      {(isRunning || completedWells > 0) && (
        <Card className="mb-6 glass-card border-primary/30">
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall: {completedWells}/{wells.length} wells completed</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            {isRunning && currentWellIdx >= 0 && currentWellIdx < wells.length && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing: <span className="font-medium text-foreground">{wells[currentWellIdx]?.well_name}</span>
                — Stage {currentStageIdx + 1}/{STAGES.length}: {STAGES[currentStageIdx]?.label}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
          <p>Loading 10 target wells...</p>
        </div>
      )}

      {/* Wells Summary Grid */}
      {!loading && wells.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Stats */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pilot Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-2xl font-bold">{wells.length}</p>
                  <p className="text-xs text-muted-foreground">Wells</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg text-center">
                  <p className="text-2xl font-bold">{new Set(wells.map(w => w.county)).size}</p>
                  <p className="text-xs text-muted-foreground">Counties</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg text-center">
                  <p className="text-2xl font-bold">{wells.filter(w => (w.water_cut ?? 0) > 70).length}</p>
                  <p className="text-xs text-muted-foreground">High Water Cut</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-2xl font-bold">{(wells.reduce((s, w) => s + (w.production_oil ?? 0), 0)).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Total bbl/d</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* County distribution */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By County</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(
                wells.reduce<Record<string, number>>((acc, w) => {
                  const c = w.county || "Unknown";
                  acc[c] = (acc[c] || 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).map(([county, count]) => (
                <div key={county} className="flex justify-between items-center py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-primary" />
                    {county}
                  </span>
                  <Badge variant="outline">{count} wells</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wells Table with Analysis Status */}
      {!loading && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Well-by-Well Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {wells.map((well, idx) => {
                  const analysis = analyses.get(well.id);
                  const isActive = idx === currentWellIdx && isRunning;
                  const isDone = analysis?.status === "done";
                  const isError = analysis?.status === "error";
                  const completedStages = analysis?.stages.size || 0;

                  return (
                    <Card
                      key={well.id}
                      className={`transition-all duration-300 ${
                        isActive ? "ring-2 ring-primary shadow-lg" : isDone ? "border-success/30" : isError ? "border-destructive/30" : ""
                      }`}
                    >
                      <CardContent className="pt-4">
                        {/* Well header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isDone ? "bg-success/20 text-success" : isActive ? "bg-primary/20 text-primary" : isError ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                            }`}>
                              {isDone ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : isError ? <AlertTriangle className="h-4 w-4" /> : idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{well.well_name || well.api_number}</p>
                              <p className="text-xs text-muted-foreground">{well.operator} · {well.county}, OK</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span><span className="text-muted-foreground">Oil:</span> <span className="font-medium">{well.production_oil?.toFixed(1)} bbl/d</span></span>
                            <span className={`font-medium ${(well.water_cut ?? 0) > 70 ? "text-destructive" : "text-success"}`}>
                              WC: {well.water_cut?.toFixed(1)}%
                            </span>
                            {isDone && (
                              <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                                SPT: {getSptScore(analysis!)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Stage progress bar */}
                        {(isActive || isDone || completedStages > 0) && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {STAGES.map((stage, si) => {
                                const hasResult = analysis?.stages.has(stage.key);
                                const isCurrent = isActive && si === currentStageIdx;
                                return (
                                  <div
                                    key={stage.key}
                                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                                      hasResult ? "bg-success" : isCurrent ? "bg-primary animate-pulse" : "bg-muted"
                                    }`}
                                    title={stage.label}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {completedStages}/{STAGES.length} stages
                              {isActive && ` — ${STAGES[currentStageIdx]?.label}`}
                            </p>
                          </div>
                        )}

                        {/* Verdict when done */}
                        {isDone && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                            <p className="font-medium">{getVerdict(analysis!)}</p>
                          </div>
                        )}

                        {/* Error */}
                        {isError && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                            Error: {analysis?.error}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Combined Results Summary */}
      {completedWells >= wells.length && wells.length > 0 && (
        <Card className="mt-6 border-success/30 glass-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Oklahoma Pilot — Combined Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-success">{completedWells}</p>
                <p className="text-xs text-muted-foreground">Wells Analyzed</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">{completedWells * STAGES.length}</p>
                <p className="text-xs text-muted-foreground">Total Stages</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-warning">
                  {wells.filter(w => (w.water_cut ?? 0) > 70).length}
                </p>
                <p className="text-xs text-muted-foreground">EOR Candidates</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-success">
                  {wells.filter(w => (w.water_cut ?? 0) < 30).length}
                </p>
                <p className="text-xs text-muted-foreground">Stable Wells</p>
              </div>
            </div>

            <Separator />

            {/* Per-well EOR summary */}
            <div>
              <h4 className="text-sm font-semibold mb-3">EOR Recommendations</h4>
              <div className="space-y-2">
                {wells.map((well) => {
                  const a = analyses.get(well.id);
                  if (!a || a.status !== "done") return null;
                  return (
                    <div key={well.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="font-medium">{well.well_name}</span>
                        <span className="text-xs text-muted-foreground">{well.county}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs">SPT: <span className="font-bold">{getSptScore(a)}</span></span>
                        <Badge variant="outline" className="text-[10px]">
                          {(well.water_cut ?? 0) > 70 ? "⚠️ High WC" : "✅ Stable"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
              <p>Generated by AI Smart Well (SGOM Platform) — Powered by SPT Technology (Patent US 8,863,823)</p>
              <p>Oklahoma Pilot Analysis — {new Date().toLocaleDateString()} — © {new Date().getFullYear()} Maxxwell Production</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OklahomaPilot;
