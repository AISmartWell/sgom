import { useMemo, useState } from "react";
import { TrendingDown, BarChart3, Droplets, Database, DollarSign } from "lucide-react";
import { calcIOIP } from "@/lib/formation-db";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useProductionHistory } from "@/hooks/useProductionHistory";
import {
  DEFAULT_OIL_PRICE, DEFAULT_OPEX_PER_BBL,
  arpsRate as arpsRateShared, ARPS_DEFAULTS,
} from "@/lib/economics-config";

interface WellRecord {
  id?: string;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  formation?: string | null;
}

interface Props {
  well: WellRecord;
}

// Deterministic hash for stable values per well
function wellHash(oil: number, depth: number, salt: number): number {
  const x = Math.sin((oil * 9301 + depth * 49297 + salt * 233) % 65521) * 49297;
  return x - Math.floor(x);
}

// Generalized Arps decline: q(t) = qi / (1 + b * Di * t)^(1/b)
function arpsRate(qi: number, Di: number, b: number, t: number): number {
  if (b < 0.001) return qi * Math.exp(-Di * t);
  const denom = 1 + b * Di * t;
  if (denom <= 0) return 0;
  return qi / Math.pow(denom, 1 / b);
}

const CumulativeStageViz = ({ well }: Props) => {
  const q0 = well.production_oil ?? 5;
  const depth = well.total_depth ?? 3500;

  // Fetch real production history
  const { data: realHistory, isLoading, hasRealData } = useProductionHistory(well.id);

  // Deterministic synthetic parameters (fallback)
  const Di = useMemo(() => 0.02 + wellHash(q0, depth, 1) * 0.03, [q0, depth]);
  const b = useMemo(() => 0.3 + wellHash(q0, depth, 2) * 0.7, [q0, depth]);
  

  // Build chart data from real history or synthetic Arps
  const declineCurve = useMemo(() => {
    if (hasRealData && realHistory) {
      return realHistory.map((r) => ({
        month: r.month,
        rate: r.rate,
        cumulative: r.cumulative,
        label: r.date,
      }));
    }
    // Fallback: synthetic Arps
    const points = [];
    let cumulative = 0;
    for (let m = 0; m <= 60; m++) {
      const q = arpsRate(q0, Di, b, m);
      cumulative += q * 30;
      points.push({
        month: m,
        rate: +q.toFixed(2),
        cumulative: Math.round(cumulative),
        label: `Month ${m}`,
      });
    }
    return points;
  }, [hasRealData, realHistory, q0, Di, b]);

  const totalReserves = declineCurve[declineCurve.length - 1]?.cumulative ?? 0;
  const { ioip, params: ioipParams } = useMemo(() => calcIOIP(well.formation ?? null), [well.formation]);

  // Compute actual Di from real data (first vs last rate)
  const effectiveDi = useMemo(() => {
    if (hasRealData && realHistory && realHistory.length > 1) {
      const r0 = realHistory[0].rate;
      const rN = realHistory[realHistory.length - 1].rate;
      const n = realHistory.length - 1;
      if (r0 > 0 && rN > 0 && n > 0) {
        return +(Math.log(r0 / rN) / n).toFixed(4);
      }
    }
    return Di;
  }, [hasRealData, realHistory, Di]);

  const effectiveB = hasRealData ? null : b; // b-factor only meaningful for synthetic

  const peakRate = hasRealData && realHistory
    ? Math.max(...realHistory.map((r) => r.rate))
    : q0;

  // ── Economic Limit (editable parameters) ───────────────────────
  const [oilPrice, setOilPrice] = useState(DEFAULT_OIL_PRICE);
  const [opexPerBbl, setOpexPerBbl] = useState(DEFAULT_OPEX_PER_BBL);
  const [fixedMonthly, setFixedMonthly] = useState(1500);

  const econLimit = useMemo(() => {
    const netPerBbl = oilPrice - opexPerBbl;
    const calcEconRate = netPerBbl > 0 ? fixedMonthly / (netPerBbl * 30.44) : Infinity;
    const econRate = Math.max(calcEconRate, 1);

    const initRate = q0;
    const useDi = effectiveDi;
    const useB = hasRealData ? 0.5 : b;
    let econMonth: number | null = null;
    let econReserves = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (let m = 1; m <= 240; m++) {
      let rate: number;
      if (hasRealData && realHistory && m - 1 < realHistory.length) {
        rate = realHistory[m - 1].rate;
      } else {
        rate = arpsRate(initRate, useDi, useB, m);
      }
      if (rate <= 0) break;

      const monthlyOil = rate * 30.44;
      econReserves += monthlyOil;
      totalRevenue += monthlyOil * oilPrice;
      totalCost += monthlyOil * opexPerBbl + fixedMonthly;

      if (rate < econRate && !econMonth) {
        econMonth = m;
      }
    }

    const netProfit = totalRevenue - totalCost;
    return { econRate, econMonth, econReserves: Math.round(econReserves), netPerBbl, netProfit };
  }, [q0, effectiveDi, b, hasRealData, realHistory, oilPrice, opexPerBbl, fixedMonthly]);

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Decline Curve */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <TrendingDown className="h-3.5 w-3.5 text-primary" />
          {hasRealData ? (
            <>
              Production History ({realHistory!.length} months)
              <Badge variant="outline" className="text-[9px] text-success border-success/30 ml-1">
                <Database className="h-2.5 w-2.5 mr-0.5" />REAL DATA
              </Badge>
            </>
          ) : (
            <>
              Arps Decline Curve (60-month{effectiveB !== null ? `, b=${effectiveB.toFixed(2)}` : ""})
              <Badge variant="outline" className="text-[9px] text-warning border-warning/30 ml-1">
                SYNTHETIC
              </Badge>
            </>
          )}
          {isLoading && <span className="text-muted-foreground animate-pulse">Loading...</span>}
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={declineCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} label={{ value: hasRealData ? "Months" : "Months", position: "insideBottom", offset: -2, fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} label={{ value: "bbl/d", angle: -90, position: "insideLeft", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(v: number, name: string) => [
                  name === "rate" ? `${v} bbl/d` : `${v.toLocaleString()} bbl`,
                  name === "rate" ? "Production Rate" : "Cumulative",
                ]}
                labelFormatter={(label) => {
                  const point = declineCurve.find((p) => p.month === label);
                  return point?.label || `Month ${label}`;
                }}
              />
              {!hasRealData && (
                <ReferenceLine y={econLimit.econRate} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Econ. Limit (${econLimit.econRate.toFixed(1)} bbl/d)`, fontSize: 9, fill: "hsl(var(--destructive))" }} />
              )}
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reserve Estimates */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          Reserve Estimates
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold text-primary">{(totalReserves / 1000).toFixed(1)}K</p>
            <p className="text-[9px] text-muted-foreground">{hasRealData ? "Cum. Prod (bbl)" : "EUR (bbl)"}</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold text-warning">{(ioip / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">IOIP (bbl)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">{(effectiveDi * 100).toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">Di (nominal/mo)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">{totalReserves > 0 ? Math.min((totalReserves / ioip) * 100, 100).toFixed(1) : 0}%</p>
            <p className="text-[9px] text-muted-foreground">Recovery Factor</p>
          </div>
        </div>
      </div>

      {/* Production Profile */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Droplets className="h-3.5 w-3.5 text-primary" />
          Production Profile
        </div>
        <div className="space-y-2">
          {hasRealData && realHistory ? (
            <>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Peak Rate</span>
                <span className="font-medium">{peakRate.toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">First Month</span>
                <span className="font-medium">{realHistory[0].rate.toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Last Month</span>
                <span className="font-medium">{realHistory[realHistory.length - 1].rate.toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Months of Data</span>
                <span className="font-medium">{realHistory.length}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Effective Di</span>
                <span className="font-medium">{(effectiveDi * 100).toFixed(1)}%/mo</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Porosity (φ)</span>
                <span className="font-medium">{(ioipParams.phi * 100).toFixed(1)}%</span>
              </div>
              <div className="pt-1 border-t border-border/20">
                <Badge variant="outline" className="text-[9px] text-success">
                  Historical Decline
                </Badge>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Initial Rate (q₀)</span>
                <span className="font-medium">{q0.toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Rate @ 12 mo</span>
                <span className="font-medium">{arpsRate(q0, Di, b, 12).toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Rate @ 36 mo</span>
                <span className="font-medium">{arpsRate(q0, Di, b, 36).toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Rate @ 60 mo</span>
                <span className="font-medium">{arpsRate(q0, Di, b, 60).toFixed(1)} bbl/d</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Arps b-factor</span>
                <span className="font-medium">{b.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Porosity (φ)</span>
                <span className="font-medium">{(ioipParams.phi * 100).toFixed(1)}%</span>
              </div>
              <div className="pt-1 border-t border-border/20">
                <Badge variant="outline" className={`text-[9px] ${b > 0.7 ? "text-warning" : b > 0.5 ? "text-primary" : "text-success"}`}>
                  {b < 0.3 ? "Exponential" : b < 0.7 ? "Hyperbolic" : "Harmonic"} Decline
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Economic Limit */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <DollarSign className="h-3.5 w-3.5 text-primary" />
          Economic Limit
        </div>
        {/* Inline editable params */}
        <div className="flex flex-wrap gap-3 text-[10px]">
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">Oil $/bbl:</span>
            <input
              type="number"
              value={oilPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 0 && v <= 300) setOilPrice(v);
              }}
              className="w-14 h-5 px-1 text-[10px] rounded border border-border bg-background text-foreground text-center"
              min={0}
              max={300}
              step={1}
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">OPEX $/bbl:</span>
            <input
              type="number"
              value={opexPerBbl}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 0 && v <= 200) setOpexPerBbl(v);
              }}
              className="w-14 h-5 px-1 text-[10px] rounded border border-border bg-background text-foreground text-center"
              min={0}
              max={200}
              step={0.5}
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">Fixed $/mo:</span>
            <input
              type="number"
              value={fixedMonthly}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 0 && v <= 50000) setFixedMonthly(v);
              }}
              className="w-16 h-5 px-1 text-[10px] rounded border border-border bg-background text-foreground text-center"
              min={0}
              max={50000}
              step={100}
            />
          </label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold text-destructive">{econLimit.econRate.toFixed(1)}</p>
            <p className="text-[9px] text-muted-foreground">q_econ (bbl/d)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold text-primary">
              {econLimit.econMonth ? econLimit.econMonth : ">240"}
            </p>
            <p className="text-[9px] text-muted-foreground">Econ. Life (mo)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">{(econLimit.econReserves / 1000).toFixed(1)}K</p>
            <p className="text-[9px] text-muted-foreground">Econ. EUR (bbl)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className={`text-lg font-bold ${econLimit.netProfit > 0 ? "text-success" : "text-destructive"}`}>
              ${(econLimit.netProfit / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-muted-foreground">Net Profit</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {econLimit.netProfit <= 0 ? (
            <Badge variant="destructive" className="text-[9px]">Uneconomic</Badge>
          ) : econLimit.econMonth && econLimit.econMonth < 24 ? (
            <Badge variant="outline" className="text-[9px] text-warning border-warning/30">Short Life</Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] text-success border-success/30">Viable</Badge>
          )}
          <span className="text-[9px] text-muted-foreground">
            Margin: ${econLimit.netPerBbl.toFixed(1)}/bbl
          </span>
        </div>
      </div>
    </div>
  );
};

export default CumulativeStageViz;
