import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
  AreaChart, Area,
} from "recharts";

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface StageResult {
  title: string;
  metrics: { label: string; value: string; color?: string }[];
  verdict: string;
}

interface WellAnalysis {
  well: WellRecord;
  stages: Map<string, StageResult>;
  status: "pending" | "running" | "done" | "error";
  error?: string;
}

type SptRating = "excellent" | "good" | "marginal" | "not_suitable";

interface PilotChartsProps {
  wells: WellRecord[];
  getSptRating: (w: WellRecord) => SptRating;
  analyses?: Map<string, WellAnalysis>;
}

const COLORS = {
  excellent: "#10b981",
  good: "#eab308",
  marginal: "#f97316",
  not_suitable: "#6b7280",
};

const CustomTooltipStyle = {
  backgroundColor: "hsl(220 20% 16%)",
  border: "1px solid hsl(220 15% 30%)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#f1f5f9",
  fontSize: "12px",
  boxShadow: "0 8px 24px -4px rgba(0,0,0,0.5)",
};

const PilotCharts = ({ wells, getSptRating, analyses }: PilotChartsProps) => {
  // 1. Oil Production Distribution (histogram-style)
  const oilDistribution = useMemo(() => {
    const bins = [
      { range: "0–3", min: 0, max: 3, count: 0 },
      { range: "3–6", min: 3, max: 6, count: 0 },
      { range: "6–10", min: 6, max: 10, count: 0 },
      { range: "10–15", min: 10, max: 15, count: 0 },
      { range: "15–25", min: 15, max: 25, count: 0 },
      { range: "25–50", min: 25, max: 50, count: 0 },
      { range: "50+", min: 50, max: 9999, count: 0 },
    ];
    wells.forEach((w) => {
      const oil = w.production_oil ?? 0;
      for (const bin of bins) {
        if (oil > bin.min && oil <= bin.max) { bin.count++; break; }
      }
    });
    return bins.filter(b => b.count > 0);
  }, [wells]);

  // 2. Water Cut Distribution
  const wcDistribution = useMemo(() => {
    const bins = [
      { range: "0–10%", min: 0, max: 10, count: 0 },
      { range: "10–20%", min: 10, max: 20, count: 0 },
      { range: "20–40%", min: 20, max: 40, count: 0 },
      { range: "40–60%", min: 40, max: 60, count: 0 },
      { range: "60–80%", min: 60, max: 80, count: 0 },
      { range: "80–100%", min: 80, max: 100, count: 0 },
    ];
    wells.forEach((w) => {
      const wc = w.water_cut ?? 0;
      for (const bin of bins) {
        if (wc >= bin.min && wc < bin.max) { bin.count++; break; }
      }
    });
    return bins.filter(b => b.count > 0);
  }, [wells]);

  // 3. SPT Rating Distribution (pie)
  const ratingDistribution = useMemo(() => {
    const counts: Record<SptRating, number> = { excellent: 0, good: 0, marginal: 0, not_suitable: 0 };
    wells.forEach((w) => { counts[getSptRating(w)]++; });
    return [
      { name: "Excellent", value: counts.excellent, color: COLORS.excellent },
      { name: "Good", value: counts.good, color: COLORS.good },
      { name: "Marginal", value: counts.marginal, color: COLORS.marginal },
      { name: "Not Suitable", value: counts.not_suitable, color: COLORS.not_suitable },
    ].filter(d => d.value > 0);
  }, [wells, getSptRating]);

  // 4. County breakdown (top 10)
  const countyData = useMemo(() => {
    const map: Record<string, { total: number; candidates: number }> = {};
    wells.forEach((w) => {
      const c = w.county || "Unknown";
      if (!map[c]) map[c] = { total: 0, candidates: 0 };
      map[c].total++;
      if (getSptRating(w) !== "not_suitable") map[c].candidates++;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].candidates - a[1].candidates)
      .slice(0, 10)
      .map(([county, data]) => ({ county, ...data }));
  }, [wells, getSptRating]);

  // 5. Oil vs Water Cut scatter
  const scatterData = useMemo(() => {
    return wells
      .filter(w => w.production_oil != null && w.water_cut != null)
      .map(w => ({
        oil: w.production_oil!,
        wc: w.water_cut!,
        name: w.well_name || w.api_number || "—",
        rating: getSptRating(w),
      }));
  }, [wells, getSptRating]);

  // 6. Formation breakdown (top formations)
  const formationData = useMemo(() => {
    const map: Record<string, { count: number; avgOil: number; totalOil: number }> = {};
    wells.forEach((w) => {
      const f = w.formation || "Unknown";
      if (!map[f]) map[f] = { count: 0, avgOil: 0, totalOil: 0 };
      map[f].count++;
      map[f].totalOil += (w.production_oil ?? 0);
    });
    return Object.entries(map)
      .map(([formation, d]) => ({ formation, count: d.count, avgOil: d.count > 0 ? +(d.totalOil / d.count).toFixed(1) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [wells]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        📊 Field Analytics — {wells.length} Wells
      </h3>

      {/* Row 1: SPT Pie + Oil Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SPT Candidacy Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ratingDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value, x, y }) => (
                    <text x={x} y={y} fill="#e2e8f0" fontSize={11} fontWeight={600} textAnchor={x > 200 ? "start" : "end"} dominantBaseline="central">
                      {name}: {value}
                    </text>
                  )}
                  labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                >
                  {ratingDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#cbd5e1" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Oil Production Distribution (bbl/d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={oilDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Wells" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Water Cut + County */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Water Cut Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={wcDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Wells" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">SPT Candidates by County (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={countyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="county" tick={{ fontSize: 10, fill: "#94a3b8" }} width={80} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Bar dataKey="candidates" fill="#10b981" radius={[0, 4, 4, 0]} name="SPT Candidates" />
                <Bar dataKey="total" fill="#334155" radius={[0, 4, 4, 0]} name="Total Wells" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Scatter + Formation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Oil Production vs Water Cut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                <XAxis type="number" dataKey="oil" name="Oil (bbl/d)" tick={{ fontSize: 11, fill: "#cbd5e1" }} />
                <YAxis type="number" dataKey="wc" name="WC (%)" tick={{ fontSize: 11, fill: "#cbd5e1" }} />
                <ZAxis range={[30, 70]} />
                <Tooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(value: number, name: string) => [value.toFixed(1), name]}
                  labelFormatter={() => ""}
                />
                {["excellent", "good", "marginal", "not_suitable"].map((rating) => (
                  <Scatter
                    key={rating}
                    name={rating.charAt(0).toUpperCase() + rating.slice(1).replace("_", " ")}
                    data={scatterData.filter(d => d.rating === rating)}
                    fill={COLORS[rating as SptRating]}
                    opacity={0.85}
                    strokeWidth={1}
                    stroke="rgba(255,255,255,0.15)"
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: "11px", color: "#cbd5e1" }} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Wells by Formation (Avg Oil bbl/d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={formationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                <XAxis dataKey="formation" tick={{ fontSize: 9, fill: "#94a3b8" }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={CustomTooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Well Count" />
                <Bar dataKey="avgOil" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Oil (bbl/d)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PilotCharts;
