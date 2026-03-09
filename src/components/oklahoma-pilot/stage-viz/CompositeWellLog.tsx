import { useMemo } from "react";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogPoint {
  depth: number;
  gr: number;
  res: number;
  por: number;
  density?: number;
}

interface PayZone {
  top: number;
  bottom: number;
  label: string;
}

interface CompositeWellLogProps {
  logStrips: LogPoint[];
  payZone?: PayZone;
  hasRealData: boolean;
  isLoading?: boolean;
  formation?: string | null;
}

const TRACKS = [
  { key: "gr" as const, label: "GR", color: "#eab308", maxDefault: 150 },
  { key: "res" as const, label: "Resistivity", color: "#ef4444", maxDefault: 60 },
  { key: "por" as const, label: "Porosity", color: "#3b82f6", maxDefault: 30 },
] as const;

const CompositeWellLog = ({ logStrips, payZone, hasRealData, isLoading, formation }: CompositeWellLogProps) => {
  const chartData = useMemo(() => {
    if (logStrips.length === 0) return null;

    const depthMin = Math.min(...logStrips.map((s) => s.depth));
    const depthMax = Math.max(...logStrips.map((s) => s.depth));
    const depthRange = depthMax - depthMin || 1;

    // Normalize all values to 0–150 range for overlay
    const maxVal = 150;
    const grMax = Math.max(maxVal, ...logStrips.map((s) => s.gr));
    const resMax = Math.max(TRACKS[1].maxDefault, ...logStrips.map((s) => s.res));
    const porMax = Math.max(TRACKS[2].maxDefault, ...logStrips.map((s) => s.por));

    return { depthMin, depthMax, depthRange, grMax, resMax, porMax, maxVal };
  }, [logStrips]);

  if (!chartData) return null;

  const { depthMin, depthMax, depthRange, grMax, resMax, porMax } = chartData;

  const W = 600;
  const H = 400;
  const PAD_L = 60;
  const PAD_R = 15;
  const PAD_T = 15;
  const PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const yForDepth = (d: number) => PAD_T + ((depthMax - d) / depthRange) * plotH;
  const xForVal = (v: number, vMax: number) => PAD_L + (v / vMax) * plotW;

  // Generate depth tick marks
  const depthStep = depthRange > 2000 ? 500 : depthRange > 800 ? 200 : depthRange > 300 ? 100 : 50;
  const depthTicks: number[] = [];
  const firstTick = Math.ceil(depthMin / depthStep) * depthStep;
  for (let d = firstTick; d <= depthMax; d += depthStep) depthTicks.push(d);

  // X-axis ticks
  const xTicks = [0, 30, 60, 80, 100, 150];

  // Build polyline strings
  const buildPath = (key: "gr" | "res" | "por", vMax: number) =>
    logStrips
      .map((s) => `${xForVal(s[key], vMax)},${yForDepth(s.depth)}`)
      .join(" ");

  // Fill under porosity curve (like the reference)
  const porFillPoints = useMemo(() => {
    const pts = logStrips.map((s) => `${xForVal(s.por, porMax)},${yForDepth(s.depth)}`);
    const bottomLeft = `${PAD_L},${yForDepth(logStrips[logStrips.length - 1].depth)}`;
    const topLeft = `${PAD_L},${yForDepth(logStrips[0].depth)}`;
    return [topLeft, ...pts, bottomLeft].join(" ");
  }, [logStrips, porMax]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-bold text-foreground">Composite Well Log</h4>
          <p className="text-[10px] text-muted-foreground">GR, Resistivity, Porosity curves with pay zone</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {TRACKS.map((t) => (
            <div key={t.key} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-[10px] text-foreground/80">{t.label}</span>
            </div>
          ))}
          {payZone && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-foreground/80">Pay Zone</span>
            </div>
          )}
          {hasRealData && (
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
              <Database className="h-2.5 w-2.5 mr-0.5" />REAL DATA
            </Badge>
          )}
          {isLoading && <span className="text-muted-foreground animate-pulse text-[9px]">Loading...</span>}
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-[#0f1729] overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 280 }}>
          {/* Background */}
          <rect x={PAD_L} y={PAD_T} width={plotW} height={plotH} fill="#111827" rx="2" />

          {/* Horizontal grid lines (depth) */}
          {depthTicks.map((d) => (
            <g key={d}>
              <line
                x1={PAD_L} y1={yForDepth(d)} x2={W - PAD_R} y2={yForDepth(d)}
                stroke="#374151" strokeWidth="0.5" strokeDasharray="4,4"
              />
              <text x={PAD_L - 6} y={yForDepth(d) + 3} textAnchor="end" fill="#9ca3af" fontSize="10">
                {d}ft
              </text>
            </g>
          ))}

          {/* Vertical grid lines */}
          {xTicks.map((v) => (
            <line
              key={v}
              x1={xForVal(v, 150)} y1={PAD_T} x2={xForVal(v, 150)} y2={PAD_T + plotH}
              stroke="#374151" strokeWidth="0.5" strokeDasharray="4,4"
            />
          ))}

          {/* X-axis labels */}
          {xTicks.map((v) => (
            <text key={v} x={xForVal(v, 150)} y={H - 8} textAnchor="middle" fill="#9ca3af" fontSize="9">
              {v}
            </text>
          ))}

          {/* Pay Zone highlight */}
          {payZone && (
            <rect
              x={PAD_L}
              y={yForDepth(payZone.top)}
              width={plotW}
              height={Math.abs(yForDepth(payZone.bottom) - yForDepth(payZone.top))}
              fill="#10b981"
              opacity={0.15}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="6,3"
              rx="2"
            />
          )}

          {/* Porosity fill area */}
          <polygon points={porFillPoints} fill="#3b82f6" opacity={0.2} />

          {/* Curves */}
          <polyline
            points={buildPath("gr", grMax > 150 ? grMax : 150)}
            fill="none" stroke="#eab308" strokeWidth="2" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={buildPath("res", resMax > 150 ? resMax : 150)}
            fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={buildPath("por", porMax > 150 ? porMax : 150)}
            fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data point dots for porosity */}
          {logStrips.map((s, i) => (
            <circle
              key={i}
              cx={xForVal(s.por, porMax > 150 ? porMax : 150)}
              cy={yForDepth(s.depth)}
              r="2.5"
              fill="#3b82f6"
              opacity={0.7}
            >
              <title>{`${s.depth} ft — GR: ${s.gr} API, Res: ${s.res} Ωm, φ: ${s.por}%`}</title>
            </circle>
          ))}

          {/* Pay zone label */}
          {payZone && (
            <text
              x={W - PAD_R - 4}
              y={yForDepth((payZone.top + payZone.bottom) / 2) + 4}
              textAnchor="end"
              fill="#10b981"
              fontSize="10"
              fontWeight="bold"
            >
              {payZone.label}
            </text>
          )}
        </svg>
      </div>

      {formation && (
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>Formation: {formation}</span>
          <span>{logStrips.length} data points</span>
        </div>
      )}
    </div>
  );
};

export default CompositeWellLog;
