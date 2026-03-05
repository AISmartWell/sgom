import { useMemo } from "react";
import { DollarSign, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

interface WellRecord {
  production_oil: number | null;
  water_cut: number | null;
  total_depth: number | null;
}

interface Props {
  well: WellRecord;
}

const OIL_PRICE = 72;

const EconomicStageViz = ({ well }: Props) => {
  const oil = well.production_oil ?? 5;
  const wc = well.water_cut ?? 30;
  const depth = well.total_depth ?? 3500;

  const economics = useMemo(() => {
    const capex = 25000 + depth * 2 + (wc > 40 ? 5000 : 0);
    const sptGain = 15 + (25 - Math.min(oil, 25)) * 0.4 * (wc >= 20 && wc <= 60 ? 1.2 : 0.7);
    const opexPerBbl = 12 + (wc > 50 ? 4 : 0);
    const dailyRevenue = sptGain * OIL_PRICE;
    const dailyCost = sptGain * opexPerBbl;
    const dailyProfit = dailyRevenue - dailyCost;
    const annualProfit = dailyProfit * 365;
    const paybackMonths = dailyProfit > 0 ? capex / (dailyProfit * 30) : 999;
    const fiveYearProfit = annualProfit * 5 - capex;
    const roi = capex > 0 ? (fiveYearProfit / capex) * 100 : 0;
    const npv = fiveYearProfit * 0.85; // simplified 10% discount

    return { capex, sptGain, opexPerBbl, dailyRevenue, dailyCost, dailyProfit, annualProfit, paybackMonths, fiveYearProfit, roi, npv };
  }, [oil, wc, depth]);

  // Waterfall data
  const waterfallData = useMemo(() => [
    { name: "Revenue\n(5yr)", value: economics.dailyRevenue * 365 * 5, fill: "positive" },
    { name: "OPEX\n(5yr)", value: -(economics.dailyCost * 365 * 5), fill: "negative" },
    { name: "CAPEX", value: -economics.capex, fill: "negative" },
    { name: "Net\nProfit", value: economics.fiveYearProfit, fill: economics.fiveYearProfit > 0 ? "positive" : "negative" },
  ], [economics]);

  const roiRating = economics.roi >= 200 ? "Strong" : economics.roi >= 100 ? "Good" : economics.roi >= 0 ? "Marginal" : "Negative";
  const roiColor = economics.roi >= 200 ? "text-success" : economics.roi >= 100 ? "text-warning" : "text-destructive";

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Waterfall Chart */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <DollarSign className="h-3.5 w-3.5 text-primary" />
          5-Year Economic Projection (@ ${OIL_PRICE}/bbl)
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.fill === "positive" ? "hsl(var(--success, 142 76% 36%))" : "hsl(var(--destructive))"}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Key Financial Metrics
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className={`text-lg font-bold ${roiColor}`}>{economics.roi.toFixed(0)}%</p>
            <p className="text-[9px] text-muted-foreground">5-Year ROI</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold text-primary">${(economics.npv / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">NPV (10%)</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">${(economics.capex / 1000).toFixed(1)}K</p>
            <p className="text-[9px] text-muted-foreground">CAPEX</p>
          </div>
          <div className="p-2 bg-muted/20 rounded text-center">
            <p className="text-lg font-bold">${(economics.annualProfit / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-muted-foreground">Annual Profit</p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[9px] ${roiColor}`}>{roiRating} Investment</Badge>
      </div>

      {/* Payback Timeline */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Payback Timeline
        </div>
        <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${economics.paybackMonths <= 6 ? "bg-success/60" : economics.paybackMonths <= 12 ? "bg-warning/60" : "bg-destructive/60"}`}
            style={{ width: `${Math.min((economics.paybackMonths / 24) * 100, 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {economics.paybackMonths < 999 ? `${economics.paybackMonths.toFixed(1)} months` : "N/A"}
          </div>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">SPT Gain</span>
            <span className="font-medium">+{economics.sptGain.toFixed(1)} bbl/d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Revenue</span>
            <span className="font-medium text-success">${economics.dailyRevenue.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily OPEX</span>
            <span className="font-medium text-destructive">-${economics.dailyCost.toFixed(0)}</span>
          </div>
          <div className="flex justify-between border-t border-border/20 pt-1">
            <span className="text-muted-foreground">Daily Profit</span>
            <span className={`font-bold ${economics.dailyProfit > 0 ? "text-success" : "text-destructive"}`}>
              ${economics.dailyProfit.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicStageViz;
