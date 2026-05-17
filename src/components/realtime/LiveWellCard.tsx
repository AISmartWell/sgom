import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplets, Gauge, Radio, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LiveWellCardProps {
  wellId?: string;
  wellName?: string;
  baseRate?: number; // bbl/day
  basePressure?: number; // psi
  baseWaterCut?: number; // %
  intervalMs?: number;
  maxPoints?: number;
}

interface Point {
  t: number;
  label: string;
  rate: number;
  pressure: number;
  waterCut: number;
}

// Seeded variance for stable demo behaviour
const variance = (value: number, range: number) =>
  value + (Math.random() - 0.5) * range;

export const LiveWellCard = ({
  wellId = "W-001",
  wellName = "Anadarko-Alpha",
  baseRate = 182,
  basePressure = 2780,
  baseWaterCut = 24,
  intervalMs = 2000,
  maxPoints = 60,
}: LiveWellCardProps) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [live, setLive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!live) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const tick = () => {
      setPoints((prev) => {
        const now = new Date();
        const next: Point = {
          t: now.getTime(),
          label: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          rate: Math.max(0, Math.round(variance(baseRate, 14) * 10) / 10),
          pressure: Math.max(0, Math.round(variance(basePressure, 60))),
          waterCut:
            Math.round(
              Math.max(0, Math.min(100, variance(baseWaterCut, 1.6))) * 10,
            ) / 10,
        };
        const arr = [...prev, next];
        return arr.length > maxPoints ? arr.slice(-maxPoints) : arr;
      });
    };
    tick();
    timerRef.current = setInterval(tick, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [live, baseRate, basePressure, baseWaterCut, intervalMs, maxPoints]);

  const current = points[points.length - 1];
  const previous = points[points.length - 2];

  const trend = useMemo(() => {
    if (!current || !previous) return 0;
    return current.rate - previous.rate;
  }, [current, previous]);

  const avgRate = useMemo(() => {
    if (!points.length) return 0;
    return (
      Math.round(
        (points.reduce((s, p) => s + p.rate, 0) / points.length) * 10,
      ) / 10
    );
  }, [points]);

  const status: { label: string; cls: string } = useMemo(() => {
    if (!current) return { label: "INIT", cls: "bg-muted text-muted-foreground" };
    if (current.waterCut > 50 || current.rate < baseRate * 0.6)
      return {
        label: "CRITICAL",
        cls: "bg-destructive/20 text-destructive border-destructive/40",
      };
    if (current.waterCut > 35 || current.rate < baseRate * 0.8)
      return {
        label: "WARNING",
        cls: "bg-warning/20 text-warning border-warning/40",
      };
    return {
      label: "ACTIVE",
      cls: "bg-success/20 text-success border-success/40",
    };
  }, [current, baseRate]);

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              {wellName}
            </CardTitle>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {wellId} · Telemetry stream
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={status.cls}>
              {status.label}
            </Badge>
            <button
              onClick={() => setLive((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Radio
                className={`h-3 w-3 ${live ? "text-success animate-pulse" : ""}`}
              />
              {live ? "LIVE" : "PAUSED"}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric tiles */}
        <div className="grid grid-cols-3 gap-3">
          <MetricTile
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Oil Rate"
            value={current ? current.rate.toFixed(1) : "—"}
            unit="bbl/d"
            trend={trend}
            accent="text-primary"
          />
          <MetricTile
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Pressure"
            value={current ? current.pressure.toLocaleString() : "—"}
            unit="psi"
            accent="text-accent-foreground"
          />
          <MetricTile
            icon={<Droplets className="h-3.5 w-3.5" />}
            label="Water Cut"
            value={current ? current.waterCut.toFixed(1) : "—"}
            unit="%"
            accent={
              current && current.waterCut > 35
                ? "text-warning"
                : "text-foreground"
            }
          />
        </div>

        {/* Live chart */}
        <div className="rounded-lg border border-border/40 bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Oil rate · last {points.length}/{maxPoints} samples</span>
            <span>
              Avg <span className="font-mono text-foreground">{avgRate}</span> bbl/d
            </span>
          </div>
          <div className="h-[180px] w-full" style={{ minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value: number) => [`${value} bbl/d`, "Oil rate"]}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#rateGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Demo telemetry · {intervalMs / 1000}s tick · would be replaced by SCADA / MQTT stream via{" "}
          <span className="font-mono">well_telemetry</span> in production.
        </p>
      </CardContent>
    </Card>
  );
};

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: number;
  accent?: string;
}

const MetricTile = ({ icon, label, value, unit, trend, accent }: MetricTileProps) => (
  <div className="rounded-lg border border-border/40 bg-background/40 p-3">
    <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`font-mono text-2xl font-semibold ${accent ?? ""}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
    {typeof trend === "number" && trend !== 0 && (
      <div
        className={`mt-1 flex items-center gap-1 text-[11px] ${
          trend > 0 ? "text-success" : "text-destructive"
        }`}
      >
        {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {trend > 0 ? "+" : ""}
        {trend.toFixed(1)} vs prev
      </div>
    )}
  </div>
);

export default LiveWellCard;
