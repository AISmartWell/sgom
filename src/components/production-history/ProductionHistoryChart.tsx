import { useMemo } from "react";
import { Database, Droplets, Flame, Wind, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useProductionHistory } from "@/hooks/useProductionHistory";

interface Props {
  wellId: string;
  wellName?: string;
}

const ProductionHistoryChart = ({ wellId, wellName }: Props) => {
  const { data, isLoading, hasRealData } = useProductionHistory(wellId);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((r) => ({
      date: r.date.slice(0, 7), // YYYY-MM
      oil: r.oil_bbl,
      gas: r.gas_mcf,
      water: r.water_bbl,
      rate: r.rate,
    }));
  }, [data]);

  // Compute summary stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const totalOil = data.reduce((s, r) => s + r.oil_bbl, 0);
    const totalGas = data.reduce((s, r) => s + r.gas_mcf, 0);
    const totalWater = data.reduce((s, r) => s + r.water_bbl, 0);
    const avgRate = data.reduce((s, r) => s + r.rate, 0) / data.length;
    const peakRate = Math.max(...data.map((r) => r.rate));
    const lastRate = data[data.length - 1].rate;
    const waterCut = totalOil + totalWater > 0 ? (totalWater / (totalOil + totalWater)) * 100 : 0;
    return { totalOil, totalGas, totalWater, avgRate, peakRate, lastRate, waterCut, months: data.length };
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading production history...</p>
      </div>
    );
  }

  if (!hasRealData) {
    return (
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 text-center">
        <Database className="h-5 w-5 mx-auto mb-1 text-muted-foreground opacity-50" />
        <p className="text-xs text-muted-foreground">
          No production history available for this well.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Upload CSV data via Production History module to enable real data visualization.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Database className="h-3.5 w-3.5 text-primary" />
        Production History {wellName && `— ${wellName}`}
        <Badge variant="outline" className="text-[9px] text-success border-success/30 ml-1">
          <Database className="h-2.5 w-2.5 mr-0.5" />
          {stats!.months} MONTHS
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-primary/10 rounded-lg text-center">
          <p className="text-sm font-bold text-primary">{(stats!.totalOil / 1000).toFixed(1)}K</p>
          <p className="text-[9px] text-muted-foreground">Total Oil (bbl)</p>
        </div>
        <div className="p-2 bg-success/10 rounded-lg text-center">
          <p className="text-sm font-bold text-success">{(stats!.totalGas / 1000).toFixed(1)}K</p>
          <p className="text-[9px] text-muted-foreground">Total Gas (mcf)</p>
        </div>
        <div className="p-2 bg-accent/10 rounded-lg text-center">
          <p className="text-sm font-bold">{stats!.peakRate.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground">Peak Rate (bbl/d)</p>
        </div>
        <div className="p-2 bg-warning/10 rounded-lg text-center">
          <p className="text-sm font-bold text-warning">{stats!.waterCut.toFixed(1)}%</p>
          <p className="text-[9px] text-muted-foreground">Avg Water Cut</p>
        </div>
      </div>

      {/* Oil & Gas Area Chart */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Flame className="h-3.5 w-3.5 text-primary" />
          Monthly Oil & Gas Production
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="oil" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} label={{ value: "bbl", angle: -90, position: "insideLeft", fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="gas" orientation="right" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} label={{ value: "mcf", angle: 90, position: "insideRight", fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "10px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area yAxisId="oil" type="monotone" dataKey="oil" name="Oil (bbl)" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
              <Area yAxisId="gas" type="monotone" dataKey="gas" name="Gas (mcf)" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Production Bar Chart */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Droplets className="h-3.5 w-3.5 text-primary" />
          Water Production & Oil Comparison
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} label={{ value: "bbl", angle: -90, position: "insideLeft", fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "10px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="oil" name="Oil (bbl)" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="water" name="Water (bbl)" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rate summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/20 rounded">
          <p className="text-xs font-bold">{stats!.avgRate.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground">Avg Rate (bbl/d)</p>
        </div>
        <div className="p-2 bg-muted/20 rounded">
          <p className="text-xs font-bold">{stats!.lastRate.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground">Last Rate (bbl/d)</p>
        </div>
        <div className="p-2 bg-muted/20 rounded">
          <p className="text-xs font-bold">{stats!.months}</p>
          <p className="text-[9px] text-muted-foreground">Data Points</p>
        </div>
      </div>
    </div>
  );
};

export default ProductionHistoryChart;
