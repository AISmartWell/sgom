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
  calibration?: {
    source?: "calibrated" | "outcomes" | "default";
    scope?: string;
    arps_b?: number;
    arps_di?: number;
    spt_multiplier?: number;
    sample_count?: number;
    outcomes_used?: number;
    historical_mape_pct?: number | null;
    confidence?: number;
    notes?: string[];
  };
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
  const cal = forecast.calibration;
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
          {cal && (
            <Badge
              variant="outline"
              className={
                cal.source === "default"
                  ? "border-muted-foreground/40 text-muted-foreground"
                  : "border-emerald-500/40 text-emerald-400"
              }
            >
              {cal.source === "default"
                ? "Uncalibrated baseline"
                : `Learned on ${cal.outcomes_used ?? 0} real work orders`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Rate now (baseline)" value={`${s.q0_baseline ?? "—"} BOPD`} />
          <Metric label="Rate after SPT (P50)" value={`${s.q0_spt} BOPD`} accent />
          <Metric label={`Cum P50 · ${s.months} mo`} value={`${s.cum_p50_bbl.toLocaleString()} bbl`} />

          <Metric label="Incremental uplift" value={`+${s.uplift_bbl.toLocaleString()} bbl`} accent />
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <Metric label="P10 cumulative" value={`${s.cum_p10_bbl.toLocaleString()} bbl`} />
          <Metric label="P50 cumulative" value={`${s.cum_p50_bbl.toLocaleString()} bbl`} />
          <Metric label="P90 cumulative" value={`${s.cum_p90_bbl.toLocaleString()} bbl`} />
        </div>

        {cal && cal.source !== "default" && (
          <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2">
            <div className="text-xs font-medium text-emerald-400">
              Forecast calibrated on registry outcomes
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
              <CalStat label="Scope" value={cal.scope ?? "—"} />
              <CalStat label="SPT multiplier" value={cal.spt_multiplier?.toFixed(3) ?? "—"} />
              <CalStat label="Decline Di" value={cal.arps_di?.toFixed(4) ?? "—"} />
              <CalStat
                label="Historical MAPE"
                value={cal.historical_mape_pct != null ? `${cal.historical_mape_pct}%` : "n/a"}
              />
            </div>
            {cal.notes?.length ? (
              <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
                {cal.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

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

function CalStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
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
