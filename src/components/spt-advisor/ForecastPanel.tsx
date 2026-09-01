import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

export interface ForecastResult {
  well_id: string;
  baseline_no_treatment: number[];
  spt_p10: number[];
  spt_p50: number[];
  spt_p90: number[];
  cumulative_uplift_bbl: number;
}

export function summarizeForecast(f: ForecastResult | null | undefined) {
  if (!f?.spt_p50?.length) return null;
  const sum = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) * 30);
  return {
    months: f.spt_p50.length,
    q0_baseline: f.baseline_no_treatment?.[0] ?? null,
    q0_spt: f.spt_p50[0],
    qend_spt: f.spt_p50[f.spt_p50.length - 1],
    cum_baseline_bbl: sum(f.baseline_no_treatment ?? []),
    cum_p10_bbl: sum(f.spt_p10 ?? []),
    cum_p50_bbl: sum(f.spt_p50),
    cum_p90_bbl: sum(f.spt_p90 ?? []),
    uplift_bbl: f.cumulative_uplift_bbl,
  };
}

export default function ForecastPanel({ forecast, wellName }: { forecast: ForecastResult; wellName?: string }) {
  const s = summarizeForecast(forecast);
  if (!s) return null;

  const data = forecast.spt_p50.map((q, i) => ({
    month: i + 1,
    Baseline: forecast.baseline_no_treatment?.[i] ?? null,
    P10: forecast.spt_p10?.[i] ?? null,
    P50: q,
    P90: forecast.spt_p90?.[i] ?? null,
  }));

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-primary" /> Production forecast
          {wellName && <Badge variant="outline">{wellName}</Badge>}
          <Badge className="bg-primary/20 text-primary border-primary/30">Arps + SPT uplift · {s.months} mo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Rate now (baseline)" value={`${s.q0_baseline ?? "—"} BOPD`} />
          <Metric label="Rate after SPT (P50)" value={`${s.q0_spt} BOPD`} accent />
          <Metric label="Cum P50, 
 24 mo" value={`${s.cum_p50_bbl.toLocaleString()} bbl`} />
          <Metric label="Incremental uplift" value={`+${s.uplift_bbl.toLocaleString()} bbl`} accent />
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <Metric label="P10 cumulative" value={`${s.cum_p10_bbl.toLocaleString()} bbl`} />
          <Metric label="P50 cumulative" value={`${s.cum_p50_bbl.toLocaleString()} bbl`} />
          <Metric label="P90 cumulative" value={`${s.cum_p90_bbl.toLocaleString()} bbl`} />
        </div>

        <div className="h-[280px] w-full" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11}
                label={{ value: "Month", position: "insideBottom", offset: -4, fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}
                label={{ value: "BOPD", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Baseline" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="P10" stroke="hsl(var(--destructive))" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="P50" stroke="hsl(var(--primary))" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="P90" stroke="hsl(var(--chart-2, var(--primary)))" dot={false} strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-3 rounded-md bg-muted/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
