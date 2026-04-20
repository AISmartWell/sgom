import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ── Cost model constants (USD/month) ── */
// Per-well variable costs
const ENVERUS_PRICE_PER_WELL = 12;        // $12/well full data package
const SEISMIC_LICENSE_BASE = 800;          // flat amortization
// AWS full stack baseline
const AWS_GPU_24_7 = 883;                  // g5.2xlarge on-demand
const AWS_RDS = 140;                       // Multi-AZ Postgres
const AWS_STORAGE_CDN = 45;
const AWS_EKS_LB = 95;
const AWS_BANDWIDTH = 18;
// AI inference
const NIM_COST_PER_WELL = 0.12;            // 3 CV calls × $0.04
const GEMINI_COST_PER_WELL = 0.105;        // 7 calls × $0.015
const AI_GATEWAY_BUFFER = 15;
// Backend SaaS
const SAAS_BACKEND = 35;
const MONITORING = 25;
// Validation
const VALIDATOR_RATE = 85;                 // $/hr geophysicist
const VALIDATOR_HRS_PER_WELL = 1;
const QA_FLAT_HOURS = 4;
const QA_RATE = 120;
// Tier pricing for margin analysis (base subscription + per-well fee)
const TIERS: { name: string; base: number; perWell: number; wellCap: number }[] = [
  { name: "Explorer",     base: 3200,  perWell: 350, wellCap: 10 },
  { name: "Professional", base: 9600,  perWell: 200, wellCap: 50 },
  { name: "Enterprise",   base: 24000, perWell: 120, wellCap: Infinity },
];

interface Breakdown {
  label: string;
  value: number;
  color: string;
}

const CostCalculator = () => {
  const [wells, setWells] = useState(200);
  const [validationPct, setValidationPct] = useState(10);
  const [enverusShare, setEnverusShare] = useState(100);

  const calc = useMemo(() => {
    // Data
    const enverusWells = Math.round((wells * enverusShare) / 100);
    const dataCost = enverusWells * ENVERUS_PRICE_PER_WELL + SEISMIC_LICENSE_BASE;
    // AWS
    const awsCost = AWS_GPU_24_7 + AWS_RDS + AWS_STORAGE_CDN + AWS_EKS_LB + AWS_BANDWIDTH;
    // AI
    const aiCost = wells * (NIM_COST_PER_WELL + GEMINI_COST_PER_WELL) + AI_GATEWAY_BUFFER;
    // SaaS infra
    const saasCost = SAAS_BACKEND + MONITORING;
    // Validation
    const validatedWells = Math.round((wells * validationPct) / 100);
    const peopleCost = validatedWells * VALIDATOR_HRS_PER_WELL * VALIDATOR_RATE + QA_FLAT_HOURS * QA_RATE;
    // Reserve 10%
    const subtotal = dataCost + awsCost + aiCost + saasCost + peopleCost;
    const reserve = subtotal * 0.1;
    const total = subtotal + reserve;
    const perWell = total / wells;

    const breakdown: Breakdown[] = [
      { label: "Data (Enverus + Seismic)", value: Math.round(dataCost), color: "hsl(var(--primary))" },
      { label: "Validation (Geophysicist)", value: Math.round(peopleCost), color: "hsl(220 70% 60%)" },
      { label: "AWS Infrastructure", value: Math.round(awsCost), color: "hsl(200 80% 55%)" },
      { label: "AI Inference (NIM + Gemini)", value: Math.round(aiCost), color: "hsl(160 70% 50%)" },
      { label: "SaaS Backend", value: Math.round(saasCost), color: "hsl(280 60% 60%)" },
      { label: "Reserve (10%)", value: Math.round(reserve), color: "hsl(var(--muted-foreground))" },
    ];

    // Margin per tier — full revenue = base subscription + per-well fees (capped at tier limit)
    const margins = TIERS.map(({ name, base, perWell: pw, wellCap }) => {
      const billableWells = Math.min(wells, wellCap);
      const revenue = base + billableWells * pw;
      const profit = revenue - total;
      const marginPct = (profit / revenue) * 100;
      return { tier: name, revenue: Math.round(revenue), cost: Math.round(total), profit: Math.round(profit), marginPct, capped: wells > wellCap };
    });

    return { dataCost, awsCost, aiCost, saasCost, peopleCost, reserve, total, perWell, breakdown, margins };
  }, [wells, validationPct, enverusShare]);

  return (
    <section className="py-16">
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Calculator className="h-4 w-4 text-primary" />
          Operating Cost Simulator
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Monthly Cost Calculator</h2>
        <p className="text-muted-foreground text-lg">
          Adjust workload and data sourcing to estimate platform unit economics
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <ControlSlider
              label="Wells analyzed per month"
              value={wells}
              display={`${wells} wells`}
              min={10} max={2000} step={10}
              onChange={setWells}
            />
            <ControlSlider
              label="Validation coverage"
              value={validationPct}
              display={`every ${validationPct > 0 ? Math.round(100 / validationPct) : "∞"}th well (${validationPct}%)`}
              min={0} max={100} step={5}
              onChange={setValidationPct}
            />
            <ControlSlider
              label="Enverus / IHS data share"
              value={enverusShare}
              display={`${enverusShare}% paid · ${100 - enverusShare}% public registries`}
              min={0} max={100} step={5}
              onChange={setEnverusShare}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-muted-foreground tracking-wide uppercase">Total monthly cost</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-4xl font-bold text-foreground tabular-nums">
              ${Math.round(calc.total).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Cost per well: <span className="text-primary font-semibold">${calc.perWell.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Breakdown chart */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
            Cost Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={320} minHeight={320}>
            <BarChart data={calc.breakdown} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" width={180}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Cost"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {calc.breakdown.map((b, i) => (
                  <Cell key={i} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Margin per tier */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {calc.margins.map((m) => {
          const negative = m.profit < 0;
          return (
            <div key={m.tier}
              className={`rounded-xl border p-5 ${negative ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold tracking-wide text-foreground">{m.tier}</h4>
                {negative && <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <div className="flex justify-between"><span>Revenue (sub + usage)</span><span className="text-foreground tabular-nums">${m.revenue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Cost</span><span className="text-foreground tabular-nums">${m.cost.toLocaleString()}</span></div>
                {m.capped && <div className="text-amber-500 text-[10px]">Tier capped — overage not billed</div>}
              </div>
              <div className="h-px bg-border mb-3" />
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Margin</span>
                <span className={`text-2xl font-bold tabular-nums ${negative ? "text-destructive" : "text-primary"}`}>
                  {m.marginPct.toFixed(0)}%
                </span>
              </div>
              <div className={`text-xs mt-1 text-right ${negative ? "text-destructive" : "text-muted-foreground"}`}>
                {negative ? "Loss" : "Profit"}: ${Math.abs(m.profit).toLocaleString()}/mo
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-3xl mx-auto">
        Revenue = base subscription + per-well fees (capped at tier well limit).
        Switching from 100% Enverus to a hybrid public-registry model is the largest single cost lever.
      </p>
    </section>
  );
};

interface ControlSliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

const ControlSlider = ({ label, value, display, min, max, step, onChange }: ControlSliderProps) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <span className="text-xs text-primary font-mono">{display}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
  </div>
);

export default CostCalculator;
