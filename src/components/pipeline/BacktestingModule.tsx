import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart, BarChart, Bar, ReferenceLine,
} from "recharts";
import {
  Target, TrendingUp, AlertTriangle, CheckCircle2, BarChart3,
} from "lucide-react";
import { useProductionHistory, ProductionRecord } from "@/hooks/useProductionHistory";

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
  dataSource?: string;
}

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  formation: string | null;
  [key: string]: any;
}

interface Props {
  well: WellRecord;
  completedStages: Map<string, StageResult>;
}

// Generate Arps decline prediction to compare against actuals
function generateArpsPrediction(
  qi: number,
  di: number,
  b: number,
  months: number
): { month: number; predicted: number; cumPredicted: number }[] {
  const points: { month: number; predicted: number; cumPredicted: number }[] = [];
  let cum = 0;
  for (let t = 0; t < months; t++) {
    const rate = qi / Math.pow(1 + b * di * t, 1 / b);
    const monthly = rate * 30;
    cum += monthly;
    points.push({ month: t, predicted: +rate.toFixed(2), cumPredicted: Math.round(cum) });
  }
  return points;
}

function extractNumeric(value: string): number | null {
  const match = value.replace(/,/g, "").match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

export const BacktestingModule = ({ well, completedStages }: Props) => {
  const { data: prodHistory, hasRealData } = useProductionHistory(well.id);

  const backtestData = useMemo(() => {
    if (!hasRealData || !prodHistory || prodHistory.length < 3) return null;

    const cumResult = completedStages.get("cumulative");
    const econResult = completedStages.get("economic");

    // Initial rate from first production record
    const qi = prodHistory[0].rate;
    if (qi <= 0) return null;

    // Fit effective decline rate from actual data
    const lastIdx = prodHistory.length - 1;
    const qf = prodHistory[lastIdx].rate;
    const nominalDi = qi > 0 && qf > 0 && qf < qi
      ? (qi - qf) / (qi * lastIdx) 
      : 0.025;
    const di = Math.max(0.005, Math.min(nominalDi, 0.15));
    const b = 0.5;

    const predictions = generateArpsPrediction(qi, di, b, prodHistory.length);

    // Merge actual vs predicted
    const merged = prodHistory.map((actual, i) => {
      const pred = predictions[i] || { predicted: 0, cumPredicted: 0 };
      return {
        month: i,
        date: actual.date,
        actual: actual.rate,
        predicted: pred.predicted,
        actualCum: actual.cumulative,
        predictedCum: pred.cumPredicted,
        error: actual.rate > 0 ? +((Math.abs(actual.rate - pred.predicted) / actual.rate) * 100).toFixed(1) : 0,
      };
    });

    // Accuracy metrics
    const totalError = merged.reduce((s, m) => s + (m.error as number), 0);
    const mape = +(totalError / merged.length).toFixed(1);
    const accuracy = +(100 - mape).toFixed(1);

    // Cumulative comparison
    const actualFinalCum = prodHistory[lastIdx].cumulative;
    const predictedFinalCum = predictions[lastIdx]?.cumPredicted || 0;
    const cumError = actualFinalCum > 0
      ? +((Math.abs(actualFinalCum - predictedFinalCum) / actualFinalCum) * 100).toFixed(1)
      : 0;

    // EUR from AI result
    let predictedEUR: number | null = null;
    if (cumResult) {
      const eurM = cumResult.metrics.find(m =>
        m.label.toLowerCase().includes("eur") || m.label.toLowerCase().includes("ultimate")
      );
      if (eurM) predictedEUR = extractNumeric(eurM.value);
    }

    // ROI predicted vs simple actual calc
    let predictedROI: number | null = null;
    if (econResult) {
      const roiM = econResult.metrics.find(m => m.label.toLowerCase().includes("roi"));
      if (roiM) predictedROI = extractNumeric(roiM.value);
    }

    return {
      merged,
      mape,
      accuracy,
      actualFinalCum,
      predictedFinalCum,
      cumError,
      months: prodHistory.length,
      qi,
      di: +(di * 100).toFixed(2),
      predictedEUR,
      predictedROI,
    };
  }, [prodHistory, hasRealData, completedStages]);

  if (!hasRealData || !backtestData) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium">Backtesting Unavailable</p>
            <p className="text-xs text-muted-foreground">
              Upload production history data to enable predicted vs. actual comparison and model accuracy assessment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const accColor = backtestData.accuracy >= 85
    ? "text-emerald-400"
    : backtestData.accuracy >= 70
      ? "text-amber-400"
      : "text-red-400";

  const accBg = backtestData.accuracy >= 85
    ? "bg-emerald-500/10 border-emerald-500/20"
    : backtestData.accuracy >= 70
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-red-500/10 border-red-500/20";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Backtesting: Predicted vs. Actual</h3>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
            {backtestData.months} months
          </Badge>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${accBg}`}>
          <span className="text-xs text-muted-foreground">Model Accuracy:</span>
          <span className={`text-sm font-bold ${accColor}`}>{backtestData.accuracy}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MAPE</p>
          <p className={`text-xl font-bold ${accColor}`}>{backtestData.mape}%</p>
          <p className="text-[10px] text-muted-foreground">Mean Abs. % Error</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cum. Error</p>
          <p className="text-xl font-bold text-primary">{backtestData.cumError}%</p>
          <p className="text-[10px] text-muted-foreground">Cumulative Deviation</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Initial Rate</p>
          <p className="text-xl font-bold">{backtestData.qi.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">bbl/d (qᵢ)</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Decline Rate</p>
          <p className="text-xl font-bold">{backtestData.di}%</p>
          <p className="text-[10px] text-muted-foreground">Dᵢ /month</p>
        </div>
      </div>

      {/* Rate Chart: Predicted vs Actual */}
      <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Daily Rate: Predicted vs. Actual (bbl/d)</h4>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={backtestData.merged} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Month", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "bbl/d", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v) => `Month ${v}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="hsl(var(--primary))" fill="url(#gradActual)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="predicted" name="Predicted (Arps)" stroke="#f59e0b" fill="url(#gradPredicted)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Chart */}
      <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Cumulative Production: Predicted vs. Actual (bbl)</h4>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={backtestData.merged} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v) => `Month ${v}`}
              formatter={(v: number) => [v.toLocaleString() + " bbl", ""]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="actualCum" name="Actual Cumulative" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="predictedCum" name="Predicted Cumulative" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Distribution */}
      <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Точность прогноза по месяцам (%)</h4>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={backtestData.merged.map(d => ({ ...d, accuracy: +(100 - (d.error as number)).toFixed(1) }))} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v) => `Month ${v}`}
            />
            <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: "90% target", fontSize: 10, fill: "#10b981" }} />
            <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(var(--primary))" opacity={0.7} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Backtesting Summary
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Actual Cumulative</p>
            <p className="font-semibold">{backtestData.actualFinalCum.toLocaleString()} bbl</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Predicted Cumulative</p>
            <p className="font-semibold">{backtestData.predictedFinalCum.toLocaleString()} bbl</p>
          </div>
          {backtestData.predictedEUR && (
            <div>
              <p className="text-muted-foreground text-xs">AI Predicted EUR</p>
              <p className="font-semibold text-primary">{backtestData.predictedEUR.toLocaleString()} bbl</p>
            </div>
          )}
          {backtestData.predictedROI && (
            <div>
              <p className="text-muted-foreground text-xs">AI Predicted ROI</p>
              <p className="font-semibold text-primary">{backtestData.predictedROI}%</p>
            </div>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground/70 pt-2 border-t border-border/30">
          <p>• Model: Arps Hyperbolic Decline (b={0.5}, Dᵢ={backtestData.di}%/mo)</p>
          <p>• MAPE (Mean Absolute Percentage Error) below 10% indicates excellent predictive accuracy</p>
          <p>• Predictions are validated against {backtestData.months} months of actual production records</p>
        </div>
      </div>
    </div>
  );
};
