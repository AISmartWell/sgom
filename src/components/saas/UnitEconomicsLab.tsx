import { useMemo, useState } from "react";
import { Calculator, TrendingUp, AlertTriangle, Target, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─────────────────────────────────────────────
   COST MODEL — drives cost-per-well calculation
   ───────────────────────────────────────────── */
const ENVERUS_PRICE_PER_WELL = 12;
const SEISMIC_LICENSE_BASE = 800;
const AWS_GPU_24_7 = 883;
const AWS_RDS = 140;
const AWS_STORAGE_CDN = 45;
const AWS_EKS_LB = 95;
const AWS_BANDWIDTH = 18;
const NIM_COST_PER_WELL = 0.12;
const GEMINI_COST_PER_WELL = 0.105;
const AI_GATEWAY_BUFFER = 15;
const SAAS_BACKEND = 35;
const MONITORING = 25;
const VALIDATOR_RATE = 85;
const VALIDATOR_HRS_PER_WELL = 1;
const QA_FLAT_HOURS = 4;
const QA_RATE = 120;

/* Pricing tiers used by both Costs (margin check) and Pricing (optimizer) */
type Tier = "explorer" | "professional" | "enterprise";
const TIERS: Tier[] = ["explorer", "professional", "enterprise"];
const TIER_LABEL: Record<Tier, string> = {
  explorer: "Explorer",
  professional: "Professional",
  enterprise: "Enterprise",
};
const TIER_ACCENT: Record<Tier, string> = {
  explorer: "hsl(210 65% 57%)",
  professional: "hsl(38 92% 50%)",
  enterprise: "hsl(173 80% 42%)",
};
const TIER_WELL_CAP: Record<Tier, number> = {
  explorer: 10,
  professional: 50,
  enterprise: Infinity,
};

/* Pricing optimizer constants */
const TARGETS: Record<Tier, number> = { explorer: 40, professional: 55, enterprise: 70 };
const FIXED_COSTS: Record<Tier, number> = {
  explorer: 800,
  professional: 2200,
  enterprise: 4800,
};

interface Prices {
  sub: number;
  perWell: number;
}

/* ─────────────────────────────────────────────
   Pricing math helpers
   ───────────────────────────────────────────── */
function calcMargin(sub: number, perWell: number, wells: number, tier: Tier, costPerWell: number) {
  const cappedPerWell = Math.min(perWell * wells, sub);
  const revenue = sub + cappedPerWell;
  const varCost = wells * costPerWell;
  const fixCost = FIXED_COSTS[tier];
  const totalCost = varCost + fixCost;
  const margin = ((revenue - totalCost) / revenue) * 100;
  const capHit = perWell * wells > sub;
  return { revenue, totalCost, margin, capHit, cappedPerWell };
}

function solveSubscription(target: number, perWell: number, wells: number, tier: Tier, costPerWell: number) {
  const fixCost = FIXED_COSTS[tier];
  const varCost = wells * costPerWell;
  const neededRevenue = (fixCost + varCost) / (1 - target / 100);
  let sub = Math.ceil(neededRevenue / 2 / 100) * 100;
  const check = calcMargin(sub, perWell, wells, tier, costPerWell);
  if (Math.abs(check.margin - target) > 2) {
    sub = Math.ceil((neededRevenue - perWell * wells) / 100) * 100;
  }
  return Math.max(sub, 1000);
}

function solvePerWell(target: number, sub: number, wells: number, tier: Tier, costPerWell: number) {
  const fixCost = FIXED_COSTS[tier];
  const varCost = wells * costPerWell;
  const neededRevenue = (fixCost + varCost) / (1 - target / 100);
  if (neededRevenue <= sub) return 20;
  const neededCapped = neededRevenue - sub;
  const pw = Math.ceil(Math.min(neededCapped, sub) / wells / 5) * 5;
  return Math.max(pw, 20);
}

/* ─────────────────────────────────────────────
   Reusable slider control
   ───────────────────────────────────────────── */
interface ControlSliderProps {
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}
const ControlSlider = ({ label, display, value, min, max, step, onChange }: ControlSliderProps) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <span className="text-xs text-primary font-mono">{display}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
  </div>
);

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */
const UnitEconomicsLab = () => {
  // Shared workload control
  const [wells, setWells] = useState(200);
  // Cost-tab inputs
  const [validationPct, setValidationPct] = useState(10);
  const [enverusShare, setEnverusShare] = useState(100);
  // Pricing-tab inputs (initialised from current marketing tiers)
  const [prices, setPrices] = useState<Record<Tier, Prices>>({
    explorer: { sub: 3200, perWell: 350 },
    professional: { sub: 9600, perWell: 200 },
    enterprise: { sub: 24000, perWell: 120 },
  });

  /* ── COST CALCULATION ── */
  const costs = useMemo(() => {
    const enverusWells = Math.round((wells * enverusShare) / 100);
    const dataCost = enverusWells * ENVERUS_PRICE_PER_WELL + SEISMIC_LICENSE_BASE;
    const awsCost = AWS_GPU_24_7 + AWS_RDS + AWS_STORAGE_CDN + AWS_EKS_LB + AWS_BANDWIDTH;
    const aiCost = wells * (NIM_COST_PER_WELL + GEMINI_COST_PER_WELL) + AI_GATEWAY_BUFFER;
    const saasCost = SAAS_BACKEND + MONITORING;
    const validatedWells = Math.round((wells * validationPct) / 100);
    const peopleCost = validatedWells * VALIDATOR_HRS_PER_WELL * VALIDATOR_RATE + QA_FLAT_HOURS * QA_RATE;
    const subtotal = dataCost + awsCost + aiCost + saasCost + peopleCost;
    const reserve = subtotal * 0.1;
    const total = subtotal + reserve;
    const perWell = total / wells;

    const breakdown = [
      { label: "Data (Enverus + Seismic)", value: Math.round(dataCost), color: "hsl(var(--primary))" },
      { label: "Validation (Geophysicist)", value: Math.round(peopleCost), color: "hsl(220 70% 60%)" },
      { label: "AWS Infrastructure", value: Math.round(awsCost), color: "hsl(200 80% 55%)" },
      { label: "AI Inference (NIM + Gemini)", value: Math.round(aiCost), color: "hsl(160 70% 50%)" },
      { label: "SaaS Backend", value: Math.round(saasCost), color: "hsl(280 60% 60%)" },
      { label: "Reserve (10%)", value: Math.round(reserve), color: "hsl(var(--muted-foreground))" },
    ];

    return { dataCost, awsCost, aiCost, saasCost, peopleCost, reserve, total, perWell, breakdown };
  }, [wells, validationPct, enverusShare]);

  /* Cost-per-well drives the pricing optimizer */
  const costPerWell = costs.perWell;

  /* Tier margin sanity check (uses tier well caps — this is the COST-tab view) */
  const tierMargins = useMemo(
    () =>
      TIERS.map((t) => {
        const billable = Math.min(wells, TIER_WELL_CAP[t]);
        const revenue = prices[t].sub + billable * prices[t].perWell;
        const profit = revenue - costs.total;
        const marginPct = (profit / revenue) * 100;
        return {
          tier: t,
          revenue: Math.round(revenue),
          cost: Math.round(costs.total),
          profit: Math.round(profit),
          marginPct,
          capped: wells > TIER_WELL_CAP[t],
        };
      }),
    [prices, costs.total, wells]
  );

  /* ── PRICING OPTIMIZER ── */
  const pricingResults = useMemo(
    () =>
      Object.fromEntries(
        TIERS.map((t) => [t, calcMargin(prices[t].sub, prices[t].perWell, wells, t, costPerWell)])
      ) as Record<Tier, ReturnType<typeof calcMargin>>,
    [prices, wells, costPerWell]
  );

  const optimal = useMemo(
    () =>
      Object.fromEntries(
        TIERS.map((t) => {
          const target = TARGETS[t];
          const subOnly = {
            sub: solveSubscription(target, prices[t].perWell, wells, t, costPerWell),
            perWell: prices[t].perWell,
          };
          const pwOnly = {
            sub: prices[t].sub,
            perWell: solvePerWell(target, prices[t].sub, wells, t, costPerWell),
          };
          const combined = {
            sub: solveSubscription(target, pwOnly.perWell, wells, t, costPerWell),
            perWell: pwOnly.perWell,
          };
          return [t, { subOnly, pwOnly, combined, target }];
        })
      ) as Record<Tier, { subOnly: Prices; pwOnly: Prices; combined: Prices; target: number }>,
    [prices, wells, costPerWell]
  );

  const update = (tier: Tier, field: keyof Prices, val: number) => {
    setPrices((p) => ({ ...p, [tier]: { ...p[tier], [field]: val } }));
  };
  const applyOptimal = (tier: Tier, approach: "subOnly" | "pwOnly" | "combined") => {
    setPrices((p) => ({ ...p, [tier]: optimal[tier][approach] }));
  };

  const portfolioRevenue = Object.values(pricingResults).reduce((a, r) => a + r.revenue, 0);
  const barColor = (m: number, target: number) =>
    m >= target ? "hsl(142 71% 45%)" : m >= target * 0.85 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";

  return (
    <section className="py-16">
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Calculator className="h-4 w-4 text-primary" />
          Unit Economics Lab
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Cost & Pricing Workbench</h2>
        <p className="text-muted-foreground text-lg">
          Build cost-per-well from the ground up, then engineer prices to hit your target margin
        </p>
      </div>

      {/* Shared workload + live cost-per-well bridge */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Wells / Month (shared)
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">{wells}</div>
          <Slider
            value={[wells]}
            min={10}
            max={2000}
            step={10}
            onValueChange={(v) => setWells(v[0])}
            className="mt-3"
          />
        </div>
        <div className="bg-card border border-primary/40 rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-primary" />
            Cost / Well (live from Costs tab)
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">${costPerWell.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            ${Math.round(costs.total).toLocaleString()} / mo total
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Portfolio Revenue (Pricing tab)
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">
            ${(portfolioRevenue / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-muted-foreground mt-1">all three tiers / month</div>
        </div>
      </div>

      <Tabs defaultValue="costs" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="costs" className="gap-2">
            <Calculator className="h-4 w-4" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Target className="h-4 w-4" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* ────────── COSTS TAB ────────── */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <ControlSlider
                  label="Validation coverage"
                  display={`every ${validationPct > 0 ? Math.round(100 / validationPct) : "∞"}th well (${validationPct}%)`}
                  value={validationPct}
                  min={0}
                  max={100}
                  step={5}
                  onChange={setValidationPct}
                />
                <ControlSlider
                  label="Enverus / IHS data share"
                  display={`${enverusShare}% paid · ${100 - enverusShare}% public`}
                  value={enverusShare}
                  min={0}
                  max={100}
                  step={5}
                  onChange={setEnverusShare}
                />
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-muted-foreground tracking-wide uppercase">
                    Total monthly cost
                  </span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-4xl font-bold text-foreground tabular-nums">
                  ${Math.round(costs.total).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Cost per well:{" "}
                  <span className="text-primary font-semibold">${costs.perWell.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
                Cost Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={320} minHeight={320}>
                <BarChart data={costs.breakdown} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={180}
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Cost"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {costs.breakdown.map((b, i) => (
                      <Cell key={i} fill={b.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tier-cap margin cards (quick-look at marketing tiers) */}
          <div className="grid md:grid-cols-3 gap-4">
            {tierMargins.map((m) => {
              const negative = m.profit < 0;
              return (
                <div
                  key={m.tier}
                  className={`rounded-xl border p-5 ${
                    negative ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold tracking-wide text-foreground">{TIER_LABEL[m.tier]}</h4>
                    {negative && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Revenue (sub + usage)</span>
                      <span className="text-foreground tabular-nums">
                        ${m.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span className="text-foreground tabular-nums">${m.cost.toLocaleString()}</span>
                    </div>
                    {m.capped && (
                      <div className="text-warning text-[10px]">
                        Tier capped — overage not billed
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-border mb-3" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      Margin
                    </span>
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        negative ? "text-destructive" : "text-primary"
                      }`}
                    >
                      {m.marginPct.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    className={`text-xs mt-1 text-right ${
                      negative ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {negative ? "Loss" : "Profit"}: ${Math.abs(m.profit).toLocaleString()}/mo
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            Switching from 100% Enverus to a hybrid public-registry model is the largest single cost
            lever. Cost per well derived here flows live into the Pricing tab.
          </p>
        </TabsContent>

        {/* ────────── PRICING TAB ────────── */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Tier cards with sliders */}
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((t) => {
              const r = pricingResults[t];
              const target = TARGETS[t];
              const accent = TIER_ACCENT[t];
              const pct = Math.min(100, Math.max(0, r.margin));
              const targetPct = Math.min(100, target);
              const hit = r.margin >= target;
              return (
                <div
                  key={t}
                  className="bg-card border border-border rounded-xl p-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
                  <h3
                    className="text-lg font-bold tracking-[0.15em] uppercase mb-3"
                    style={{ color: accent }}
                  >
                    {TIER_LABEL[t]}
                  </h3>

                  <div className="relative mb-4">
                    <div className="h-1.5 bg-muted rounded">
                      <div
                        className="h-1.5 transition-all rounded"
                        style={{ width: `${pct}%`, background: barColor(r.margin, target) }}
                      />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-px bg-foreground/30"
                      style={{ left: `${targetPct}%` }}
                    />
                    <div className="flex justify-between text-[10px] mt-1.5">
                      <span style={{ color: barColor(r.margin, target) }} className="font-semibold">
                        {r.margin.toFixed(1)}% margin
                      </span>
                      <span className="text-muted-foreground">target {target}%</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] uppercase tracking-wide mb-1.5">
                      <span className="text-foreground">Subscription</span>
                      <span className="text-primary font-semibold">
                        ${prices[t].sub.toLocaleString()}/mo
                      </span>
                    </div>
                    <Slider
                      value={[prices[t].sub]}
                      min={1000}
                      max={50000}
                      step={100}
                      onValueChange={(v) => update(t, "sub", v[0])}
                    />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] uppercase tracking-wide mb-1.5">
                      <span className="text-foreground">Per-Well Rate</span>
                      <span className="text-primary font-semibold">${prices[t].perWell}/well</span>
                    </div>
                    <Slider
                      value={[prices[t].perWell]}
                      min={20}
                      max={600}
                      step={5}
                      onValueChange={(v) => update(t, "perWell", v[0])}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs mb-3">
                    {[
                      ["Revenue / mo", `$${r.revenue.toLocaleString()}`, "text-foreground"],
                      ["Cost / mo", `$${r.totalCost.toLocaleString()}`, "text-destructive"],
                      [
                        "Cap triggered?",
                        r.capHit ? "YES ⚠" : "No",
                        r.capHit ? "text-warning" : "text-primary",
                      ],
                    ].map(([k, v, cls]) => (
                      <div
                        key={k}
                        className="flex justify-between items-center py-1 border-b border-border/40 last:border-0"
                      >
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {k}
                        </span>
                        <span className={`tabular-nums font-medium ${cls}`}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`inline-block text-[10px] uppercase tracking-[0.15em] px-2 py-1 border rounded ${
                      hit
                        ? "text-primary border-primary/40 bg-primary/5"
                        : r.margin >= target * 0.85
                        ? "text-warning border-warning/40 bg-warning/5"
                        : "text-destructive border-destructive/40 bg-destructive/5"
                    }`}
                  >
                    {hit
                      ? "✓ Target Met"
                      : r.margin >= target * 0.85
                      ? "◆ Close"
                      : "✕ Below Target"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optimization scenarios */}
          <div className="space-y-4">
            {TIERS.map((t) => {
              const o = optimal[t];
              const cur = pricingResults[t];
              const target = TARGETS[t];
              const accent = TIER_ACCENT[t];
              return (
                <div key={t} className="bg-card border border-border rounded-xl p-5">
                  <h3
                    className="text-xs uppercase tracking-[0.2em] mb-4 pb-2 border-b border-border"
                    style={{ color: accent }}
                  >
                    <span className="font-bold">{TIER_LABEL[t]}</span>
                    <span className="text-muted-foreground ml-2">
                      — paths to {target}% margin
                    </span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                          <th className="text-left font-normal py-2 px-2">Approach</th>
                          <th className="text-left font-normal py-2 px-2">Description</th>
                          <th className="text-right font-normal py-2 px-2">Subscription</th>
                          <th className="text-right font-normal py-2 px-2">Per-Well</th>
                          <th className="text-right font-normal py-2 px-2">Margin</th>
                          <th className="text-right font-normal py-2 px-2">Δ Revenue</th>
                          <th className="text-right font-normal py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        <tr className="border-b border-border/40 bg-warning/5">
                          <td className="py-2 px-2 font-semibold text-warning">Current</td>
                          <td className="py-2 px-2 text-muted-foreground">as-is</td>
                          <td className="py-2 px-2 text-right">
                            ${prices[t].sub.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right">${prices[t].perWell}</td>
                          <td
                            className={`py-2 px-2 text-right font-semibold ${
                              cur.margin >= target ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {cur.margin.toFixed(1)}%
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground">—</td>
                          <td className="py-2 px-2"></td>
                        </tr>
                        {(
                          [
                            { label: "A", desc: "↑ Subscription only", approach: "subOnly" as const },
                            { label: "B", desc: "↑ Per-well rate only", approach: "pwOnly" as const },
                            { label: "C", desc: "Balanced: both levers", approach: "combined" as const },
                          ]
                        ).map(({ label, desc, approach }) => {
                          const opt = o[approach];
                          const optR = calcMargin(opt.sub, opt.perWell, wells, t, costPerWell);
                          const deltaRev = optR.revenue - cur.revenue;
                          const hit = optR.margin >= target;
                          return (
                            <tr
                              key={approach}
                              className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2 px-2 font-bold" style={{ color: accent }}>
                                {label}
                              </td>
                              <td className="py-2 px-2 text-foreground">{desc}</td>
                              <td className="py-2 px-2 text-right">
                                ${opt.sub.toLocaleString()}
                                {opt.sub !== prices[t].sub && (
                                  <span
                                    className={`ml-1 text-[10px] ${
                                      opt.sub > prices[t].sub
                                        ? "text-primary"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {opt.sub > prices[t].sub ? "+" : ""}
                                    {(opt.sub - prices[t].sub).toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                ${opt.perWell}
                                {opt.perWell !== prices[t].perWell && (
                                  <span
                                    className={`ml-1 text-[10px] ${
                                      opt.perWell > prices[t].perWell
                                        ? "text-primary"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {opt.perWell > prices[t].perWell ? "+" : ""}
                                    {opt.perWell - prices[t].perWell}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`py-2 px-2 text-right font-semibold ${
                                  hit ? "text-primary" : "text-destructive"
                                }`}
                              >
                                {optR.margin.toFixed(1)}%
                              </td>
                              <td
                                className={`py-2 px-2 text-right ${
                                  deltaRev >= 0 ? "text-primary" : "text-destructive"
                                }`}
                              >
                                {deltaRev >= 0 ? "+" : ""}${Math.round(deltaRev).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <button
                                  onClick={() => applyOptimal(t, approach)}
                                  className="text-[10px] uppercase tracking-wider px-2 py-1 border border-border rounded hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                                >
                                  Apply
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            Per-well usage revenue is capped at the base subscription value. Cost per well = $
            {costPerWell.toFixed(2)} flows live from the Costs tab — change validation coverage or
            data mix there and the optimizer recomputes instantly.
          </p>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default UnitEconomicsLab;
