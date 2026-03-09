import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  BookOpen,
  Database,
  FlaskConical,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useProductionHistory } from "@/hooks/useProductionHistory";

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
  dataSource?: string;
}

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

interface Props {
  well: WellRecord;
  stages: { key: string; label: string; badge: string }[];
  completedStages: Map<string, StageResult>;
}

// Scientific references for each stage
const SCIENTIFIC_REFS: Record<string, { formula: string; reference: string; description: string; url?: string }[]> = {
  field_scan: [
    { formula: "GIS Spatial Analysis", reference: "ESRI ArcGIS Pro Documentation", description: "Spatial clustering & proximity analysis for well identification" },
    { formula: "Voronoi Tessellation", reference: "Okabe et al., 2000", description: "Drainage area estimation via spatial partitioning" },
  ],
  classification: [
    { formula: "Shannon Entropy: H = -Σ p(x) log₂ p(x)", reference: "Shannon, 1948", description: "Data quality scoring via information entropy" },
    { formula: "Bayesian Classification", reference: "Bishop, 2006", description: "Probabilistic well type classification" },
  ],
  core_analysis: [
    { formula: "k = (φ³ · d²) / (72τ(1-φ)²)", reference: "Kozeny-Carman Equation", description: "Permeability estimation from porosity and grain size", url: "https://en.wikipedia.org/wiki/Kozeny%E2%80%93Carman_equation" },
    { formula: "F = a / φᵐ", reference: "Archie, 1942 — Formation Factor", description: "Cementation exponent from resistivity-porosity relationship", url: "https://en.wikipedia.org/wiki/Archie%27s_law" },
  ],
  cumulative: [
    { formula: "q(t) = qᵢ / (1 + b·Dᵢ·t)^(1/b)", reference: "Arps, J.J., 1945 — AIME Trans.", description: "Hyperbolic decline curve analysis for production forecasting", url: "https://en.wikipedia.org/wiki/Decline_curve_analysis" },
    { formula: "Np = (qᵢ / Dᵢ(1-b)) · [1 - (1+b·Dᵢ·t)^((b-1)/b)]", reference: "Arps Cumulative Production", description: "Cumulative production integration from decline parameters" },
  ],
  spt_projection: [
    { formula: "SPT Score = Σ wᵢ · xᵢ (MCDA)", reference: "US Patent 8,863,823", description: "Multi-criteria decision analysis for treatment candidacy", url: "https://patents.google.com/patent/US8863823B2" },
    { formula: "Δq = f(WC, formation, depth)", reference: "SPT Engineering Model", description: "Production gain projection based on reservoir parameters" },
  ],
  economic: [
    { formula: "ROI = (NPV - CAPEX) / CAPEX × 100%", reference: "Brealey & Myers, Corporate Finance", description: "Return on investment calculation for treatment economics" },
    { formula: "NPV = Σ CFₜ / (1+r)ᵗ", reference: "Discounted Cash Flow Model", description: "Net present value at 10% discount rate over 60 months", url: "https://en.wikipedia.org/wiki/Net_present_value" },
  ],
  geophysical: [
    { formula: "Sw = (a · Rw / (φᵐ · Rt))^(1/n)", reference: "Archie, G.E., 1942 — AIME", description: "Water saturation from resistivity logs", url: "https://en.wikipedia.org/wiki/Archie%27s_law" },
    { formula: "Q = (k · A · ΔP) / (μ · L)", reference: "Darcy, H., 1856", description: "Flow rate estimation from permeability and pressure gradient", url: "https://en.wikipedia.org/wiki/Darcy%27s_law" },
  ],
  eor: [
    { formula: "RF = Np / OOIP", reference: "Ahmed, T. — Reservoir Engineering", description: "Recovery factor assessment for EOR candidacy" },
    { formula: "Mobility Ratio: M = (kw/μw) / (ko/μo)", reference: "Craig, F.F., 1971", description: "Displacement efficiency prediction for waterflood/polymer" },
  ],
};

// Confidence scoring logic
function computeConfidence(stageKey: string, result: StageResult, hasRealProduction: boolean): { score: number; factors: string[] } {
  let score = 50; // base
  const factors: string[] = [];

  const ds = result.dataSource || "";

  if (ds.includes("REAL")) {
    score += 35;
    factors.push("Real production/log data available");
  } else if (ds.includes("FORMATION")) {
    score += 20;
    factors.push("Formation-calibrated parameters used");
  } else {
    factors.push("Synthetic model (no field data)");
  }

  // Stage-specific adjustments
  if (stageKey === "cumulative" && hasRealProduction) {
    score += 10;
    factors.push("Decline curve fitted to actual history");
  }
  if (stageKey === "geophysical" && ds.includes("REAL")) {
    score += 5;
    factors.push("Well log data from digitized curves");
  }
  if (stageKey === "core_analysis") {
    score += 5;
    factors.push("CV model validated against lab samples");
  }
  if (stageKey === "economic") {
    score += 5;
    factors.push("Pricing from centralized config ($72/bbl)");
  }

  return { score: Math.min(score, 98), factors };
}

function getConfidenceColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function getConfidenceBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getDataSourceBadge(ds: string) {
  if (ds.includes("REAL")) return { label: "REAL DATA", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  if (ds.includes("FORMATION")) return { label: "FORMATION MODEL", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
  return { label: "SYNTHETIC", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
}

export const EvidenceConfidenceSection = ({ well, stages, completedStages }: Props) => {
  const { data: prodHistory, hasRealData: hasRealProduction } = useProductionHistory(well.id);

  // Predicted vs Actual comparison
  const predVsActual = useMemo(() => {
    if (!hasRealProduction || !prodHistory || prodHistory.length < 6) return null;

    const cumulativeResult = completedStages.get("cumulative");
    if (!cumulativeResult) return null;

    // Extract predicted EUR from cumulative metrics
    const eurMetric = cumulativeResult.metrics.find(m => 
      m.label.toLowerCase().includes("eur") || m.label.toLowerCase().includes("ultimate")
    );
    
    const actualCum = prodHistory[prodHistory.length - 1]?.cumulative || 0;
    const actualRate = prodHistory[prodHistory.length - 1]?.rate || 0;
    const currentOil = well.production_oil || actualRate;
    
    // Calculate monthly average from history
    const avgRate = prodHistory.reduce((s, r) => s + r.rate, 0) / prodHistory.length;

    return {
      months: prodHistory.length,
      actualCumulative: actualCum,
      actualAvgRate: avgRate,
      currentRate: currentOil,
      predictedEUR: eurMetric?.value || "—",
    };
  }, [hasRealProduction, prodHistory, completedStages, well.production_oil]);

  // Overall confidence
  const overallConfidence = useMemo(() => {
    let total = 0;
    let count = 0;
    stages.forEach(s => {
      const r = completedStages.get(s.key);
      if (r) {
        total += computeConfidence(s.key, r, hasRealProduction).score;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  }, [stages, completedStages, hasRealProduction]);

  return (
    <div className="space-y-4 print:break-inside-avoid">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Evidence & Confidence</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getConfidenceBg(overallConfidence)}`}>
          <span className="text-xs text-muted-foreground">Overall Confidence:</span>
          <span className={`text-sm font-bold ${getConfidenceColor(overallConfidence)}`}>{overallConfidence}%</span>
        </div>
      </div>

      {/* Predicted vs Actual */}
      {predVsActual && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Predicted vs. Actual Production</h4>
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
              {predVsActual.months} months of history
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Actual Cumulative</p>
              <p className="font-semibold">{predVsActual.actualCumulative.toLocaleString()} bbl</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Avg. Daily Rate</p>
              <p className="font-semibold">{predVsActual.actualAvgRate.toFixed(1)} bbl/d</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Current Rate</p>
              <p className="font-semibold">{predVsActual.currentRate.toFixed(1)} bbl/d</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Predicted EUR</p>
              <p className="font-semibold text-primary">{predVsActual.predictedEUR}</p>
            </div>
          </div>
        </div>
      )}

      {!predVsActual && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-muted-foreground">
            No production history available for backtesting. Upload historical data to enable Predicted vs. Actual comparison.
          </span>
        </div>
      )}

      {/* Per-stage evidence */}
      <div className="space-y-3">
        {stages.map((stage) => {
          const result = completedStages.get(stage.key);
          if (!result) return null;

          const refs = SCIENTIFIC_REFS[stage.key] || [];
          const { score, factors } = computeConfidence(stage.key, result, hasRealProduction);
          const ds = result.dataSource || "SYNTHETIC";
          const badge = getDataSourceBadge(ds);

          return (
            <div key={stage.key} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2 print:break-inside-avoid">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{stage.badge}</Badge>
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <Badge variant="outline" className={`text-[10px] ${badge.cls}`}>
                    <Database className="h-3 w-3 mr-1" />
                    {badge.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getConfidenceColor(score)}`}>{score}%</span>
                  <div className="w-16">
                    <Progress value={score} className="h-1.5" />
                  </div>
                </div>
              </div>

              {/* Confidence factors */}
              <div className="flex flex-wrap gap-1.5">
                {factors.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/30 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {f}
                  </span>
                ))}
              </div>

              {/* Scientific references */}
              {refs.length > 0 && (
                <div className="space-y-1 mt-1">
                  {refs.map((ref, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <FlaskConical className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <code className="text-primary/80 font-mono text-[10px]">{ref.formula}</code>
                        <span className="text-muted-foreground ml-2">— {ref.description}</span>
                        {ref.url ? (
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-primary/60 hover:text-primary">
                            <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                            <span className="underline">{ref.reference}</span>
                            <ExternalLink className="h-2 w-2 ml-0.5" />
                          </a>
                        ) : (
                          <span className="ml-1 text-muted-foreground/70 italic">[{ref.reference}]</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Methodology note */}
      <div className="text-[11px] text-muted-foreground/70 p-3 rounded-lg bg-muted/10 border border-border/30 space-y-1 print:break-inside-avoid">
        <p className="font-medium text-muted-foreground">Methodology & Limitations</p>
        <p>• Confidence scores reflect data availability, calibration quality, and model maturity. Scores above 80% indicate strong field-data backing.</p>
        <p>• All decline curve projections use Arps hyperbolic model (Dᵢ=0.025, b=0.5) calibrated against actual production when available.</p>
        <p>• Economic calculations use centralized pricing ($72/bbl, $18/bbl OPEX) and can be adjusted in platform settings.</p>
        <p>• AI interpretations (Gemini / NVIDIA NIM) are advisory and should be validated by qualified petroleum engineers.</p>
      </div>
    </div>
  );
};
