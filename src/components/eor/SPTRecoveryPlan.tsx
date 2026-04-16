import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  Settings, Droplets, DollarSign, TrendingUp, Zap, Shield, Clock, Target, CheckCircle2, AlertTriangle,
} from "lucide-react";
import {
  DEFAULT_OIL_PRICE, DEFAULT_OPEX_PER_BBL, DEFAULT_TREATMENT_COST,
  sptGainByWaterCut, arpsRate, ARPS_DEFAULTS, calcFiveYearROI, calcNPV, calcIRR,
} from "@/lib/economics-config";

// ── Maxxwell SPT Technology Constants (Patent US 8,863,823) ─────────
const SPT_PARAMS = {
  maxSlotsPerRow: 4,
  nozzleOptions: [2, 3, 4] as const,
  drainageAreaPerFt: { 2: 13, 3: 18, 4: 23 } as Record<number, number>, // ft²/ft
  maxSlotDepth: 5, // ft
  cutSpeedCased: 50, // min/ft
  cutSpeedOpenHole: 30, // min/ft
  inflowMultiplier: { min: 5, max: 10 }, // 5–10× increase
  permeabilityIncrease: { min: 30, max: 50 }, // %
  porosityIncrease: { min: 30, max: 50 }, // %
  effectDuration: { min: 15, max: 25 }, // years
  recoveryEfficiency: 0.95, // up to 95%
};

interface WellInput {
  id: string;
  name: string;
  currentProduction: number; // bbl/d
  waterCut: number; // %
  totalDepth: number; // ft
  formation: string;
  wellType: string; // "cased" | "open_hole"
  perforationInterval: number; // ft — length of productive interval
}

interface RecoveryPlan {
  well: WellInput;
  nozzleCount: number;
  slotDepth: number;
  sptGain: number; // bbl/d added
  postTreatmentRate: number; // bbl/d
  drainageArea: number; // ft²
  treatmentTime: number; // hours
  treatmentCost: number;
  monthlyRevenue: number;
  paybackMonths: number;
  fiveYearROI: number;
  fiveYearNet: number;
  npv: number;
  irr: number;
  effectYears: number;
  declineProfile: Array<{ month: number; baseline: number; withSPT: number; cumGain: number }>;
  riskLevel: "low" | "medium" | "high";
  recommendation: string;
}

// Demo wells for the recovery plan
const DEMO_WELLS: WellInput[] = [
  { id: "SPT-001", name: "Permian-Alpha", currentProduction: 12, waterCut: 35, totalDepth: 8500, formation: "Sandstone", wellType: "cased", perforationInterval: 40 },
  { id: "SPT-002", name: "Anadarko-Beta", currentProduction: 18, waterCut: 28, totalDepth: 7200, formation: "Carbonate", wellType: "cased", perforationInterval: 55 },
  { id: "SPT-003", name: "Delaware-Gamma", currentProduction: 8, waterCut: 52, totalDepth: 9100, formation: "Shale", wellType: "open_hole", perforationInterval: 35 },
  { id: "SPT-004", name: "Basin-Delta", currentProduction: 22, waterCut: 22, totalDepth: 6800, formation: "Sandstone", wellType: "cased", perforationInterval: 60 },
  { id: "SPT-005", name: "Central-Epsilon", currentProduction: 5, waterCut: 68, totalDepth: 5500, formation: "Carbonate", wellType: "cased", perforationInterval: 25 },
];

function computeRecoveryPlan(well: WellInput, nozzleCount: number, oilPrice: number): RecoveryPlan {
  const slotDepth = Math.min(SPT_PARAMS.maxSlotDepth, well.perforationInterval * 0.1 + 2);
  const drainageArea = SPT_PARAMS.drainageAreaPerFt[nozzleCount] * well.perforationInterval;
  const cutSpeed = well.wellType === "open_hole" ? SPT_PARAMS.cutSpeedOpenHole : SPT_PARAMS.cutSpeedCased;
  const treatmentTime = (cutSpeed * well.perforationInterval) / 60; // hours

  // SPT gain from economics-config (water-cut driven)
  const baseGain = sptGainByWaterCut(well.waterCut);
  // Scale gain by nozzle count (more nozzles → more drainage)
  const nozzleScale = nozzleCount / 3; // normalized to 3-nozzle baseline
  const sptGain = baseGain * nozzleScale;

  const postTreatmentRate = well.currentProduction + sptGain;
  const treatmentCost = DEFAULT_TREATMENT_COST;
  const opex = DEFAULT_OPEX_PER_BBL;

  const { roi, fiveYearNet, paybackMonths } = calcFiveYearROI(sptGain, oilPrice, opex, treatmentCost);
  const npv = calcNPV(sptGain, oilPrice, opex, treatmentCost);
  const irr = calcIRR(sptGain, oilPrice, opex, treatmentCost);

  // Effect duration estimation based on formation and water cut
  const effectYears = well.waterCut < 40
    ? SPT_PARAMS.effectDuration.max
    : well.waterCut < 60
    ? Math.round((SPT_PARAMS.effectDuration.min + SPT_PARAMS.effectDuration.max) / 2)
    : SPT_PARAMS.effectDuration.min;

  // Build 60-month decline profile
  const declineProfile = [];
  let cumGain = 0;
  for (let m = 1; m <= 60; m++) {
    const baseline = arpsRate(well.currentProduction, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
    const withSPT = arpsRate(postTreatmentRate, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
    cumGain += (withSPT - baseline) * 30.44;
    declineProfile.push({ month: m, baseline: +baseline.toFixed(2), withSPT: +withSPT.toFixed(2), cumGain: Math.round(cumGain) });
  }

  // Risk assessment
  let riskLevel: "low" | "medium" | "high" = "low";
  let recommendation = "Strong SPT candidate — proceed with treatment program";
  if (well.waterCut > 60) {
    riskLevel = "high";
    recommendation = "High water cut — consider water shutoff before SPT treatment";
  } else if (well.waterCut > 45 || well.currentProduction < 5) {
    riskLevel = "medium";
    recommendation = "Moderate candidate — review geophysical data before treatment";
  }

  const monthlyRevenue = sptGain * 30.44 * (oilPrice - opex);

  return {
    well,
    nozzleCount,
    slotDepth: +slotDepth.toFixed(1),
    sptGain: +sptGain.toFixed(1),
    postTreatmentRate: +postTreatmentRate.toFixed(1),
    drainageArea,
    treatmentTime: +treatmentTime.toFixed(1),
    treatmentCost,
    monthlyRevenue: Math.round(monthlyRevenue),
    paybackMonths,
    fiveYearROI: +roi.toFixed(1),
    fiveYearNet: Math.round(fiveYearNet),
    npv: Math.round(npv),
    irr: +irr.toFixed(1),
    effectYears,
    declineProfile,
    riskLevel,
    recommendation,
  };
}

const SPTRecoveryPlan = () => {
  const [selectedWellIdx, setSelectedWellIdx] = useState(0);
  const [nozzleCount, setNozzleCount] = useState(3);
  const [oilPrice, setOilPrice] = useState(DEFAULT_OIL_PRICE);

  const plan = useMemo(
    () => computeRecoveryPlan(DEMO_WELLS[selectedWellIdx], nozzleCount, oilPrice),
    [selectedWellIdx, nozzleCount, oilPrice]
  );

  const riskColor = plan.riskLevel === "low" ? "text-green-400" : plan.riskLevel === "medium" ? "text-yellow-400" : "text-red-400";
  const riskBg = plan.riskLevel === "low" ? "bg-green-500/10 border-green-500/20" : plan.riskLevel === "medium" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Well Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Target Well
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedWellIdx}
              onChange={(e) => setSelectedWellIdx(Number(e.target.value))}
            >
              {DEMO_WELLS.map((w, i) => (
                <option key={w.id} value={i}>
                  {w.name} — {w.currentProduction} bbl/d, WC {w.waterCut}%
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Depth:</span> {plan.well.totalDepth.toLocaleString()} ft
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Formation:</span> {plan.well.formation}
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Type:</span> {plan.well.wellType === "cased" ? "Cased Hole" : "Open Hole"}
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Perf Interval:</span> {plan.well.perforationInterval} ft
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SPT Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              SPT Parameters (Maxxwell)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Nozzle Count: {nozzleCount}</label>
              <div className="flex gap-2 mt-1">
                {SPT_PARAMS.nozzleOptions.map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={nozzleCount === n ? "default" : "outline"}
                    onClick={() => setNozzleCount(n)}
                    className="flex-1"
                  >
                    {n} Nozzles
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <span className="text-muted-foreground">Drainage:</span>
                <span className="font-semibold ml-1">{SPT_PARAMS.drainageAreaPerFt[nozzleCount]} ft²/ft</span>
              </div>
              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <span className="text-muted-foreground">Slot Depth:</span>
                <span className="font-semibold ml-1">{plan.slotDepth} ft</span>
              </div>
              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <span className="text-muted-foreground">Cut Speed:</span>
                <span className="font-semibold ml-1">{plan.well.wellType === "cased" ? "50" : "30"} min/ft</span>
              </div>
              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <span className="text-muted-foreground">Treatment Time:</span>
                <span className="font-semibold ml-1">{plan.treatmentTime} hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Oil Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Economic Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Oil Price: ${oilPrice}/bbl</label>
              <Slider
                value={[oilPrice]}
                onValueChange={(v) => setOilPrice(v[0])}
                min={40}
                max={120}
                step={1}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">OPEX:</span> ${DEFAULT_OPEX_PER_BBL}/bbl
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">CAPEX:</span> ${(DEFAULT_TREATMENT_COST / 1000).toFixed(0)}K
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Decline Di:</span> {ARPS_DEFAULTS.Di}
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Decline b:</span> {ARPS_DEFAULTS.b}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPI label="SPT Gain" value={`+${plan.sptGain} bbl/d`} icon={Zap} color="text-primary" />
        <KPI label="Post-Treatment" value={`${plan.postTreatmentRate} bbl/d`} icon={Droplets} color="text-blue-400" />
        <KPI label="Monthly Rev" value={`$${(plan.monthlyRevenue / 1000).toFixed(1)}K`} icon={DollarSign} color="text-green-400" />
        <KPI label="Payback" value={plan.paybackMonths < 999 ? `${plan.paybackMonths} mo` : "N/A"} icon={Clock} color="text-amber-400" />
        <KPI label="5-Yr ROI" value={`${plan.fiveYearROI}%`} icon={TrendingUp} color="text-emerald-400" />
        <KPI label="NPV" value={`$${(plan.npv / 1000).toFixed(0)}K`} icon={DollarSign} color="text-cyan-400" />
        <KPI label="IRR" value={`${plan.irr}%`} icon={TrendingUp} color="text-violet-400" />
        <KPI label="Effect" value={`${plan.effectYears} yrs`} icon={Shield} color="text-rose-400" />
      </div>

      {/* Risk & Recommendation */}
      <Card className={`border ${riskBg}`}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            {plan.riskLevel === "low" ? (
              <CheckCircle2 className={`h-6 w-6 ${riskColor}`} />
            ) : (
              <AlertTriangle className={`h-6 w-6 ${riskColor}`} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${riskColor}`}>
                  Risk: {plan.riskLevel.charAt(0).toUpperCase() + plan.riskLevel.slice(1)}
                </span>
                <Badge variant="outline">{plan.nozzleCount}-Nozzle SPT Config</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{plan.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decline Profile Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            60-Month Production Forecast — Baseline vs SPT Recovery
          </CardTitle>
          <CardDescription>
            Arps decline (Di={ARPS_DEFAULTS.Di}, b={ARPS_DEFAULTS.b}) with Maxxwell SPT parameters integrated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={plan.declineProfile.filter((_, i) => i % 2 === 0)}>
              <defs>
                <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSPT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="month" label={{ value: "Month", position: "bottom" }} fontSize={11} />
              <YAxis label={{ value: "bbl/d", angle: -90, position: "insideLeft" }} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  name === "cumGain" ? `${value.toLocaleString()} bbl` : `${value} bbl/d`,
                  name === "baseline" ? "Baseline" : name === "withSPT" ? "With SPT" : "Cum. Gain",
                ]}
              />
              <Legend />
              <Area type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" fill="url(#gradBaseline)" name="Baseline Decline" />
              <Area type="monotone" dataKey="withSPT" stroke="hsl(var(--primary))" fill="url(#gradSPT)" name="SPT Recovery" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recovery Plan Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Recovery Plan — Maxxwell SPT Treatment Program
          </CardTitle>
          <CardDescription>
            Integrated parameters from Patent US 8,863,823 with Arps decline economic model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Treatment Program */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Treatment Specification
              </h4>
              <Row label="Nozzle Configuration" value={`${plan.nozzleCount} nozzles`} />
              <Row label="Max Slot Depth" value={`${plan.slotDepth} ft`} />
              <Row label="Perforation Interval" value={`${plan.well.perforationInterval} ft`} />
              <Row label="Total Drainage Area" value={`${plan.drainageArea.toLocaleString()} ft²`} />
              <Row label="Treatment Duration" value={`${plan.treatmentTime} hours`} />
              <Row label="Permeability Increase" value={`${SPT_PARAMS.permeabilityIncrease.min}–${SPT_PARAMS.permeabilityIncrease.max}%`} />
              <Row label="Porosity Increase" value={`${SPT_PARAMS.porosityIncrease.min}–${SPT_PARAMS.porosityIncrease.max}%`} />
              <Row label="Inflow Multiplier" value={`${SPT_PARAMS.inflowMultiplier.min}–${SPT_PARAMS.inflowMultiplier.max}×`} />
              <Row label="Recovery Efficiency" value={`Up to ${(SPT_PARAMS.recoveryEfficiency * 100).toFixed(0)}%`} />
            </div>

            {/* Economic Outcome */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                Economic Outcome
              </h4>
              <Row label="Treatment Cost" value={`$${(plan.treatmentCost / 1000).toFixed(0)}K`} highlight />
              <Row label="Production Gain" value={`+${plan.sptGain} bbl/d`} highlight />
              <Row label="Monthly Net Revenue" value={`$${(plan.monthlyRevenue / 1000).toFixed(1)}K`} highlight />
              <Row label="Payback Period" value={plan.paybackMonths < 999 ? `${plan.paybackMonths} months` : "N/A"} highlight />
              <Row label="5-Year Net Profit" value={`$${(plan.fiveYearNet / 1000).toFixed(0)}K`} highlight />
              <Row label="5-Year ROI" value={`${plan.fiveYearROI}%`} highlight />
              <Row label="NPV (10% discount)" value={`$${(plan.npv / 1000).toFixed(0)}K`} highlight />
              <Row label="IRR" value={`${plan.irr}%`} highlight />
              <Row label="Effective Duration" value={`${plan.effectYears} years`} highlight />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function KPI({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="p-3 rounded-lg border border-border/50 bg-muted/20 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between p-2.5 rounded-lg text-sm ${highlight ? "bg-green-500/5 border border-green-500/15" : "bg-muted/30"}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default SPTRecoveryPlan;
