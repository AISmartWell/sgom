import { useMemo } from "react";
import { DollarSign, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  DEFAULT_OIL_PRICE, DEFAULT_OPEX_PER_BBL, DEFAULT_TREATMENT_COST,
  sptGainByWaterCut, ROI_THRESHOLDS, ARPS_DEFAULTS, arpsRate, calcFiveYearROI, calcNPV,
} from "@/lib/economics-config";

interface WellRecord {
  production_oil: number | null;
  water_cut: number | null;
  total_depth: number | null;
}

interface Props {
  well: WellRecord;
}

const EconomicStageViz = ({ well }: Props) => {
  const wc = well.water_cut ?? 30;

  const economics = useMemo(() => {
    const capex = DEFAULT_TREATMENT_COST;
    const sptGain = sptGainByWaterCut(wc);
    const opex = DEFAULT_OPEX_PER_BBL;
    const oilPrice = DEFAULT_OIL_PRICE;

    // Unified Arps-based calculation
    const { roi, fiveYearNet, paybackMonths } = calcFiveYearROI(
      sptGain, oilPrice, opex, capex, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b
    );

    // Initial daily values (month 1) for display
    const initialRate = arpsRate(sptGain, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, 1);
    const dailyRevenue = initialRate * oilPrice;
    const dailyCost = initialRate * opex;
    const dailyProfit = dailyRevenue - dailyCost;

    // Annual profit (year 1 with decline)
    let annualProfit = 0;
    for (let m = 1; m <= 12; m++) {
      const rate = arpsRate(sptGain, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
      annualProfit += rate * 30.44 * (oilPrice - opex);
    }

    // 5-year revenue and opex for waterfall chart
    let totalRevenue5yr = 0;
    let totalOpex5yr = 0;
    for (let m = 1; m <= 60; m++) {
      const rate = arpsRate(sptGain, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b, m);
      totalRevenue5yr += rate * 30.44 * oilPrice;
      totalOpex5yr += rate * 30.44 * opex;
    }

    const npv = calcNPV(sptGain, oilPrice, opex, capex, 0.10, ARPS_DEFAULTS.Di, ARPS_DEFAULTS.b);

    return {
      capex, sptGain, dailyRevenue, dailyCost, dailyProfit,
      annualProfit, paybackMonths, fiveYearProfit: fiveYearNet - capex,
      roi, npv, totalRevenue5yr, totalOpex5yr,
    };
  }, [wc]);

  // Waterfall data
  const waterfallData = useMemo(() => [
    { name: "Revenue\n(5yr)", value: economics.totalRevenue5yr, fill: "positive" },
    { name: "OPEX\n(5yr)", value: -economics.totalOpex5yr, fill: "negative" },
    { name: "CAPEX", value: -economics.capex, fill: "negative" },
    { name: "Net\nProfit", value: economics.fiveYearProfit, fill: economics.fiveYearProfit > 0 ? "positive" : "negative" },
  ], [economics]);

  const roiRating = economics.roi >= ROI_THRESHOLDS.strong ? "Strong" : economics.roi >= ROI_THRESHOLDS.good ? "Good" : economics.roi >= 0 ? "Marginal" : "Negative";
  const roiColor = economics.roi >= ROI_THRESHOLDS.strong ? "text-success" : economics.roi >= ROI_THRESHOLDS.good ? "text-warning" : "text-destructive";

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Waterfall Chart */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <DollarSign className="h-3.5 w-3.5 text-primary" />
          5-Year Economic Projection (@ ${DEFAULT_OIL_PRICE}/bbl, Arps Decline)
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
            <p className="text-[9px] text-muted-foreground">Annual Profit (Y1)</p>
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
            {economics.paybackMonths < 999 ? `${economics.paybackMonths} months` : "N/A"}
          </div>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">SPT Gain (initial)</span>
            <span className="font-medium">+{economics.sptGain.toFixed(1)} bbl/d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Revenue (M1)</span>
            <span className="font-medium text-success">${economics.dailyRevenue.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily OPEX (M1)</span>
            <span className="font-medium text-destructive">-${economics.dailyCost.toFixed(0)}</span>
          </div>
          <div className="flex justify-between border-t border-border/20 pt-1">
            <span className="text-muted-foreground">Daily Profit (M1)</span>
            <span className={`font-bold ${economics.dailyProfit > 0 ? "text-success" : "text-destructive"}`}>
              ${economics.dailyProfit.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/70 italic">
            <span>Model</span>
            <span>Arps (Di={ARPS_DEFAULTS.Di}, b={ARPS_DEFAULTS.b})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicStageViz;
