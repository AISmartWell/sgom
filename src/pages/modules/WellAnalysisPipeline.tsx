import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StageVisualization } from "@/components/pipeline/StageVisualization";
import FieldScanMap from "@/components/pipeline/FieldScanMap";
import GeophysicalStageViz from "@/components/oklahoma-pilot/stage-viz/GeophysicalStageViz";
import CumulativeStageViz from "@/components/oklahoma-pilot/stage-viz/CumulativeStageViz";
import PipelineReport from "@/components/pipeline/PipelineReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  Radar,
  FolderSearch,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Activity,
  Brain,
  ChevronRight,
  Loader2,
  Droplets,
  Microscope,
} from "lucide-react";

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
  dataSource?: string;
}

const STAGES = [
  { key: "field_scan", label: "Field Scanning", icon: Radar, badge: "Stage 1", duration: 1500 },
  { key: "classification", label: "Data Classification", icon: FolderSearch, badge: "Stage 2", duration: 1800 },
  { key: "core_analysis", label: "Core Analysis (CV)", icon: Microscope, badge: "Core", duration: 2000 },
  { key: "cumulative", label: "Cumulative Analysis", icon: TrendingDown, badge: "Stage 3", duration: 2200 },
  { key: "spt_projection", label: "SPT Projection", icon: TrendingUp, badge: "Stage 4", duration: 2000 },
  { key: "economic", label: "Economic Analysis", icon: DollarSign, badge: "Stage 5", duration: 1800 },
  { key: "geophysical", label: "Geophysical Expertise", icon: Activity, badge: "Stage 6", duration: 1500 },
  { key: "eor", label: "EOR Recommendation", icon: Brain, badge: "Final", duration: 1200 },
];

const WellAnalysisPipeline = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellRecord[]>([]);
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [stageProgress, setStageProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState<Map<string, StageResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [wellSearch, setWellSearch] = useState("");
  const [wellPickerOpen, setWellPickerOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<WellRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [cachedSelectedWell, setCachedSelectedWell] = useState<WellRecord | null>(null);

  const selectedWell = wells.find((w) => w.id === selectedWellId) || searchResults.find((w) => w.id === selectedWellId) || cachedSelectedWell;

  // Server-side search when user types
  useEffect(() => {
    if (!wellSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const s = `%${wellSearch.trim()}%`;
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, county, state, formation, production_oil, production_gas, water_cut, total_depth, well_type, status, latitude, longitude")
        .or(`well_name.ilike.${s},api_number.ilike.${s},operator.ilike.${s},county.ilike.${s},formation.ilike.${s}`)
        .order("well_name")
        .limit(50);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [wellSearch]);

  const filteredWells = wellSearch.trim() ? searchResults : wells;

  const selectedLabel = selectedWell
    ? `${selectedWell.well_name || selectedWell.api_number || selectedWell.id.slice(0, 8)} — ${selectedWell.county || ""}, ${selectedWell.state}`
    : "";

  useEffect(() => {
    const fetchWells = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, county, state, formation, production_oil, production_gas, water_cut, total_depth, well_type, status, latitude, longitude")
        .order("well_name")
        .limit(200);
      if (data) setWells(data);
      setLoading(false);
    };
    fetchWells();
  }, []);

  const analyzeStage = useCallback(
    async (stageKey: string, well: WellRecord): Promise<StageResult> => {
      const { data, error } = await supabase.functions.invoke("analyze-well-stage", {
        body: { well, stageKey },
      });

      if (error) {
        console.error(`AI analysis error for ${stageKey}:`, error);
        throw new Error(error.message || "AI analysis failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as StageResult;
    },
    []
  );

  const runPipeline = useCallback(async () => {
    if (!selectedWell) return;
    setIsRunning(true);
    setCompletedStages(new Map());
    setCurrentStageIdx(0);
    setStageProgress(0);

    const allResults: Record<string, StageResult> = {};

    for (let i = 0; i < STAGES.length; i++) {
      setCurrentStageIdx(i);
      setStageProgress(10);

      try {
        const progressInterval = setInterval(() => {
          setStageProgress((prev) => Math.min(prev + 3, 90));
        }, 200);

        const result = await analyzeStage(STAGES[i].key, selectedWell);

        clearInterval(progressInterval);
        setStageProgress(100);

        await new Promise((r) => setTimeout(r, 300));

        allResults[STAGES[i].key] = result;
        setCompletedStages((prev) => new Map(prev).set(STAGES[i].key, result));
      } catch (err: any) {
        console.error(`Stage ${STAGES[i].key} failed:`, err);
        const message = err.message || "Unknown error";
        if (message.includes("Rate limit")) {
          toast.error("Rate limit exceeded. Please wait and try again.");
        } else if (message.includes("Payment required")) {
          toast.error("AI credits exhausted. Please add credits.");
        } else {
          toast.error(`Stage ${STAGES[i].label} failed: ${message}`);
        }
        setIsRunning(false);
        return;
      }
    }

    // Save analysis results to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: uc } = await supabase
          .from("user_companies")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (uc) {
          await supabase.from("well_analyses").insert({
            well_id: selectedWell.id,
            company_id: uc.company_id,
            user_id: user.id,
            stage_results: allResults as any,
            status: "completed",
          });
        }
      }
    } catch (err) {
      console.error("Failed to save analysis:", err);
    }

    setCurrentStageIdx(STAGES.length);
    setIsRunning(false);
    setStageProgress(100);
    toast.success("Analysis complete! Results saved to Analysis Reports.");
  }, [selectedWell, analyzeStage]);

  const reset = () => {
    setCurrentStageIdx(-1);
    setStageProgress(0);
    setCompletedStages(new Map());
    setIsRunning(false);
  };

  const overallProgress =
    currentStageIdx < 0
      ? 0
      : currentStageIdx >= STAGES.length
        ? 100
        : ((currentStageIdx + stageProgress / 100) / STAGES.length) * 100;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <Droplets className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Well Analysis Pipeline</h1>
        </div>
        <p className="text-muted-foreground">
          Select a well and run the full 8-stage analysis — from field scanning to EOR recommendation
        </p>
      </div>

      {/* Field Scan Map */}
      <FieldScanMap
        wells={wells}
        loading={loading}
        onWellSelected={(id) => { setSelectedWellId(id); reset(); }}
      />

      {/* Well Selector */}
      <Card className="glass-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Select Well</label>
              <Popover open={wellPickerOpen} onOpenChange={setWellPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {loading ? "Loading wells..." : selectedLabel || "Search and select a well..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search by name, API #, operator..."
                      value={wellSearch}
                      onChange={(e) => setWellSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="max-h-64">
                    {searching ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
                    ) : filteredWells.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {wellSearch.trim() ? "No wells found" : "Type to search or scroll"}
                      </p>
                    ) : (
                      filteredWells.map((w) => (
                        <button
                          key={w.id}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${w.id === selectedWellId ? "bg-accent font-medium" : ""}`}
                          onClick={() => {
                            setSelectedWellId(w.id);
                            setCachedSelectedWell(w);
                            reset();
                            setWellPickerOpen(false);
                            setWellSearch("");
                          }}
                        >
                          {w.well_name || w.api_number || w.id.slice(0, 8)} — {w.county}, {w.state}
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button onClick={runPipeline} disabled={!selectedWellId || isRunning}>
                {isRunning ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" />Run Full Analysis</>
                )}
              </Button>
              <Button variant="outline" onClick={reset} disabled={currentStageIdx < 0}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Well summary */}
          {selectedWell && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
              <div><span className="text-muted-foreground">Operator:</span> <span className="font-medium">{selectedWell.operator || "—"}</span></div>
              <div><span className="text-muted-foreground">Oil:</span> <span className="font-medium">{selectedWell.production_oil?.toFixed(1) ?? "—"} bbl/d</span></div>
              <div><span className="text-muted-foreground">Gas:</span> <span className="font-medium">{selectedWell.production_gas?.toFixed(0) ?? "—"} MCF/d</span></div>
              <div><span className="text-muted-foreground">Water Cut:</span> <span className="font-medium">{selectedWell.water_cut?.toFixed(1) ?? "—"}%</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Progress */}
      {currentStageIdx >= 0 && (
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Stages Timeline */}
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const isActive = idx === currentStageIdx;
          const isComplete = completedStages.has(stage.key);
          const isPending = idx > currentStageIdx;
          const result = completedStages.get(stage.key);
          const Icon = stage.icon;

          return (
            <Card
              key={stage.key}
              className={`transition-all duration-300 ${
                isActive ? "ring-2 ring-primary shadow-lg" : isComplete ? "border-success/30" : "opacity-60"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                      isComplete ? "bg-success/20 text-success" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="flex-1">{stage.label}</span>
                  <Badge variant={isComplete ? "default" : "outline"} className={isComplete ? "bg-success/20 text-success border-success/30" : ""}>
                    {stage.badge}
                  </Badge>
                  {isComplete && result?.dataSource && (
                    <Badge variant="outline" className={
                      result.dataSource.includes("REAL") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]" :
                      result.dataSource.includes("FORMATION") ? "bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]"
                    }>
                      {result.dataSource}
                    </Badge>
                  )}
                  {isActive && (
                    <span className="text-xs text-muted-foreground">{Math.round(stageProgress)}%</span>
                  )}
                </CardTitle>
                {isActive && <Progress value={stageProgress} className="h-1 mt-2" />}
              </CardHeader>

              {isComplete && result && (
                <CardContent className="pt-0 space-y-3">
                  {/* Mini-visualization */}
                  <StageVisualization stageKey={stage.key} metrics={result.metrics} />
                  
                  {/* Detailed stage visualizations when real data exists */}
                  {stage.key === "geophysical" && selectedWell && (
                    <GeophysicalStageViz well={selectedWell} />
                  )}
                  {stage.key === "cumulative" && selectedWell && (
                    <CumulativeStageViz well={selectedWell} />
                  )}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {result.metrics.map((m) => (
                      <div key={m.label} className="text-sm">
                        <p className="text-muted-foreground text-xs">{m.label}</p>
                        <p className={`font-semibold ${m.color || ""}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{result.verdict}</div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Final Summary */}
      {currentStageIdx >= STAGES.length && selectedWell && (
        <PipelineReport
          well={selectedWell}
          stages={STAGES.map((s) => ({ key: s.key, label: s.label, badge: s.badge }))}
          completedStages={completedStages}
        />
      )}
    </div>
  );
};

export default WellAnalysisPipeline;
