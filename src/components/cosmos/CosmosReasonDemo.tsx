import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Play, ChevronRight, CheckCircle2, AlertTriangle, TrendingUp, Droplets, Layers, DollarSign, Target, Brain, Zap, Radar } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
  ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface WellCandidate {
  id: string;
  name: string;
  api: string;
  formation: string;
  depth: number;
  oil: number;
  waterCut: number;
  gor: number;
  status: string;
  porosity: number;
  permeability: number;
  county: string;
}

const WELLS: WellCandidate[] = [
  { id: "1", name: "Brawner 10-15", api: "42-467-30979", formation: "Rodessa / James Lime", depth: 4915, oil: 8, waterCut: 28, gor: 340, status: "Active", porosity: 20.2, permeability: 48, county: "Van Zandt" },
  { id: "2", name: "Rogers 1-14", api: "35-017-23456", formation: "Mississippian Limestone", depth: 4200, oil: 12, waterCut: 35, gor: 450, status: "Active", porosity: 14.2, permeability: 8.5, county: "Caddo" },
  { id: "3", name: "Thompson 2-5", api: "35-017-24102", formation: "Arbuckle Dolomite", depth: 6200, oil: 22, waterCut: 28, gor: 380, status: "Active", porosity: 11.5, permeability: 15.3, county: "Grady" },
  { id: "4", name: "Harrison 3-8", api: "35-017-23891", formation: "Hunton Dolomite", depth: 5800, oil: 8, waterCut: 52, gor: 620, status: "Active", porosity: 7.8, permeability: 2.1, county: "Caddo" },
  { id: "5", name: "Mitchell 4-11", api: "35-017-24567", formation: "Woodford Shale", depth: 7100, oil: 5, waterCut: 68, gor: 890, status: "Active", porosity: 4.2, permeability: 0.08, county: "Canadian" },
];

interface ReasonStep {
  title: string;
  icon: typeof TrendingUp;
  iconColor: string;
  parameter: string;
  value: string;
  score: number;
  maxScore: number;
  reasoning: string;
  verdict: "positive" | "neutral" | "negative";
}

function computeReasoning(well: WellCandidate): { steps: ReasonStep[]; totalScore: number; rank: number; summary: string } {
  const oilScore = well.oil <= 15 ? 95 : well.oil <= 25 ? 75 : 40;
  const wcScore = well.waterCut >= 20 && well.waterCut <= 60 ? 90 : (well.waterCut >= 10 && well.waterCut <= 70 ? 70 : 35);
  const depthScore = well.depth >= 2000 && well.depth <= 6000 ? 85 : (well.depth < 2000 ? 60 : 50);
  const formationScore = well.formation ? 80 : 40;
  const statusScore = well.status === "Active" ? 90 : 45;
  const gorScore = well.gor > 0 ? 75 : 50;

  const steps: ReasonStep[] = [
    {
      title: "Production Rate Analysis",
      icon: TrendingUp,
      iconColor: "text-green-400",
      parameter: "Oil Production",
      value: `${well.oil} bbl/d`,
      score: oilScore,
      maxScore: 95,
      reasoning: well.oil <= 15
        ? `Current rate of ${well.oil} bbl/d is in the optimal SPT range (≤15 bbl/d). Low-rate wells show 5–10× inflow increase after hydro-slotting, with effects lasting 10–15 years. This well has maximum uplift potential.`
        : well.oil <= 25
        ? `Rate of ${well.oil} bbl/d is moderate. SPT can still deliver significant improvement, but the uplift factor will be lower than for marginal wells. Expected post-SPT rate: ${Math.min(well.oil + 5, 25)} bbl/d.`
        : `High production rate (${well.oil} bbl/d) suggests the well is already performing well. SPT benefit is limited — the formation is already delivering adequate flow. Consider for other optimization strategies.`,
      verdict: well.oil <= 15 ? "positive" : well.oil <= 25 ? "neutral" : "negative",
    },
    {
      title: "Water Cut Assessment",
      icon: Droplets,
      iconColor: "text-blue-400",
      parameter: "Water Cut",
      value: `${well.waterCut}%`,
      score: wcScore,
      maxScore: 90,
      reasoning: well.waterCut >= 20 && well.waterCut <= 60
        ? `Water cut of ${well.waterCut}% falls in the ideal SPT window (20–60%). At this level, hydro-slotting penetration (up to 5 ft) can access bypassed oil zones while the water-oil contact is still favorable. Expected production gain: +${well.waterCut < 30 ? 7 : 5} bbl/d.`
        : well.waterCut < 20
        ? `Very low water cut (${well.waterCut}%) indicates excellent reservoir conditions. SPT will work but the well may already be producing efficiently — diminishing returns from intervention.`
        : `Elevated water cut (${well.waterCut}%) suggests advancing water front. SPT can still create new drainage channels, but expected uplift is reduced to +${well.waterCut <= 70 ? 3 : 1.5} bbl/d. Monitor water encroachment trend before treatment.`,
      verdict: well.waterCut >= 20 && well.waterCut <= 60 ? "positive" : (well.waterCut <= 70 ? "neutral" : "negative"),
    },
    {
      title: "Depth Suitability",
      icon: Layers,
      iconColor: "text-amber-400",
      parameter: "Total Depth",
      value: `${well.depth.toLocaleString()} ft`,
      score: depthScore,
      maxScore: 85,
      reasoning: well.depth >= 2000 && well.depth <= 6000
        ? `Depth of ${well.depth.toLocaleString()} ft is within optimal SPT range (2,000–6,000 ft). Hydro-slotting equipment operates efficiently at this depth, and formation pressure supports effective slot penetration and drainage expansion (13–23 sq.ft/m).`
        : well.depth > 6000
        ? `Deep well (${well.depth.toLocaleString()} ft) exceeds the optimal SPT range. Higher formation pressures and temperatures may affect slot geometry. Equipment deployment costs increase significantly. Consider modified SPT parameters or alternative EOR.`
        : `Shallow depth (${well.depth.toLocaleString()} ft) simplifies SPT deployment but may indicate insufficient formation pressure for sustained post-treatment flow improvement.`,
      verdict: well.depth >= 2000 && well.depth <= 6000 ? "positive" : "negative",
    },
    {
      title: "Formation Compatibility",
      icon: Target,
      iconColor: "text-purple-400",
      parameter: "Formation",
      value: well.formation,
      score: formationScore,
      maxScore: 80,
      reasoning: well.formation.includes("Rodessa") || well.formation.includes("James Lime")
        ? `${well.formation} (φ 15–22%, k 10–60 mD) — High-porosity carbonate with exceptional SPT response potential. Porosity ${well.porosity}% and permeability ${well.permeability} mD indicate excellent reservoir quality. Missed pay interval at 4750–4915 ft with Sw=28% confirms bypassed oil. Hydro-slotting can access 165 ft of untreated net pay.`
        : well.formation.includes("Mississippian")
        ? `${well.formation} (φ 5–18%, k 0.01–50 mD) — Cherty limestone with excellent SPT response. Porosity of ${well.porosity}% and permeability of ${well.permeability} mD confirm treatable matrix. Historical SPT treatments in Mississippian show 2.3× average inflow increase.`
        : well.formation.includes("Hunton")
        ? `${well.formation} (φ 3–12%, k 0.1–100 mD) — Dolomite/limestone with variable SPT response. Porosity ${well.porosity}% is ${well.porosity > 8 ? "above average" : "below average"} for Hunton. Natural fractures may enhance or complicate slot performance.`
        : well.formation.includes("Arbuckle")
        ? `${well.formation} (φ 3–15%, k 0.1–100 mD) — Deep dolomite with known vuggy porosity. Porosity ${well.porosity}% and permeability ${well.permeability} mD suggest good connectivity. SPT hydro-slotting can access additional vuggy zones.`
        : `${well.formation} — Limited SPT treatment history for this formation. Porosity ${well.porosity}% and permeability ${well.permeability} mD require detailed core analysis before recommending SPT treatment.`,
      verdict: well.formation.includes("Rodessa") || well.formation.includes("James Lime") || well.formation.includes("Mississippian") || well.formation.includes("Arbuckle") ? "positive" : well.formation.includes("Hunton") ? "neutral" : "negative",
    },
    {
      title: "Well Status Verification",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      parameter: "Status",
      value: well.status,
      score: statusScore,
      maxScore: 90,
      reasoning: well.status === "Active"
        ? `Well is currently Active — operational infrastructure in place, no workover required prior to SPT treatment. This minimizes mobilization costs and accelerates treatment timeline.`
        : `Well status "${well.status}" requires evaluation. Shut-in or P&A wells need additional workover costs before SPT can be deployed, increasing total investment and time to production uplift.`,
      verdict: well.status === "Active" ? "positive" : "negative",
    },
    {
      title: "Gas-Oil Ratio Analysis",
      icon: Zap,
      iconColor: "text-yellow-400",
      parameter: "GOR",
      value: `${well.gor} scf/bbl`,
      score: gorScore,
      maxScore: 75,
      reasoning: well.gor > 0
        ? `GOR of ${well.gor} scf/bbl is ${well.gor < 500 ? "low — indicating undersaturated oil with good SPT response potential" : well.gor < 800 ? "moderate — acceptable for SPT treatment, monitor for gas cap expansion" : "elevated — high gas mobility may reduce SPT effectiveness, consider gas management strategy"}.`
        : `No GOR data available. Cannot fully assess gas-phase influence on SPT treatment effectiveness. Recommend PVT sampling before final treatment decision.`,
      verdict: well.gor < 500 ? "positive" : well.gor < 800 ? "neutral" : "negative",
    },
  ];

  const totalScore = Math.round((oilScore + wcScore + depthScore + formationScore + statusScore + gorScore) / 6);

  const uplift = well.waterCut < 30 ? 7 : well.waterCut <= 50 ? 5 : well.waterCut <= 70 ? 3 : 1.5;
  const postSPT = Math.min(well.oil + uplift, 25);
  const monthlyGain = (postSPT - well.oil) * 30;
  const roi12 = Math.round(monthlyGain * 12 * 65);

  const summary = `**Cosmos Reason Verdict:** ${well.name} scores **${totalScore}/100** for SPT candidacy. ` +
    `Post-treatment forecast: ${well.oil} → ${postSPT.toFixed(1)} bbl/d (+${uplift} bbl/d). ` +
    `Estimated 12-month incremental revenue: **$${roi12.toLocaleString()}** at $65/bbl WTI. ` +
    (totalScore >= 75 ? "**Recommended for SPT treatment.** This well is an excellent candidate based on all six MCDA parameters." :
     totalScore >= 55 ? "**Conditionally recommended.** Proceed with detailed engineering review and core analysis before SPT deployment." :
     "**Not recommended at this time.** Consider alternative optimization strategies or re-evaluate after additional data acquisition.");

  const sorted = [...WELLS].sort((a, b) => {
    const sa = Math.round(((a.oil <= 15 ? 95 : a.oil <= 25 ? 75 : 40) + (a.waterCut >= 20 && a.waterCut <= 60 ? 90 : 70) + (a.depth >= 2000 && a.depth <= 6000 ? 85 : 50) + 80 + 90 + 75) / 6);
    const sb = Math.round(((b.oil <= 15 ? 95 : b.oil <= 25 ? 75 : 40) + (b.waterCut >= 20 && b.waterCut <= 60 ? 90 : 70) + (b.depth >= 2000 && b.depth <= 6000 ? 85 : 50) + 80 + 90 + 75) / 6);
    return sb - sa;
  });
  const rank = sorted.findIndex(w => w.id === well.id) + 1;

  return { steps, totalScore, rank, summary };
}

const CosmosReasonDemo = () => {
  const [selectedWell, setSelectedWell] = useState<WellCandidate>(WELLS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [streamedSummary, setStreamedSummary] = useState("");
  const stepsRef = useRef<HTMLDivElement>(null);

  const { steps, totalScore, rank, summary } = computeReasoning(selectedWell);

  const runReasoning = async () => {
    setIsRunning(true);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setShowSummary(false);
    setStreamedSummary("");

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      setCompletedSteps(prev => [...prev, i]);
    }

    setShowSummary(true);
    // Stream the summary text
    const plainSummary = summary.replace(/\*\*/g, "");
    for (let i = 0; i <= plainSummary.length; i++) {
      setStreamedSummary(plainSummary.slice(0, i));
      await new Promise(r => setTimeout(r, 12));
    }
    setIsRunning(false);
  };

  const selectWell = (well: WellCandidate) => {
    if (isRunning) return;
    setSelectedWell(well);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setShowSummary(false);
    setStreamedSummary("");
  };

  const progress = completedSteps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  return (
    <Card className="glass-card border-purple-500/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
            <Brain className="h-7 w-7 text-purple-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              Cosmos Reason — Interactive Demo
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">XAI</Badge>
            </CardTitle>
            <CardDescription>
              Chain-of-thought reasoning: why is this well the best SPT candidate?
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Well Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Well for Analysis</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {WELLS.map(w => {
              const s = computeReasoning(w);
              return (
                <button
                  key={w.id}
                  onClick={() => selectWell(w)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    selectedWell.id === w.id
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  )}
                  disabled={isRunning}
                >
                  <div className="text-sm font-semibold truncate">{w.name}</div>
                  <div className="text-xs text-muted-foreground">{w.formation.split(" ")[0]}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{w.oil} bbl/d</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {s.totalScore}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Well Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: "Oil", value: `${selectedWell.oil} bbl/d` },
            { label: "Water Cut", value: `${selectedWell.waterCut}%` },
            { label: "Depth", value: `${selectedWell.depth.toLocaleString()} ft` },
            { label: "Formation", value: selectedWell.formation.split(" ")[0] },
            { label: "GOR", value: `${selectedWell.gor} scf/bbl` },
            { label: "Porosity", value: `${selectedWell.porosity}%` },
            { label: "Perm", value: `${selectedWell.permeability} mD` },
            { label: "Status", value: selectedWell.status },
          ].map(p => (
            <div key={p.label} className="text-center p-2 rounded-lg bg-muted/30 border border-border/30">
              <div className="text-xs text-muted-foreground">{p.label}</div>
              <div className="text-sm font-semibold">{p.value}</div>
            </div>
          ))}
        </div>

        {/* Run Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={runReasoning}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? "Reasoning..." : "Run Cosmos Reason"}
          </Button>
          {isRunning && (
            <div className="flex-1 flex items-center gap-3">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>

        {/* Reasoning Steps */}
        {(currentStep >= 0 || completedSteps.length > 0) && (
          <div ref={stepsRef} className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chain-of-Thought Reasoning ({completedSteps.length}/{steps.length})
            </h4>
            {steps.map((step, i) => {
              const isActive = currentStep === i && !completedSteps.includes(i);
              const isComplete = completedSteps.includes(i);
              if (!isActive && !isComplete) return null;

              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isActive && "border-purple-500/50 bg-purple-500/5 animate-pulse",
                    isComplete && step.verdict === "positive" && "border-green-500/30 bg-green-500/5",
                    isComplete && step.verdict === "neutral" && "border-yellow-500/30 bg-yellow-500/5",
                    isComplete && step.verdict === "negative" && "border-red-500/30 bg-red-500/5",
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className={cn("h-5 w-5", step.iconColor)} />
                    <span className="font-semibold">{step.title}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {step.parameter}: {step.value}
                    </Badge>
                    {isComplete && (
                      <Badge className={cn(
                        "text-xs",
                        step.verdict === "positive" && "bg-green-500/20 text-green-400",
                        step.verdict === "neutral" && "bg-yellow-500/20 text-yellow-400",
                        step.verdict === "negative" && "bg-red-500/20 text-red-400",
                      )}>
                        {step.score}/{step.maxScore}
                      </Badge>
                    )}
                  </div>
                  {isComplete && (
                    <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                      {step.reasoning}
                    </p>
                  )}
                  {isActive && (
                    <div className="flex items-center gap-2 pl-8">
                      <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-sm text-muted-foreground italic">Analyzing {step.parameter.toLowerCase()}...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Final Verdict */}
        {showSummary && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* Score Card */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30">
                <div className={cn(
                  "text-4xl font-bold",
                  totalScore >= 75 ? "text-green-400" : totalScore >= 55 ? "text-yellow-400" : "text-red-400"
                )}>
                  {totalScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1">SPT Candidacy Score</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="text-4xl font-bold text-purple-400">#{rank}</div>
                <div className="text-xs text-muted-foreground mt-1">Rank (of {WELLS.length} wells)</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className={cn(
                  "text-lg font-bold mt-2",
                  totalScore >= 75 ? "text-green-400" : totalScore >= 55 ? "text-yellow-400" : "text-red-400"
                )}>
                  {totalScore >= 75 ? "✅ Recommended" : totalScore >= 55 ? "⚠️ Conditional" : "❌ Not Recommended"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Treatment Decision</div>
              </div>
            </div>

            {/* Streamed Summary */}
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-400">Cosmos Reason — Final Verdict</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {streamedSummary}
                {isRunning && <span className="inline-block w-1.5 h-4 bg-purple-400 animate-pulse ml-0.5 align-text-bottom" />}
              </p>
            </div>
          </div>
        )}

        {/* Radar Chart — Multi-Well Comparison (unfolds as CoT steps complete) */}
        {completedSteps.length > 0 && (
          <div className="space-y-3 animate-in fade-in duration-500">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Radar className="h-4 w-4" />
              Parameter Comparison — Radar View
              {!showSummary && (
                <Badge variant="outline" className="text-[10px] ml-2 animate-pulse">
                  {completedSteps.length}/{steps.length} parameters revealed
                </Badge>
              )}
            </h4>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={(() => {
                      const normalize = (val: number, min: number, max: number) => Math.round(((val - min) / (max - min)) * 100);
                      const params = [
                        { param: "Production", key: "oil" as const, min: 0, max: 30, stepIndex: 0 },
                        { param: "Low Water Cut", key: "waterCut" as const, min: 0, max: 100, invert: true, stepIndex: 1 },
                        { param: "Optimal Depth", key: "depth" as const, min: 2000, max: 8000, invert: true, stepIndex: 2 },
                        { param: "Porosity", key: "porosity" as const, min: 0, max: 25, stepIndex: 3 },
                        { param: "Low GOR", key: "gor" as const, min: 0, max: 1000, invert: true, stepIndex: 5 },
                        { param: "Permeability", key: "permeability" as const, min: 0, max: 55, stepIndex: 3 },
                      ];
                      return params.map(p => {
                        const revealed = completedSteps.includes(p.stepIndex);
                        const row: any = { param: p.param };
                        WELLS.forEach(w => {
                          if (!revealed) {
                            row[w.name] = 0;
                            return;
                          }
                          const raw = w[p.key] as number;
                          const n = normalize(raw, p.min, p.max);
                          row[w.name] = (p as any).invert ? Math.max(0, 100 - n) : Math.min(100, n);
                        });
                        return row;
                      });
                    })()}
                  >
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="param" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v}`, ""]}
                    />
                    {WELLS.map((w, i) => {
                      const colors = ["#a855f7", "#3b82f6", "#22c55e", "#eab308", "#ef4444"];
                      const isSelected = w.id === selectedWell.id;
                      return (
                        <RechartsRadar
                          key={w.id}
                          name={w.name}
                          dataKey={w.name}
                          stroke={colors[i]}
                          fill={colors[i]}
                          fillOpacity={isSelected ? 0.25 : 0.05}
                          strokeWidth={isSelected ? 2.5 : 1}
                          strokeOpacity={isSelected ? 1 : 0.4}
                          animationDuration={600}
                          animationEasing="ease-out"
                        />
                      );
                    })}
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value) => (
                        <span style={{ color: value === selectedWell.name ? "#a855f7" : "hsl(var(--muted-foreground))" }}>
                          {value}
                        </span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {showSummary
                  ? "Selected well highlighted · All values normalized 0–100 (higher = better SPT fit)"
                  : "Rays unfold as each Chain-of-Thought step completes…"
                }
              </p>
            </div>
          </div>
        )}

        {/* Comparative Ranking Table */}
        {showSummary && (
          <div className="space-y-3 animate-in fade-in duration-500">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4" />
              Comparative Ranking — All {WELLS.length} Wells
            </h4>
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="p-3 text-left font-medium text-muted-foreground">Rank</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Well</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Score</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Oil</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">WC</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Depth</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Formation</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">GOR</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Post-SPT</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">12m Revenue</th>
                    <th className="p-3 text-center font-medium text-muted-foreground">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const ranked = WELLS.map(w => {
                      const r = computeReasoning(w);
                      const uplift = w.waterCut < 30 ? 7 : w.waterCut <= 50 ? 5 : w.waterCut <= 70 ? 3 : 1.5;
                      const postSPT = Math.min(w.oil + uplift, 25);
                      const rev12 = Math.round((postSPT - w.oil) * 30 * 12 * 65);
                      return { well: w, ...r, uplift, postSPT, rev12 };
                    }).sort((a, b) => b.totalScore - a.totalScore);

                    return ranked.map((item, idx) => {
                      const isSelected = item.well.id === selectedWell.id;
                      return (
                        <tr
                          key={item.well.id}
                          className={cn(
                            "border-b border-border/20 transition-colors cursor-pointer",
                            isSelected ? "bg-purple-500/10 border-purple-500/30" : "hover:bg-muted/20"
                          )}
                          onClick={() => selectWell(item.well)}
                        >
                          <td className="p-3">
                            <span className={cn(
                              "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
                              idx === 0 ? "bg-yellow-500/20 text-yellow-400" : idx === 1 ? "bg-gray-400/20 text-gray-300" : idx === 2 ? "bg-amber-700/20 text-amber-500" : "bg-muted/30 text-muted-foreground"
                            )}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold">{item.well.name}</div>
                            <div className="text-xs text-muted-foreground">{item.well.county} Co.</div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={item.totalScore} className="w-12 h-1.5" />
                              <span className={cn(
                                "font-bold text-sm",
                                item.totalScore >= 75 ? "text-green-400" : item.totalScore >= 55 ? "text-yellow-400" : "text-red-400"
                              )}>
                                {item.totalScore}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{item.well.oil} bbl/d</td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              "font-medium",
                              item.well.waterCut > 60 ? "text-red-400" : item.well.waterCut > 40 ? "text-yellow-400" : "text-green-400"
                            )}>
                              {item.well.waterCut}%
                            </span>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{item.well.depth.toLocaleString()}'</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-[10px]">{item.well.formation.split(" ")[0]}</Badge>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{item.well.gor}</td>
                          <td className="p-3 text-center">
                            <span className="text-green-400 font-semibold">{item.postSPT.toFixed(1)}</span>
                            <span className="text-muted-foreground text-xs ml-1">(+{item.uplift})</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-semibold text-green-400">${(item.rev12 / 1000).toFixed(0)}k</span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={cn(
                              "text-[10px]",
                              item.totalScore >= 75 ? "bg-green-500/20 text-green-400 border-green-500/30" :
                              item.totalScore >= 55 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                              "bg-red-500/20 text-red-400 border-red-500/30"
                            )}>
                              {item.totalScore >= 75 ? "✅ Go" : item.totalScore >= 55 ? "⚠️ Review" : "❌ No"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click any row to run detailed Chain-of-Thought analysis for that well
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CosmosReasonDemo;
