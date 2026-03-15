import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingDown } from "lucide-react";

interface ProductionPoint {
  month: number;
  rate: number;
  cumOil: number;
}

interface Props {
  productionData: ProductionPoint[];
}

/**
 * q vs Np plot: Rate on Y-axis, Cumulative Production on X-axis.
 * Linear extrapolation of the trend to q=0 gives EUR (Estimated Ultimate Recovery).
 */
export const RateVsCumulativeChart = ({ productionData }: Props) => {
  const analysis = useMemo(() => {
    if (productionData.length < 2) return null;

    const points = productionData.map((p) => ({ np: p.cumOil, q: p.rate }));

    // Linear regression on q vs Np: q = a + b*Np
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const p of points) {
      sumX += p.np;
      sumY += p.q;
      sumXY += p.np * p.q;
      sumX2 += p.np * p.np;
    }
    const denom = n * sumX2 - sumX * sumX;
    if (Math.abs(denom) < 1e-10) return null;

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // EUR = x-intercept where q=0 → Np = -intercept / slope
    const eur = slope < 0 ? -intercept / slope : null;

    const maxNp = Math.max(...points.map((p) => p.np));
    const maxQ = Math.max(...points.map((p) => p.q));

    // Trend line endpoints
    const trendX0 = 0;
    const trendY0 = intercept;
    const trendX1 = eur ?? maxNp * 1.5;
    const trendY1 = 0;

    return { points, slope, intercept, eur, maxNp, maxQ, trendX0, trendY0, trendX1, trendY1 };
  }, [productionData]);

  if (productionData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-center py-12">
            Run the pipeline to see the q vs Np plot.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-center py-12">Insufficient data for regression.</p>
        </CardContent>
      </Card>
    );
  }

  const { points, eur, maxNp, maxQ, intercept, slope } = analysis;

  // Chart domain: extend X to EUR (or 130% of max Np)
  const chartMaxX = eur && eur > maxNp ? eur * 1.1 : maxNp * 1.3;
  const chartMaxY = Math.max(maxQ, intercept) * 1.15;

  const W = 600;
  const H = 280;
  const PAD = { top: 15, right: 20, bottom: 30, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xScale = (v: number) => PAD.left + (v / chartMaxX) * plotW;
  const yScale = (v: number) => PAD.top + plotH - (v / chartMaxY) * plotH;

  // Axis ticks
  const xTicks = Array.from({ length: 6 }, (_, i) => Math.round((chartMaxX / 5) * i));
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((chartMaxY / 5) * i));

  // Trend line clipped to chart
  const trendStartX = 0;
  const trendStartY = intercept;
  const trendEndX = eur ?? chartMaxX;
  const trendEndY = slope * trendEndX + intercept;

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Rate vs Cumulative Production (q vs N<sub>p</sub>)
          </h4>
          {eur && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              EUR = {(eur / 1000).toFixed(1)}K bbl
            </Badge>
          )}
        </div>

        <div className="relative bg-muted/20 rounded-lg overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 260 }}>
            {/* Grid */}
            {yTicks.map((t) => (
              <line key={`gy-${t}`} x1={PAD.left} y1={yScale(t)} x2={W - PAD.right} y2={yScale(t)}
                stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" />
            ))}
            {xTicks.map((t) => (
              <line key={`gx-${t}`} x1={xScale(t)} y1={PAD.top} x2={xScale(t)} y2={PAD.top + plotH}
                stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" />
            ))}

            {/* Axes */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH}
              stroke="hsl(var(--foreground))" strokeWidth="1" />
            <line x1={PAD.left} y1={PAD.top + plotH} x2={W - PAD.right} y2={PAD.top + plotH}
              stroke="hsl(var(--foreground))" strokeWidth="1" />

            {/* Axis labels */}
            <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10"
              fill="hsl(var(--muted-foreground))">Cumulative Oil, Np (bbl)</text>
            <text x="12" y={H / 2} textAnchor="middle" fontSize="10"
              fill="hsl(var(--muted-foreground))" transform={`rotate(-90, 12, ${H / 2})`}>
              Rate, q (bbl/d)
            </text>

            {/* Tick labels */}
            {xTicks.map((t) => (
              <text key={`xl-${t}`} x={xScale(t)} y={PAD.top + plotH + 14} textAnchor="middle"
                fontSize="8" fill="hsl(var(--muted-foreground))">
                {t >= 1000 ? `${(t / 1000).toFixed(0)}K` : t}
              </text>
            ))}
            {yTicks.map((t) => (
              <text key={`yl-${t}`} x={PAD.left - 5} y={yScale(t) + 3} textAnchor="end"
                fontSize="8" fill="hsl(var(--muted-foreground))">
                {t}
              </text>
            ))}

            {/* Trend line (linear extrapolation) */}
            <line
              x1={xScale(Math.max(0, trendStartX))}
              y1={yScale(Math.max(0, trendStartY))}
              x2={xScale(Math.min(chartMaxX, trendEndX))}
              y2={yScale(Math.max(0, trendEndY))}
              stroke="hsl(var(--destructive))"
              strokeWidth="1.5"
              strokeDasharray="8 4"
            />

            {/* EUR marker on X-axis */}
            {eur && eur <= chartMaxX && (
              <>
                <line x1={xScale(eur)} y1={yScale(0) - 8} x2={xScale(eur)} y2={yScale(0) + 4}
                  stroke="hsl(var(--destructive))" strokeWidth="2" />
                <text x={xScale(eur)} y={yScale(0) - 12} textAnchor="middle"
                  fontSize="9" fontWeight="bold" fill="hsl(var(--destructive))">
                  EUR
                </text>
              </>
            )}

            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={xScale(p.np)}
                cy={yScale(p.q)}
                r="3"
                fill="hsl(var(--primary))"
                opacity={0.8}
              />
            ))}

            {/* Data line connecting points */}
            <path
              d={`M ${points.map((p) => `${xScale(p.np)},${yScale(p.q)}`).join(" L ")}`}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              opacity={0.6}
            />
          </svg>

          {/* Legend */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] bg-background/80 rounded p-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Monthly data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-destructive" />
              <span>Linear trend → EUR</span>
            </div>
          </div>
        </div>

        {/* Regression info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">EUR</p>
            <p className="text-lg font-bold text-primary">
              {eur ? `${(eur / 1000).toFixed(1)}K` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">bbl</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">q-intercept</p>
            <p className="text-lg font-bold">{intercept.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">bbl/d (at Np=0)</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Slope</p>
            <p className="text-lg font-bold text-destructive">{(slope * 1000).toFixed(3)}</p>
            <p className="text-[10px] text-muted-foreground">×10⁻³ (bbl/d)/bbl</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Current Np</p>
            <p className="text-lg font-bold">{(maxNp / 1000).toFixed(1)}K</p>
            <p className="text-[10px] text-muted-foreground">bbl produced</p>
          </div>
        </div>

        {/* Formula */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs font-semibold mb-1">Method</p>
          <div className="font-mono text-xs space-y-1">
            <p className="text-muted-foreground">Linear regression: <span className="text-primary">q = a + b × N<sub>p</sub></span></p>
            <p className="text-muted-foreground">EUR (q → 0): <span className="text-primary">N<sub>p,EUR</sub> = −a / b</span></p>
            <p className="text-muted-foreground">
              Result: q = {intercept.toFixed(2)} + ({(slope * 1000).toFixed(3)}×10⁻³) × N<sub>p</sub>
              {eur ? ` → EUR = ${Math.round(eur).toLocaleString()} bbl` : ""}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
