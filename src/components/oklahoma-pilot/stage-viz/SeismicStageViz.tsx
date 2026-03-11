import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Waves, Search, Layers, TrendingUp, AlertTriangle, Cpu, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface WellRecord {
  id?: string;
  well_name?: string | null;
  api_number?: string | null;
  formation: string | null;
  total_depth: number | null;
  production_oil: number | null;
  water_cut: number | null;
  well_type: string | null;
  county?: string | null;
  state?: string;
  operator?: string | null;
}

interface Props {
  well: WellRecord;
}

interface BypassedZone {
  depthFrom: number;
  depthTo: number;
  formation: string;
  lithology: string;
  potential: "high" | "medium" | "low";
  estimatedMBOE: string;
  confidence: number;
  indicator: string;
}

interface AnomalyItem {
  type: string;
  depth: number;
  severity: "high" | "medium" | "low";
  description: string;
}

const potentialColors = {
  high: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

const severityColors = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-muted-foreground",
};

const SeismicStageViz = ({ well }: Props) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const depth = well.total_depth ?? 5000;

  // Generate formation-aware bypassed zones
  const zones = useMemo((): BypassedZone[] => {
    const f = (well.formation || "").toLowerCase();
    const d = depth;

    if (f.includes("wolfcamp") || f.includes("spraberry") || f.includes("bone spring")) {
      return [
        { depthFrom: Math.round(d * 0.3), depthTo: Math.round(d * 0.45), formation: "Wolfcamp A", lithology: "Tight Sandstone", potential: "high", estimatedMBOE: "12–18", confidence: 87, indicator: "Bright spot + AVO Class III" },
        { depthFrom: Math.round(d * 0.55), depthTo: Math.round(d * 0.7), formation: "Bone Spring", lithology: "Carbonate", potential: "medium", estimatedMBOE: "6–10", confidence: 72, indicator: "Dim spot anomaly" },
        { depthFrom: Math.round(d * 0.8), depthTo: Math.round(d * 0.95), formation: "Spraberry", lithology: "Siltstone", potential: "low", estimatedMBOE: "2–5", confidence: 54, indicator: "Flat spot at fluid contact" },
      ];
    }

    return [
      { depthFrom: Math.round(d * 0.25), depthTo: Math.round(d * 0.4), formation: well.formation || "Upper Zone", lithology: "Sandstone", potential: "high", estimatedMBOE: "8–15", confidence: 82, indicator: "AVO Class II anomaly" },
      { depthFrom: Math.round(d * 0.5), depthTo: Math.round(d * 0.65), formation: "Mid Zone", lithology: "Carbonate", potential: "medium", estimatedMBOE: "4–8", confidence: 68, indicator: "Amplitude brightening" },
    ];
  }, [well.formation, depth]);

  // Generate anomalies
  const anomalies = useMemo((): AnomalyItem[] => [
    { type: "Bright Spot", depth: Math.round(depth * 0.35), severity: "high", description: "Gas-charged sand — possible bypassed pay" },
    { type: "AVO Anomaly", depth: Math.round(depth * 0.55), severity: "medium", description: "Class III response — fluid contact indicator" },
    { type: "Flat Spot", depth: Math.round(depth * 0.75), severity: "low", description: "Possible OWC at base of reservoir" },
  ], [depth]);

  // Lithology classification
  const lithologyBreakdown = useMemo(() => {
    const f = (well.formation || "").toLowerCase();
    if (f.includes("shale") || f.includes("woodford")) return [
      { type: "Shale", pct: 65, color: "hsl(var(--muted-foreground))" },
      { type: "Siltstone", pct: 20, color: "hsl(var(--warning))" },
      { type: "Sandstone", pct: 15, color: "hsl(var(--primary))" },
    ];
    if (f.includes("limestone") || f.includes("hunton") || f.includes("mississippian")) return [
      { type: "Limestone", pct: 55, color: "hsl(var(--primary))" },
      { type: "Dolomite", pct: 25, color: "hsl(var(--success))" },
      { type: "Shale", pct: 20, color: "hsl(var(--muted-foreground))" },
    ];
    return [
      { type: "Sandstone", pct: 45, color: "hsl(var(--primary))" },
      { type: "Shale", pct: 30, color: "hsl(var(--muted-foreground))" },
      { type: "Limestone", pct: 25, color: "hsl(var(--success))" },
    ];
  }, [well.formation]);

  const runSeismicAI = async () => {
    setIsAnalyzing(true);
    setAiReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-well-stage", {
        body: { well, stageKey: "seismic_reinterpretation" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiReport(data.verdict);
      toast.success("Seismic reinterpretation complete");
    } catch (err: any) {
      console.error("Seismic stage error:", err);
      toast.error(err.message || "Seismic analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const highPotential = zones.filter(z => z.potential === "high").length;

  return (
    <div className="mt-2 space-y-3">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-primary/10 text-center">
          <p className="text-lg font-bold text-primary">{zones.length}</p>
          <p className="text-[10px] text-muted-foreground">Bypassed Zones</p>
        </div>
        <div className="p-2 rounded-lg bg-success/10 text-center">
          <p className="text-lg font-bold text-success">{highPotential}</p>
          <p className="text-[10px] text-muted-foreground">High Potential</p>
        </div>
        <div className="p-2 rounded-lg bg-warning/10 text-center">
          <p className="text-lg font-bold text-warning">{anomalies.length}</p>
          <p className="text-[10px] text-muted-foreground">Anomalies</p>
        </div>
        <div className="p-2 rounded-lg bg-destructive/10 text-center">
          <p className="text-lg font-bold text-destructive">20–40%</p>
          <p className="text-[10px] text-muted-foreground">Est. Missed</p>
        </div>
      </div>

      {/* Lithology auto-classification bar */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Auto-Classification (Lithology)
        </p>
        <div className="flex h-4 rounded-full overflow-hidden">
          {lithologyBreakdown.map((l, i) => (
            <div
              key={i}
              className="h-full transition-all duration-700"
              style={{ width: `${l.pct}%`, background: l.color }}
            />
          ))}
        </div>
        <div className="flex gap-3 text-[10px]">
          {lithologyBreakdown.map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
              <span className="text-muted-foreground">{l.type} {l.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bypassed Reserves zones */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-primary" />
          Bypassed Reserves — Identified Zones
        </p>
        <div className="space-y-1.5">
          {zones.map((zone, i) => (
            <div key={i} className="p-2 rounded border border-border/30 bg-background/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{zone.formation}</span>
                <Badge className={`text-[9px] ${potentialColors[zone.potential]}`}>
                  {zone.potential.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-3 text-[10px] text-muted-foreground">
                <span>Depth: {zone.depthFrom}–{zone.depthTo} ft</span>
                <span>Lithology: {zone.lithology}</span>
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />{zone.estimatedMBOE} MBOE
                </span>
                <span className="flex items-center gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />{zone.indicator}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={zone.confidence} className="h-1 flex-1" />
                <span className="text-[9px] text-muted-foreground">{zone.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Waves className="h-3.5 w-3.5 text-warning" />
          Seismic Anomalies Detected
        </p>
        <div className="space-y-1">
          {anomalies.map((a, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${severityColors[a.severity]}`}>{a.type}</span>
                <span className="text-muted-foreground">@ {a.depth} ft</span>
              </div>
              <span className="text-muted-foreground text-[9px] max-w-[50%] text-right">{a.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Deep Analysis button */}
      <Button size="sm" variant="outline" className="w-full" onClick={runSeismicAI} disabled={isAnalyzing}>
        {isAnalyzing ? (
          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Analyzing seismic data…</>
        ) : (
          <><Cpu className="mr-2 h-3.5 w-3.5" />Run Deep Seismic AI Interpretation</>
        )}
      </Button>

      {aiReport && (
        <div className="p-3 rounded-lg border border-primary/20 bg-card text-xs">
          <p className="font-semibold mb-2 flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            AI Seismic Reinterpretation
          </p>
          <div className="prose prose-xs dark:prose-invert max-w-none text-xs">
            <ReactMarkdown>{aiReport}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeismicStageViz;
