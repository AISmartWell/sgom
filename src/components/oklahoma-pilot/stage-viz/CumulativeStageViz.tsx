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

const CumulativeStageViz = ({ well }: Props) => {
  const q0 = well.production_oil ?? 5;
  const D = 0.02 + Math.random() * 0.03; // decline rate 2-5%/mo

  const declineCurve = useMemo(() => {
    const points = [];
    let cumulative = 0;
    for (let m = 0; m <= 60; m++) {
      const q = q0 * Math.exp(-D * m);
      cumulative += q * 30; // barrels per month
      points.push({
        month: m,
        rate: +q.toFixed(2),
        cumulative: Math.round(cumulative),
      });
    }
    return points;
  }, [q0, D]);

  const totalReserves = declineCurve[declineCurve.length - 1]?.cumulative ?? 0;
  const depth = well.total_depth ?? 3500;
  const porosity = 0.12 + Math.random() * 0.08;
  const ioip = Math.round(depth * porosity * 7.758 * 0.5); // simplified volumetric

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Decline Curve */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <TrendingDown className="h-3.5 w-3.5 text-primary" />
          Decline Curve Analysis (60-month forecast)
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
            <p className="text-lg font-bold">{(D * 100).toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">Decline Rate/mo</p>
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
            <span className="font-medium">{(q0 * Math.exp(-D * 12)).toFixed(1)} bbl/d</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Rate @ 36 mo</span>
            <span className="font-medium">{(q0 * Math.exp(-D * 36)).toFixed(1)} bbl/d</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Rate @ 60 mo</span>
            <span className="font-medium">{(q0 * Math.exp(-D * 60)).toFixed(1)} bbl/d</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Porosity (est.)</span>
            <span className="font-medium">{(porosity * 100).toFixed(1)}%</span>
          </div>
          <div className="pt-1 border-t border-border/20">
            <Badge variant="outline" className={`text-[9px] ${D < 0.03 ? "text-success" : D < 0.04 ? "text-warning" : "text-destructive"}`}>
              {D < 0.03 ? "Slow Decline" : D < 0.04 ? "Moderate Decline" : "Rapid Decline"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CumulativeStageViz;
