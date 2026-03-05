import { useMemo } from "react";
import { TrendingDown, BarChart3, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface WellRecord {
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
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
// b=0 → exponential, 0<b<1 → hyperbolic, b=1 → harmonic
function arpsRate(qi: number, Di: number, b: number, t: number): number {
  if (b < 0.001) return qi * Math.exp(-Di * t);
  const denom = 1 + b * Di * t;
  if (denom <= 0) return 0;
  return qi / Math.pow(denom, 1 / b);
}

const CumulativeStageViz = ({ well }: Props) => {
  const q0 = well.production_oil ?? 5;
  const depth = well.total_depth ?? 3500;

  // Deterministic parameters derived from well data
  const Di = useMemo(() => 0.02 + wellHash(q0, depth, 1) * 0.03, [q0, depth]);
  const b = useMemo(() => 0.3 + wellHash(q0, depth, 2) * 0.7, [q0, depth]);
  const porosity = useMemo(() => 0.12 + wellHash(q0, depth, 3) * 0.08, [q0, depth]);

  const declineCurve = useMemo(() => {
    const points = [];
    let cumulative = 0;
    for (let m = 0; m <= 60; m++) {
      const q = arpsRate(q0, Di, b, m);
      cumulative += q * 30;
      points.push({
        month: m,
        rate: +q.toFixed(2),
        cumulative: Math.round(cumulative),
      });
    }
    return points;
  }, [q0, Di, b]);

  const totalReserves = declineCurve[declineCurve.length - 1]?.cumulative ?? 0;
  const ioip = Math.round(depth * porosity * 7.758 * 0.5);

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Decline Curve */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <TrendingDown className="h-3.5 w-3.5 text-primary" />
          Arps Decline Curve (60-month, b={b.toFixed(2)})
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={declineCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Months", position: "insideBottom", offset: -2, fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
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
              />
              <ReferenceLine y={q0 * 0.3} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "Economic Limit", fontSize: 9, fill: "hsl(var(--destructive))" }} />
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
            <p className="text-[9px] text-muted-foreground">EUR (bbl)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold text-warning">{(ioip / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">IOIP (bbl)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">{(Di * 100).toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">Di (nominal/mo)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">{totalReserves > 0 ? ((totalReserves / ioip) * 100).toFixed(1) : 0}%</p>
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
            <span className="text-muted-foreground">Porosity (est.)</span>
            <span className="font-medium">{(porosity * 100).toFixed(1)}%</span>
          </div>
          <div className="pt-1 border-t border-border/20">
            <Badge variant="outline" className={`text-[9px] ${b > 0.7 ? "text-warning" : b > 0.5 ? "text-primary" : "text-success"}`}>
              {b < 0.3 ? "Exponential" : b < 0.7 ? "Hyperbolic" : "Harmonic"} Decline
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CumulativeStageViz;
