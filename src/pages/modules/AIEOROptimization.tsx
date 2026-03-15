import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Radar,
  FolderSearch,
  Microscope,
  TrendingDown,
  Waves,
  TrendingUp,
  DollarSign,
  Activity,
  Brain,
  Droplets,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

// Stage visualizations
import GeophysicalStageViz from "@/components/oklahoma-pilot/stage-viz/GeophysicalStageViz";
import CumulativeStageViz from "@/components/oklahoma-pilot/stage-viz/CumulativeStageViz";
import SeismicStageViz from "@/components/oklahoma-pilot/stage-viz/SeismicStageViz";
import CoreAnalysisStageViz from "@/components/oklahoma-pilot/stage-viz/CoreAnalysisStageViz";
import ClassificationStageViz from "@/components/oklahoma-pilot/stage-viz/ClassificationStageViz";
import EconomicStageViz from "@/components/oklahoma-pilot/stage-viz/EconomicStageViz";
import SPTProjectionStageViz from "@/components/oklahoma-pilot/stage-viz/SPTProjectionStageViz";

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

const STAGES = [
  { key: "field_scan", label: "Field Scanning", icon: Radar, badge: "Stage 1", route: "/dashboard/field-scanning", color: "text-blue-400" },
  { key: "classification", label: "Data Classification", icon: FolderSearch, badge: "Stage 2", route: "/dashboard/data-classification", color: "text-indigo-400" },
  { key: "core_analysis", label: "Core Analysis (CV)", icon: Microscope, badge: "Stage 3", route: "/dashboard/core-analysis", color: "text-violet-400" },
  { key: "cumulative", label: "Cumulative Analysis", icon: TrendingDown, badge: "Stage 4", route: "/dashboard/cumulative-analysis", color: "text-amber-400" },
  { key: "seismic_reinterpretation", label: "Seismic Reinterpretation", icon: Waves, badge: "Stage 5", route: "/dashboard/geological-analysis", color: "text-cyan-400" },
  { key: "spt_projection", label: "SPT Projection", icon: TrendingUp, badge: "Stage 6", route: "/dashboard/spt-projection", color: "text-emerald-400" },
  { key: "economic", label: "Economic Analysis", icon: DollarSign, badge: "Stage 7", route: "/dashboard/economic-analysis", color: "text-yellow-400" },
  { key: "geophysical", label: "Geophysical Expertise", icon: Activity, badge: "Stage 8", route: "/dashboard/geophysical", color: "text-rose-400" },
  { key: "eor", label: "EOR Recommendation", icon: Brain, badge: "Stage 9", route: "/dashboard/eor-optimization", color: "text-purple-400" },
];

const AIEOROptimization = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellRecord[]>([]);
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("field_scan");

  const selectedWell = useMemo(() => wells.find((w) => w.id === selectedWellId), [wells, selectedWellId]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, operator, county, state, formation, production_oil, production_gas, water_cut, total_depth, well_type, status, latitude, longitude")
        .order("well_name")
        .limit(100);
      if (data && data.length > 0) {
        setWells(data);
        setSelectedWellId(data[0].id);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const currentStage = STAGES.find((s) => s.key === activeStage);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-1">
          <Droplets className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI EOR SPT Optimization</h1>
        </div>
        <p className="text-muted-foreground">
          Integrated 9-stage pipeline — from field scanning to EOR recommendation with inline economic controls
        </p>
      </div>

      {/* Well Selector */}
      <Card className="glass-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Well</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedWellId}
                onChange={(e) => setSelectedWellId(e.target.value)}
                disabled={loading}
              >
                {loading && <option>Loading wells...</option>}
                {wells.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.well_name || w.api_number || w.id.slice(0, 8)} — {w.county}, {w.state}
                  </option>
                ))}
              </select>
            </div>
            {selectedWell && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Oil</span><br /><span className="font-semibold">{selectedWell.production_oil?.toFixed(1) ?? "—"} bbl/d</span></div>
                <div><span className="text-muted-foreground text-xs">Gas</span><br /><span className="font-semibold">{selectedWell.production_gas?.toFixed(0) ?? "—"} MCF/d</span></div>
                <div><span className="text-muted-foreground text-xs">Water Cut</span><br /><span className="font-semibold">{selectedWell.water_cut?.toFixed(1) ?? "—"}%</span></div>
                <div><span className="text-muted-foreground text-xs">Formation</span><br /><span className="font-semibold">{selectedWell.formation || "—"}</span></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage Navigation */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveStage(stage.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                isActive
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] leading-tight font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {stage.label}
              </span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {stage.badge}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Stage Content */}
      {selectedWell && currentStage && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10`}>
                  <currentStage.icon className={`h-5 w-5 ${currentStage.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{currentStage.label}</span>
                    <Badge variant="outline">{currentStage.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">
                    {getStageDescription(currentStage.key)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(currentStage.route)}
                className="gap-1"
              >
                Open Module
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StageContent stageKey={activeStage} well={selectedWell} />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/well-analysis")} className="gap-1.5">
          <Droplets className="h-4 w-4" />
          Run Full Pipeline
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/oklahoma-pilot")} className="gap-1.5">
          <Radar className="h-4 w-4" />
          Well Screening Pilot
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/analysis-reports")} className="gap-1.5">
          Analysis Reports
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

function StageContent({ stageKey, well }: { stageKey: string; well: WellRecord }) {
  switch (stageKey) {
    case "field_scan":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Field scanning identifies candidate wells by analyzing regional production data, geological context, and operational history.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Location" value={`${well.county || "—"}, ${well.state}`} />
            <MetricCard label="Operator" value={well.operator || "—"} />
            <MetricCard label="Total Depth" value={well.total_depth ? `${well.total_depth.toLocaleString()} ft` : "—"} />
            <MetricCard label="Well Type" value={well.well_type || "—"} />
          </div>
        </div>
      );
    case "classification":
      return <ClassificationStageViz well={well} />;
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
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Final EOR recommendation based on all preceding 8 stages. SPT Technology (Patent US 8,863,823) is the primary method for production enhancement.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label="Current Oil" value={`${well.production_oil?.toFixed(1) ?? "—"} bbl/d`} />
            <MetricCard label="Water Cut" value={`${well.water_cut?.toFixed(1) ?? "—"}%`} />
            <MetricCard label="Formation" value={well.formation || "—"} />
            <MetricCard
              label="SPT Candidate"
              value={(well.water_cut ?? 0) < 60 ? "✅ Yes" : "⚠️ High WC"}
              highlight={(well.water_cut ?? 0) < 60}
            />
            <MetricCard label="Expected Gain" value={getExpectedGain(well.water_cut)} />
            <MetricCard label="Treatment Cost" value="$85,000" />
          </div>
        </div>
      );
    default:
      return <p className="text-sm text-muted-foreground">Select a stage to view details.</p>;
  }
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/30"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm mt-0.5">{value}</p>
    </div>
  );
}

function getExpectedGain(waterCut: number | null): string {
  const wc = waterCut ?? 0;
  if (wc < 30) return "+7 bbl/d";
  if (wc < 50) return "+5 bbl/d";
  if (wc < 70) return "+3 bbl/d";
  return "+1.5 bbl/d";
}

function getStageDescription(key: string): string {
  const descriptions: Record<string, string> = {
    field_scan: "Regional well identification and data collection",
    classification: "Data quality assessment and categorization",
    core_analysis: "AI computer vision analysis of core samples",
    cumulative: "Decline curve analysis with Economic Limit & q vs Np",
    seismic_reinterpretation: "Seismic data reinterpretation for bypassed reserves",
    spt_projection: "SPT treatment production gain projection",
    economic: "ROI calculation with Arps decline model",
    geophysical: "Well log interpretation and petrophysical analysis",
    eor: "Final EOR recommendation and treatment plan",
  };
  return descriptions[key] || "";
}

export default AIEOROptimization;
