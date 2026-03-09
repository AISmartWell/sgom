import { useMemo, useState, useCallback, useRef } from "react";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogPoint {
  depth: number;
  gr: number;
  res: number;
  por: number;
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
  { key: "gr" as const, label: "GR", color: "#eab308", unit: "API" },
  { key: "res" as const, label: "Resistivity", color: "#ef4444", unit: "Ωm" },
  { key: "por" as const, label: "Porosity", color: "#3b82f6", unit: "%" },
] as const;

const W = 600, H = 400;
const PAD_L = 60, PAD_R = 15, PAD_T = 15, PAD_B = 30;
const plotW = W - PAD_L - PAD_R;
const plotH = H - PAD_T - PAD_B;

const CompositeWellLog = ({ logStrips, payZone, hasRealData, isLoading, formation }: CompositeWellLogProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPoint, setHoverPoint] = useState<LogPoint | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (logStrips.length === 0) return null;
    const depthMin = Math.min(...logStrips.map((s) => s.depth));
    const depthMax = Math.max(...logStrips.map((s) => s.depth));
    const depthRange = depthMax - depthMin || 1;
    const grMax = Math.max(150, ...logStrips.map((s) => s.gr));
    const resMax = Math.max(60, ...logStrips.map((s) => s.res));
    const porMax = Math.max(30, ...logStrips.map((s) => s.por));
    return { depthMin, depthMax, depthRange, grMax, resMax, porMax };
  }, [logStrips]);

  const porFillPoints = useMemo(() => {
    if (!chartData || logStrips.length === 0) return "";
    const { depthMax, depthRange, porMax } = chartData;
    const yForDepth = (d: number) => PAD_T + ((depthMax - d) / depthRange) * plotH;
    const xForVal = (v: number, vMax: number) => PAD_L + (v / vMax) * plotW;
    const pts = logStrips.map((s) => `${xForVal(s.por, porMax)},${yForDepth(s.depth)}`);
    const bottomLeft = `${PAD_L},${yForDepth(logStrips[logStrips.length - 1].depth)}`;
    const topLeft = `${PAD_L},${yForDepth(logStrips[0].depth)}`;
    return [topLeft, ...pts, bottomLeft].join(" ");
  }, [logStrips, chartData]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !chartData || logStrips.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseY = ((e.clientY - rect.top) / rect.height) * H;

    if (mouseY < PAD_T || mouseY > H - PAD_B) {
      setHoverPoint(null);
      setHoverY(null);
      return;
    }

    // Convert pixel Y to depth
    const { depthMax, depthRange } = chartData;
    const depthAtMouse = depthMax - ((mouseY - PAD_T) / plotH) * depthRange;

    // Find nearest data point
    let nearest = logStrips[0];
    let minDist = Math.abs(logStrips[0].depth - depthAtMouse);
    for (let i = 1; i < logStrips.length; i++) {
      const dist = Math.abs(logStrips[i].depth - depthAtMouse);
      if (dist < minDist) { minDist = dist; nearest = logStrips[i]; }
    }

    const snappedY = PAD_T + ((depthMax - nearest.depth) / depthRange) * plotH;
    setHoverPoint(nearest);
    setHoverY(snappedY);
  }, [chartData, logStrips]);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null);
    setHoverY(null);
  }, []);

  if (!chartData) return null;

  const { depthMin, depthMax, depthRange, grMax, resMax, porMax } = chartData;

  const yForDepth = (d: number) => PAD_T + ((depthMax - d) / depthRange) * plotH;
  const xForVal = (v: number, vMax: number) => PAD_L + (v / vMax) * plotW;

  const depthStep = depthRange > 2000 ? 500 : depthRange > 800 ? 200 : depthRange > 300 ? 100 : 50;
  const depthTicks: number[] = [];
  for (let d = Math.ceil(depthMin / depthStep) * depthStep; d <= depthMax; d += depthStep) depthTicks.push(d);

  const xTicks = [0, 30, 60, 80, 100, 150];

  const buildPath = (key: "gr" | "res" | "por", vMax: number) =>
    logStrips.map((s) => `${xForVal(s[key], vMax)},${yForDepth(s.depth)}`).join(" ");

  const grNorm = grMax > 150 ? grMax : 150;
  const resNorm = resMax > 150 ? resMax : 150;
  const porNorm = porMax > 150 ? porMax : 150;

  // Tooltip positioning
  const tooltipX = hoverPoint ? Math.max(PAD_L + 10, Math.min(W - 170, xForVal(hoverPoint.gr, grNorm) + 12)) : 0;
  const tooltipY = hoverY !== null ? (hoverY < H / 2 ? hoverY + 8 : hoverY - 78) : 0;

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
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
              <span className="text-[10px] text-foreground/80">Pay Zone</span>
            </div>
          )}
          {hasRealData && (
            <Badge variant="outline" className="text-[9px] border-emerald-500/30" style={{ color: "#10b981" }}>
              <Database className="h-2.5 w-2.5 mr-0.5" />REAL DATA
            </Badge>
          )}
          {isLoading && <span className="text-muted-foreground animate-pulse text-[9px]">Loading...</span>}
        </div>
      </div>

      <div className="rounded-lg border border-border/40 overflow-hidden" style={{ backgroundColor: "#0f1729" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair"
          style={{ minHeight: 280 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <rect x={PAD_L} y={PAD_T} width={plotW} height={plotH} fill="#111827" rx="2" />

          {depthTicks.map((d) => (
            <g key={d}>
              <line x1={PAD_L} y1={yForDepth(d)} x2={W - PAD_R} y2={yForDepth(d)} stroke="#374151" strokeWidth="0.5" strokeDasharray="4,4" />
              <text x={PAD_L - 6} y={yForDepth(d) + 3} textAnchor="end" fill="#9ca3af" fontSize="10">{d}ft</text>
            </g>
          ))}

          {xTicks.map((v) => (
            <line key={v} x1={xForVal(v, 150)} y1={PAD_T} x2={xForVal(v, 150)} y2={PAD_T + plotH} stroke="#374151" strokeWidth="0.5" strokeDasharray="4,4" />
          ))}
          {xTicks.map((v) => (
            <text key={`l${v}`} x={xForVal(v, 150)} y={H - 8} textAnchor="middle" fill="#9ca3af" fontSize="9">{v}</text>
          ))}

          {payZone && (
            <rect
              x={PAD_L} y={yForDepth(payZone.top)}
              width={plotW}
              height={Math.abs(yForDepth(payZone.bottom) - yForDepth(payZone.top))}
              fill="#10b981" opacity={0.15}
              stroke="#10b981" strokeWidth="1.5" strokeDasharray="6,3" rx="2"
            />
          )}

          <polygon points={porFillPoints} fill="#3b82f6" opacity={0.2} />

          <polyline points={buildPath("gr", grNorm)} fill="none" stroke="#eab308" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <polyline points={buildPath("res", resNorm)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <polyline points={buildPath("por", porNorm)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {logStrips.map((s, i) => (
            <circle key={i} cx={xForVal(s.por, porNorm)} cy={yForDepth(s.depth)} r="2.5" fill="#3b82f6" opacity={0.7}>
              <title>{`${s.depth} ft — GR: ${s.gr} API, Res: ${s.res} Ωm, φ: ${s.por}%`}</title>
            </circle>
          ))}

          {payZone && (
            <text x={W - PAD_R - 4} y={yForDepth((payZone.top + payZone.bottom) / 2) + 4} textAnchor="end" fill="#10b981" fontSize="10" fontWeight="bold">
              {payZone.label}
            </text>
          )}

          {/* Crosshair */}
          {hoverPoint && hoverY !== null && (
            <g>
              {/* Horizontal line */}
              <line x1={PAD_L} y1={hoverY} x2={W - PAD_R} y2={hoverY} stroke="#f8fafc" strokeWidth="0.8" strokeDasharray="3,2" opacity={0.6} />
              
              {/* Intersection dots on each curve */}
              <circle cx={xForVal(hoverPoint.gr, grNorm)} cy={hoverY} r="4" fill="#eab308" stroke="#0f1729" strokeWidth="1.5" />
              <circle cx={xForVal(hoverPoint.res, resNorm)} cy={hoverY} r="4" fill="#ef4444" stroke="#0f1729" strokeWidth="1.5" />
              <circle cx={xForVal(hoverPoint.por, porNorm)} cy={hoverY} r="4" fill="#3b82f6" stroke="#0f1729" strokeWidth="1.5" />

              {/* Depth label on left */}
              <rect x={2} y={hoverY - 8} width={54} height={16} rx="3" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
              <text x={29} y={hoverY + 4} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold">{hoverPoint.depth} ft</text>

              {/* Tooltip box */}
              <rect x={tooltipX} y={tooltipY} width={155} height={68} rx="4" fill="#1e293b" stroke="#475569" strokeWidth="0.8" opacity={0.95} />
              <text x={tooltipX + 8} y={tooltipY + 14} fill="#f8fafc" fontSize="9.5" fontWeight="bold">
                Depth: {hoverPoint.depth} ft
              </text>
              {TRACKS.map((t, ti) => (
                <g key={t.key}>
                  <circle cx={tooltipX + 12} cy={tooltipY + 28 + ti * 16} r="3.5" fill={t.color} />
                  <text x={tooltipX + 20} y={tooltipY + 31 + ti * 16} fill="#d1d5db" fontSize="9">
                    {t.label}: <tspan fill="#f8fafc" fontWeight="bold">{hoverPoint[t.key].toFixed(1)} {t.unit}</tspan>
                  </text>
                </g>
              ))}
            </g>
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
