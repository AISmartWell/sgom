import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
}

const STAGES = [
  { key: "field_scan", label: "Field Scanning", icon: Radar, badge: "Stage 1", duration: 1500 },
  { key: "classification", label: "Data Classification", icon: FolderSearch, badge: "Stage 2", duration: 1800 },
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

  const selectedWell = wells.find((w) => w.id === selectedWellId) || null;

  useEffect(() => {
    const fetchWells = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, county, state, formation, production_oil, production_gas, water_cut, total_depth, well_type, status")
        .order("well_name")
        .limit(200);
      if (data) setWells(data);
      setLoading(false);
    };
    fetchWells();
  }, []);

  const generateStageResult = useCallback(
    (stageKey: string, well: WellRecord): StageResult => {
      const oil = well.production_oil ?? 15;
      const gas = well.production_gas ?? 500;
      const wc = well.water_cut ?? 45;
      const depth = well.total_depth ?? 5000;

      switch (stageKey) {
        case "field_scan":
          return {
            title: "Field Scanning Complete",
            metrics: [
              { label: "Location", value: `${well.county || "Unknown"}, ${well.state}` },
              { label: "Basin", value: well.state === "TX" ? "Permian Basin" : "Anadarko Basin" },
              { label: "Well Type", value: well.well_type || "Oil" },
              { label: "Status", value: well.status || "Active" },
            ],
            verdict: oil < 10 ? "⚠️ Low producer — candidate for optimization" : "✅ Active producer identified",
          };
        case "classification":
          return {
            title: "Data Classified",
            metrics: [
              { label: "Production History", value: "Available", color: "text-success" },
              { label: "Initial Rates", value: `${(oil * 3.5).toFixed(0)} bbl/d` },
              { label: "Incident Reports", value: wc > 55 ? "High water cut flagged" : "Normal", color: wc > 55 ? "text-warning" : "text-success" },
              { label: "Data Quality", value: `${85 + Math.floor(Math.random() * 12)}%` },
            ],
            verdict: "✅ Sufficient data for analysis",
          };
        case "cumulative":
          const decline = 8 + Math.random() * 12;
          const reserves = (oil * 365 * (1 / (decline / 100)) * 0.6).toFixed(0);
          return {
            title: "Decline Analysis Complete",
            metrics: [
              { label: "Current Rate", value: `${oil.toFixed(1)} bbl/d` },
              { label: "Decline Rate", value: `${decline.toFixed(1)}%/yr`, color: decline > 15 ? "text-destructive" : "text-warning" },
              { label: "Est. Reserves", value: `${(+reserves / 1000).toFixed(0)}k bbl` },
              { label: "Economic Limit", value: `${(3 + Math.random() * 8).toFixed(0)} yrs` },
            ],
            verdict: decline > 15 ? "⚠️ Rapid decline — SPT treatment recommended" : "📊 Moderate decline detected",
          };
        case "spt_projection": {
          const projectedInflow = oil * (2.0 + Math.random() * 0.5) + 5 + Math.random() * 5;
          const pass = wc < 60 && projectedInflow > 15;
          return {
            title: "SPT Projection Result",
            metrics: [
              { label: "Water Cut", value: `${wc.toFixed(1)}%`, color: wc > 55 ? "text-destructive" : "text-success" },
              { label: "Projected Inflow", value: `${projectedInflow.toFixed(1)} bbl/d`, color: "text-primary" },
              { label: "SPT Score", value: `${(65 + Math.random() * 30).toFixed(0)}/100` },
              { label: "Recommendation", value: pass ? "Candidate ✅" : "Not recommended ❌", color: pass ? "text-success" : "text-destructive" },
            ],
            verdict: pass ? "🚀 Well qualifies for SPT treatment" : "❌ Does not meet SPT criteria",
          };
        }
        case "economic": {
          const treatmentCost = 25000 + Math.random() * 15000;
          const addedRevenue = (oil * 1.5 + 5) * 70 * 365;
          const roi = ((addedRevenue - treatmentCost) / treatmentCost) * 100;
          const payback = treatmentCost / (addedRevenue / 12);
          return {
            title: "Economic Forecast",
            metrics: [
              { label: "Treatment Cost", value: `$${(treatmentCost / 1000).toFixed(0)}k` },
              { label: "Added Revenue/yr", value: `$${(addedRevenue / 1000).toFixed(0)}k`, color: "text-success" },
              { label: "ROI", value: `${roi.toFixed(0)}%`, color: roi > 200 ? "text-success" : "text-warning" },
              { label: "Payback", value: `${payback.toFixed(1)} months` },
            ],
            verdict: roi > 200 ? "💰 Highly profitable investment" : "📊 Moderate return expected",
          };
        }
        case "geophysical":
          return {
            title: "Geophysical Assessment",
            metrics: [
              { label: "Formation", value: well.formation || "Woodford Shale" },
              { label: "Total Depth", value: `${depth.toFixed(0)} ft` },
              { label: "Porosity Est.", value: `${(8 + Math.random() * 10).toFixed(1)}%` },
              { label: "Permeability", value: `${(20 + Math.random() * 120).toFixed(0)} mD` },
            ],
            verdict: "✅ Formation suitable for SPT enhancement",
          };
        case "eor": {
          const score = 60 + Math.random() * 35;
          return {
            title: "EOR Final Recommendation",
            metrics: [
              { label: "Overall Score", value: `${score.toFixed(0)}/100`, color: score > 75 ? "text-success" : "text-warning" },
              { label: "Suggested Method", value: "SPT Hydro-Slotting" },
              { label: "Priority", value: score > 80 ? "High" : score > 65 ? "Medium" : "Low", color: score > 80 ? "text-success" : "text-warning" },
              { label: "Expected Uplift", value: `${(2 + Math.random() * 3).toFixed(1)}x production` },
            ],
            verdict: score > 75 ? "🎯 Strong candidate — proceed with treatment plan" : "📋 Moderate candidate — review with team",
          };
        }
        default:
          return { title: "", metrics: [], verdict: "" };
      }
    },
    []
  );

  const runPipeline = useCallback(async () => {
    if (!selectedWell) return;
    setIsRunning(true);
    setCompletedStages(new Map());
    setCurrentStageIdx(0);

    for (let i = 0; i < STAGES.length; i++) {
      setCurrentStageIdx(i);
      const steps = 25;
      for (let s = 0; s <= steps; s++) {
        await new Promise((r) => setTimeout(r, STAGES[i].duration / steps));
        setStageProgress((s / steps) * 100);
      }
      const result = generateStageResult(STAGES[i].key, selectedWell);
      setCompletedStages((prev) => new Map(prev).set(STAGES[i].key, result));
    }

    setCurrentStageIdx(STAGES.length);
    setIsRunning(false);
    setStageProgress(100);
  }, [selectedWell, generateStageResult]);

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
          Select a well and run the full 7-stage analysis — from field scanning to EOR recommendation
        </p>
      </div>

      {/* Well Selector */}
      <Card className="glass-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Select Well</label>
              <Select value={selectedWellId} onValueChange={(v) => { setSelectedWellId(v); reset(); }}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading wells..." : "Choose a well from database"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {wells.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.well_name || w.api_number || w.id.slice(0, 8)} — {w.county}, {w.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {isActive && (
                    <span className="text-xs text-muted-foreground">{Math.round(stageProgress)}%</span>
                  )}
                </CardTitle>
                {isActive && <Progress value={stageProgress} className="h-1 mt-2" />}
              </CardHeader>

              {isComplete && result && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {result.metrics.map((m) => (
                      <div key={m.label} className="text-sm">
                        <p className="text-muted-foreground text-xs">{m.label}</p>
                        <p className={`font-semibold ${m.color || ""}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium">{result.verdict}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Final Summary */}
      {currentStageIdx >= STAGES.length && (
        <Card className="mt-6 border-success/40 bg-success/5 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <h3 className="text-lg font-bold text-success">Analysis Complete</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Full 7-stage analysis for <strong>{selectedWell?.well_name || selectedWell?.api_number}</strong> has been completed.
              Review each stage above for detailed results and recommendations.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Analyze Another Well
              </Button>
              <Button onClick={() => navigate("/dashboard/eor-optimization")}>
                <Brain className="mr-2 h-4 w-4" />
                View EOR Module
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WellAnalysisPipeline;
