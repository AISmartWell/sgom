import { useMemo } from "react";
import { Target, Gauge, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface WellRecord {
  production_oil: number | null;
  water_cut: number | null;
  total_depth: number | null;
  formation: string | null;
  status: string | null;
  production_gas: number | null;
}

interface Props {
  well: WellRecord;
}

const SPTProjectionStageViz = ({ well }: Props) => {
  const oil = well.production_oil ?? 0;
  const wc = well.water_cut ?? 0;
  const depth = well.total_depth ?? 3500;

  // Unified SPT formula: Projected = Current × multiplier + Treatment Effect, cap 25 bbl/d
  const { sptFlow, totalProjected } = useMemo(() => {
    const multiplier = wc < 30 ? 2.5 : wc < 50 ? 2.0 : 2.0;
    const treatmentEffect = wc < 30 ? 10 : wc < 50 ? 7.5 : 5;
    const projected = Math.min(oil * multiplier + treatmentEffect, 25);
    const added = Math.max(projected - oil, 0);
    return { sptFlow: +added.toFixed(1), totalProjected: +projected.toFixed(1) };
  }, [oil, wc]);

  // Scoring criteria
  const scores = useMemo(() => {
    const productionScore = oil <= 15 ? 95 : oil <= 25 ? 75 : 40;
    const wcScore = wc >= 20 && wc <= 60 ? 90 : wc >= 10 && wc <= 70 ? 70 : 35;
    const depthScore = depth >= 2000 && depth <= 6000 ? 85 : depth < 2000 ? 60 : 50;
    const formationScore = well.formation ? 80 : 40;
    const statusScore = well.status === "Active" ? 90 : 45;
    const gorScore = (well.production_gas ?? 0) > 0 ? 75 : 50;

    const overall = Math.round((productionScore + wcScore + depthScore + formationScore + statusScore + gorScore) / 6);

    return {
      radar: [
        { axis: "Production", value: productionScore },
        { axis: "Water Cut", value: wcScore },
        { axis: "Depth", value: depthScore },
        { axis: "Formation", value: formationScore },
        { axis: "Status", value: statusScore },
        { axis: "GOR", value: gorScore },
      ],
      overall,
      productionScore,
      wcScore,
    };
  }, [oil, wc, depth, well]);

  const rating = scores.overall >= 80 ? "Excellent" : scores.overall >= 60 ? "Good" : scores.overall >= 40 ? "Marginal" : "Poor";
  const ratingColor = scores.overall >= 80 ? "text-success" : scores.overall >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* SPT Score Radar */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Target className="h-3.5 w-3.5 text-primary" />
          SPT Candidacy Score
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={scores.radar} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="hsl(var(--chart-4, 280 65% 60%))"
                fill="hsl(var(--chart-4, 280 65% 60%))"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flow Projection */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Gauge className="h-3.5 w-3.5 text-primary" />
          SPT Flow Projection
        </div>

        {/* Visual gauge */}
        <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-primary/40 rounded-full"
            style={{ width: `${Math.min((oil / 30) * 100, 100)}%` }}
          />
          <div
            className="absolute top-0 h-full bg-success/50 rounded-r-full"
            style={{ left: `${Math.min((oil / 30) * 100, 100)}%`, width: `${Math.min((sptFlow / 30) * 100, 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {oil.toFixed(1)} + {sptFlow} = {totalProjected} bbl/d
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-1.5 bg-primary/10 rounded">
            <p className="text-sm font-bold text-primary">{oil.toFixed(1)}</p>
            <p className="text-[8px] text-muted-foreground">Current bbl/d</p>
          </div>
          <div className="p-1.5 bg-success/10 rounded">
            <p className="text-sm font-bold text-success">+{sptFlow}</p>
            <p className="text-[8px] text-muted-foreground">SPT Gain</p>
          </div>
          <div className="p-1.5 bg-warning/10 rounded">
            <p className="text-sm font-bold text-warning">{totalProjected}</p>
            <p className="text-[8px] text-muted-foreground">Projected</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Award className="h-3 w-3" />
            <span className="text-[10px] text-muted-foreground">Overall Score:</span>
            <span className={`text-xs font-bold ${ratingColor}`}>{scores.overall}/100</span>
          </div>
          <Badge variant="outline" className={`text-[9px] ${ratingColor}`}>{rating}</Badge>
        </div>
      </div>
    </div>
  );
};

export default SPTProjectionStageViz;
