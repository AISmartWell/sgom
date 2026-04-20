import { useMemo, useState } from "react";

/* ── Model constants ── */
const TARGETS = { explorer: 40, professional: 55, enterprise: 70 } as const;
const COST_PER_WELL = 42; // USD — infra + AI compute per well
const FIXED_COSTS = { explorer: 800, professional: 2200, enterprise: 4800 } as const;

type Tier = "explorer" | "professional" | "enterprise";
const TIERS: Tier[] = ["explorer", "professional", "enterprise"];

const TIER_ACCENT: Record<Tier, string> = {
  explorer: "hsl(210 65% 57%)",
  professional: "hsl(38 92% 50%)",
  enterprise: "hsl(173 80% 42%)",
};

interface Prices {
  sub: number;
  perWell: number;
}

function calcMargin(sub: number, perWell: number, wells: number, tier: Tier) {
  const cappedPerWell = Math.min(perWell * wells, sub); // usage capped at base sub
  const revenue = sub + cappedPerWell;
  const varCost = wells * COST_PER_WELL;
  const fixCost = FIXED_COSTS[tier];
  const totalCost = varCost + fixCost;
  const margin = ((revenue - totalCost) / revenue) * 100;
  const capHit = perWell * wells > sub;
  return { revenue, totalCost, margin, capHit, cappedPerWell };
}

function solveSubscription(targetMargin: number, perWell: number, wells: number, tier: Tier) {
  const fixCost = FIXED_COSTS[tier];
  const varCost = wells * COST_PER_WELL;
  const neededRevenue = (fixCost + varCost) / (1 - targetMargin / 100);
  let sub = Math.ceil(neededRevenue / 2 / 100) * 100;
  const check = calcMargin(sub, perWell, wells, tier);
  if (Math.abs(check.margin - targetMargin) > 2) {
    sub = Math.ceil((neededRevenue - perWell * wells) / 100) * 100;
  }
  return Math.max(sub, 1000);
}

function solvePerWell(targetMargin: number, sub: number, wells: number, tier: Tier) {
  const fixCost = FIXED_COSTS[tier];
  const varCost = wells * COST_PER_WELL;
  const neededRevenue = (fixCost + varCost) / (1 - targetMargin / 100);
  if (neededRevenue <= sub) return 20;
  const neededCapped = neededRevenue - sub;
  const pw = Math.ceil(Math.min(neededCapped, sub) / wells / 5) * 5;
  return Math.max(pw, 20);
}

const PricingOptimizer = () => {
  const [wells, setWells] = useState(200);
  const [prices, setPrices] = useState<Record<Tier, Prices>>({
    explorer: { sub: 3200, perWell: 350 },
    professional: { sub: 9600, perWell: 200 },
    enterprise: { sub: 24000, perWell: 120 },
  });

  const results = useMemo(
    () =>
      Object.fromEntries(
        TIERS.map((t) => [t, calcMargin(prices[t].sub, prices[t].perWell, wells, t)])
      ) as Record<Tier, ReturnType<typeof calcMargin>>,
    [prices, wells]
  );

  const optimal = useMemo(
    () =>
      Object.fromEntries(
        TIERS.map((t) => {
          const target = TARGETS[t];
          const subOnly = {
            sub: solveSubscription(target, prices[t].perWell, wells, t),
            perWell: prices[t].perWell,
          };
          const pwOnly = {
            sub: prices[t].sub,
            perWell: solvePerWell(target, prices[t].sub, wells, t),
          };
          const combined = {
            sub: solveSubscription(target, pwOnly.perWell, wells, t),
            perWell: pwOnly.perWell,
          };
          return [t, { subOnly, pwOnly, combined, target }];
        })
      ) as Record<Tier, { subOnly: Prices; pwOnly: Prices; combined: Prices; target: number }>,
    [prices, wells]
  );

  const update = (tier: Tier, field: keyof Prices, val: number) => {
    setPrices((p) => ({ ...p, [tier]: { ...p[tier], [field]: val } }));
  };

  const applyOptimal = (tier: Tier, approach: "subOnly" | "pwOnly" | "combined") => {
    setPrices((p) => ({ ...p, [tier]: optimal[tier][approach] }));
  };

  const portfolioRevenue = Object.values(results).reduce((a, r) => a + r.revenue, 0);

  const barColor = (m: number, target: number) =>
    m >= target ? "hsl(var(--success, 142 71% 45%))" : m >= target * 0.85 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";

  return (
    <section className="py-16">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-border flex items-baseline gap-4 flex-wrap">
        <h2 className="text-2xl md:text-3xl font-bold tracking-[0.15em] text-primary uppercase">
          Pricing Optimizer
        </h2>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Margin Engineering · Targets 40 / 55 / 70%
        </p>
      </div>

      {/* Global controls */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Wells / Month (Client Volume)
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">{wells}</div>
          <div className="text-xs text-muted-foreground mt-1">wells per month</div>
          <input
            type="range"
            min={20}
            max={1000}
            step={10}
            value={wells}
            onChange={(e) => setWells(+e.target.value)}
            className="w-full mt-3 accent-primary"
          />
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Cost to Serve / Well
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">${COST_PER_WELL}</div>
          <div className="text-xs text-muted-foreground mt-1">infra + AI compute</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Total Portfolio Revenue
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">
            ${(portfolioRevenue / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-muted-foreground mt-1">all three tiers / month</div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {TIERS.map((t) => {
          const r = results[t];
          const target = TARGETS[t];
          const accent = TIER_ACCENT[t];
          const pct = Math.min(100, Math.max(0, r.margin));
          const targetPct = Math.min(100, target);
          const hit = r.margin >= target;
          return (
            <div key={t} className="bg-card border border-border p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
              <h3
                className="text-lg font-bold tracking-[0.15em] uppercase mb-3"
                style={{ color: accent }}
              >
                {t}
              </h3>

              {/* Margin bar */}
              <div className="relative mb-4">
                <div className="h-1.5 bg-muted">
                  <div
                    className="h-1.5 transition-all"
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

              {/* Sliders */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] uppercase tracking-wide mb-1.5">
                  <span className="text-foreground">Subscription</span>
                  <span className="text-primary font-semibold">
                    ${prices[t].sub.toLocaleString()}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={100}
                  value={prices[t].sub}
                  onChange={(e) => update(t, "sub", +e.target.value)}
                  className="w-full accent-primary"
                />
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-[10px] uppercase tracking-wide mb-1.5">
                  <span className="text-foreground">Per-Well Rate</span>
                  <span className="text-primary font-semibold">${prices[t].perWell}/well</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={600}
                  step={5}
                  value={prices[t].perWell}
                  onChange={(e) => update(t, "perWell", +e.target.value)}
                  className="w-full accent-primary"
                />
              </div>

              {/* Metrics */}
              <div className="space-y-1.5 text-xs mb-3">
                {[
                  ["Revenue / mo", `$${r.revenue.toLocaleString()}`, "text-foreground"],
                  ["Cost / mo", `$${r.totalCost.toLocaleString()}`, "text-destructive"],
                  [
                    "Cap triggered?",
                    r.capHit ? "YES ⚠" : "No",
                    r.capHit ? "text-warning" : "text-primary",
                  ],
                  [
                    "Per-well actual",
                    `$${(r.cappedPerWell / wells).toFixed(0)}/well`,
                    r.capHit ? "text-warning" : "text-foreground",
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
                className={`inline-block text-[10px] uppercase tracking-[0.15em] px-2 py-1 border ${
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
      <div className="space-y-6">
        {TIERS.map((t) => {
          const o = optimal[t];
          const cur = results[t];
          const target = TARGETS[t];
          const accent = TIER_ACCENT[t];
          return (
            <div key={t} className="bg-card border border-border p-5">
              <h3
                className="text-xs uppercase tracking-[0.2em] mb-4 pb-2 border-b border-border"
                style={{ color: accent }}
              >
                <span className="font-bold">{t.toUpperCase()}</span>
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
                      <td className="py-2 px-2 text-right">${prices[t].sub.toLocaleString()}</td>
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
                    {([
                      { label: "A", desc: "↑ Subscription only", approach: "subOnly" as const },
                      { label: "B", desc: "↑ Per-well rate only", approach: "pwOnly" as const },
                      { label: "C", desc: "Balanced: both levers", approach: "combined" as const },
                    ]).map(({ label, desc, approach }) => {
                      const opt = o[approach];
                      const optR = calcMargin(opt.sub, opt.perWell, wells, t);
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
                                  opt.sub > prices[t].sub ? "text-primary" : "text-destructive"
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
                              className="text-[10px] uppercase tracking-wider px-2 py-1 border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
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

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-3xl mx-auto">
        Per-well usage revenue is capped at the base subscription value. Margin = (Revenue − Fixed −
        Variable) / Revenue. Fixed costs cover infra, support and account management; variable cost
        is ${COST_PER_WELL}/well of compute & data.
      </p>
    </section>
  );
};

export default PricingOptimizer;
