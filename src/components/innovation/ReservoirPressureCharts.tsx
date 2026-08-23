import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart,
} from "recharts";

/**
 * Reservoir-pressure methodology charts (light / print-friendly panels).
 * Purely presentational — synthetic reference curves illustrating the four
 * independent estimation paths used by /dashboard/reservoir-pressure.
 */

const AXIS = { stroke: "#64748b", fontSize: 11 };
const GRID = "#e2e8f0";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  color: "#0f172a",
  fontSize: 12,
};

function ChartPanel({
  index,
  title,
  formula,
  children,
  note,
}: {
  index: number;
  title: string;
  formula: string;
  children: React.ReactNode;
  note: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-xs font-semibold text-sky-600">{index}</span>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      <p className="mb-3 font-mono text-[11px] text-slate-500">{formula}</p>
      <div className="h-[260px] w-full" style={{ minHeight: 260 }}>
        {children}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{note}</p>
    </div>
  );
}

const ReservoirPressureCharts = () => {
  const gradientData = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => {
        const depth = i * 250;
        return {
          depth,
          hydrostatic: +(0.433 * depth).toFixed(0),
          brine: +(0.465 * depth).toFixed(0),
          overburden: +(1.0 * depth).toFixed(0),
        };
      }),
    [],
  );

  const eatonData = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => {
        const depth = 500 + i * 125;
        const sv = 1.02 * depth;
        const pn = 0.465 * depth;
        const rnct = 2.0 * Math.exp(0.00022 * depth);
        const robs =
          depth > 3800
            ? rnct * Math.exp(-0.00045 * (depth - 3800))
            : rnct;
        const pp = sv - (sv - pn) * Math.pow(robs / rnct, 1.2);
        return {
          depth,
          sv: +sv.toFixed(0),
          pn: +pn.toFixed(0),
          pp: +pp.toFixed(0),
        };
      }),
    [],
  );

  const mbData = useMemo(() => {
    const eo = [0.004, 0.008, 0.013, 0.018, 0.024, 0.03, 0.037];
    const N = 3.2e6;
    const jitter = [1.01, 0.98, 1.02, 0.99, 1.0, 1.01, 0.99];
    return eo.map((x, i) => ({
      eo: x,
      f: Math.round(N * x * jitter[i]),
      fit: Math.round(N * x),
    }));
  }, []);

  const rftData = useMemo(
    () =>
      Array.from({ length: 23 }, (_, i) => {
        const depth = 500 + i * 250;
        return { depth, model: +(0.465 * depth).toFixed(0) };
      }),
    [],
  );

  const rftPoints = useMemo(
    () => [
      { depth: 2100, rft: 985 },
      { depth: 3300, rft: 1560 },
      { depth: 4200, rft: 2020 },
      { depth: 5100, rft: 2410 },
    ],
    [],
  );

  return (
    <Card className="glass-card mb-10 border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Reservoir Pressure — Four Independent Paths</CardTitle>
          <Badge variant="outline" className="border-primary/40 text-primary">
            Methodology
          </Badge>
        </div>
        <p className="pt-2 text-sm text-muted-foreground">
          Every path is computed separately and cross-checked. Divergence above
          15% raises a data-quality flag before results reach the Digital Twin,
          SPT Advisor and the economic model.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartPanel
            index={1}
            title="Gradient estimate (baseline)"
            formula="Pi = D × grad,  grad = 0.433…0.465 psi/ft"
            note="Requires depth only. Accuracy ±20% — reliability rank 4."
          >
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <LineChart layout="vertical" data={gradientData} margin={{ top: 8, right: 16, bottom: 18, left: 4 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis
                  type="number"
                  tick={AXIS}
                  stroke={GRID}
                  label={{ value: "Pressure, psi", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="depth"
                  domain={[6000, 0]}
                  tick={AXIS}
                  stroke={GRID}
                  width={52}
                  label={{ value: "Depth, ft", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="hydrostatic" name="Hydrostatic 0.433" stroke="#94a3b8" strokeDasharray="5 4" dot={false} strokeWidth={1.5} />
                <Line dataKey="brine" name="Brine 0.465" stroke="#1A9FFF" dot={false} strokeWidth={2.2} />
                <Line dataKey="overburden" name="Overburden ~1.0" stroke="#0f2b3d" dot={false} strokeWidth={1.6} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            index={2}
            title="Eaton method from resistivity logs"
            formula="Pp = Sv − (Sv − Pn) · (Robs / Rnct)^n,  n = 1.2"
            note="Normal compaction trend fitted on shale points (GR ≥ 75 API). Undercompaction below ~3 800 ft lifts Pp above hydrostatic. Accuracy ±10% — rank 3."
          >
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <ComposedChart layout="vertical" data={eatonData} margin={{ top: 8, right: 16, bottom: 18, left: 4 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis
                  type="number"
                  tick={AXIS}
                  stroke={GRID}
                  label={{ value: "Pressure, psi", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="depth"
                  domain={[6000, 0]}
                  tick={AXIS}
                  stroke={GRID}
                  width={52}
                  label={{ value: "Depth, ft", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="sv" name="Sv — overburden" stroke="#0f2b3d" dot={false} strokeWidth={1.6} />
                <Line dataKey="pn" name="Pn — hydrostatic" stroke="#94a3b8" strokeDasharray="5 4" dot={false} strokeWidth={1.5} />
                <Line dataKey="pp" name="Pp — Eaton" stroke="#d9534f" dot={false} strokeWidth={2.4} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            index={3}
            title="Material balance — Havlena–Odeh straight line"
            formula="F = N · Eo   →   slope = OOIP ≈ 3.2 MMSTB"
            note="PVT via Standing and Vazquez–Beggs correlations; gas branch uses the P/Z vs Gp line. Accuracy ±5% — rank 2."
          >
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <ComposedChart data={mbData} margin={{ top: 8, right: 12, bottom: 18, left: 12 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis
                  type="number"
                  dataKey="eo"
                  tick={AXIS}
                  stroke={GRID}
                  tickFormatter={(v: number) => v.toFixed(3)}
                  label={{ value: "Eo, bbl/STB", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tick={AXIS}
                  stroke={GRID}
                  width={64}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  label={{ value: "F, res bbl", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="fit" name="Fit F = N·Eo" stroke="#1A9FFF" dot={false} strokeWidth={2.2} />
                <Scatter dataKey="f" name="Production history" fill="#0f2b3d" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel
            index={4}
            title="Direct RFT / DST measurements"
            formula="Ground truth → calibrates Eaton n, updates model via Kalman filter"
            note="Highest-trust anchor points. Accuracy ±1% — rank 1. Reliability order: direct measurements > material balance > Eaton > gradient."
          >
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <ComposedChart layout="vertical" data={rftData} margin={{ top: 8, right: 16, bottom: 18, left: 4 }}>
                <CartesianGrid stroke={GRID} />
                <XAxis
                  type="number"
                  domain={[0, 2800]}
                  tick={AXIS}
                  stroke={GRID}
                  label={{ value: "Pressure, psi", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="depth"
                  domain={[6000, 0]}
                  tick={AXIS}
                  stroke={GRID}
                  width={52}
                  label={{ value: "Depth, ft", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="model" name="Model profile" stroke="#1A9FFF" dot={false} strokeWidth={2.2} />
                <Scatter data={rftPoints} dataKey="rft" name="RFT / DST points" fill="#4b8f3b" shape="diamond" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservoirPressureCharts;
