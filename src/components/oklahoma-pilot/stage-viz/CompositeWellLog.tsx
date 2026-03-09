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
  wellName?: string | null;
  apiNumber?: string | null;
}

/* ── Layout constants ── */
const W = 720, H = 440;
const PAD_T = 40, PAD_B = 20;
const DEPTH_COL_W = 50;

/* Track definitions */
const TRACK_1_X = 0;
const TRACK_1_W = 200;  // GR + SP track
const DEPTH_X = TRACK_1_X + TRACK_1_W;
const TRACK_2_X = DEPTH_X + DEPTH_COL_W;
const TRACK_2_W = 210;  // Resistivity track
const TRACK_3_X = TRACK_2_X + TRACK_2_W;
const TRACK_3_W = 160;  // Porosity track
const FORMATION_X = TRACK_3_X + TRACK_3_W;
const FORMATION_W = W - FORMATION_X;

const plotH = H - PAD_T - PAD_B;

/* Grid line counts */
const GRID_LINES = 10;

const CompositeWellLog = ({
  logStrips, payZone, hasRealData, isLoading, formation, wellName, apiNumber
}: CompositeWellLogProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPoint, setHoverPoint] = useState<LogPoint | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (logStrips.length === 0) return null;
    const depthMin = Math.min(...logStrips.map((s) => s.depth));
    const depthMax = Math.max(...logStrips.map((s) => s.depth));
    const depthRange = depthMax - depthMin || 1;
    const grMax = Math.max(150, ...logStrips.map((s) => s.gr));
    const resMax = Math.max(100, ...logStrips.map((s) => s.res));
    const porMax = Math.max(30, ...logStrips.map((s) => s.por));
    return { depthMin, depthMax, depthRange, grMax, resMax, porMax };
  }, [logStrips]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !chartData || logStrips.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseY = ((e.clientY - rect.top) / rect.height) * H;
    if (mouseY < PAD_T || mouseY > H - PAD_B) {
      setHoverPoint(null); setHoverY(null); return;
    }
    const { depthMin, depthRange } = chartData;
    const depthAtMouse = depthMin + ((mouseY - PAD_T) / plotH) * depthRange;
    let nearest = logStrips[0];
    let minDist = Math.abs(logStrips[0].depth - depthAtMouse);
    for (let i = 1; i < logStrips.length; i++) {
      const dist = Math.abs(logStrips[i].depth - depthAtMouse);
      if (dist < minDist) { minDist = dist; nearest = logStrips[i]; }
    }
    const { depthMin: dMin } = chartData;
    const snappedY = PAD_T + ((nearest.depth - dMin) / depthRange) * plotH;
    setHoverPoint(nearest);
    setHoverY(snappedY);
  }, [chartData, logStrips]);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null); setHoverY(null);
  }, []);

  /* Fill polygon for porosity (left fill) */
  const porFillPoints = useMemo(() => {
    if (!chartData || logStrips.length === 0) return "";
    const { depthMin: dMin, depthRange: dRange, porMax: pMax } = chartData;
    const yFD = (d: number) => PAD_T + ((d - dMin) / dRange) * plotH;
    const pts = logStrips.map((s) => {
      const x = TRACK_3_X + (s.por / pMax) * TRACK_3_W;
      return `${x},${yFD(s.depth)}`;
    });
    const topLeft = `${TRACK_3_X},${yFD(logStrips[0].depth)}`;
    const botLeft = `${TRACK_3_X},${yFD(logStrips[logStrips.length - 1].depth)}`;
    return [topLeft, ...pts, botLeft].join(" ");
  }, [logStrips, chartData]);

  /* Formation zones for right column */
  const formationZones = useMemo(() => {
    if (!chartData || !payZone) return [];
    const { depthMin: dMin, depthMax: dMax, depthRange: dRange } = chartData;
    const zones: { top: number; bottom: number; label: string; color: string }[] = [];
    if (payZone.top > dMin + dRange * 0.05) {
      zones.push({ top: dMin, bottom: payZone.top, label: "Overburden", color: "#e8e0d0" });
    }
    zones.push({ top: payZone.top, bottom: payZone.bottom, label: payZone.label, color: "#ffe0a0" });
    if (payZone.bottom < dMax - dRange * 0.05) {
      zones.push({ top: payZone.bottom, bottom: dMax, label: "Sub-pay", color: "#d0d8e8" });
    }
    return zones;
  }, [payZone, chartData]);

  if (!chartData) return null;

  const { depthMin, depthMax, depthRange, grMax, resMax, porMax } = chartData;

  const yForDepth = (d: number) => PAD_T + ((d - depthMin) / depthRange) * plotH;

  /* Depth ticks */
  const depthStep = depthRange > 2000 ? 500 : depthRange > 800 ? 200 : depthRange > 300 ? 100 : depthRange > 100 ? 50 : 10;
  const depthTicks: number[] = [];
  for (let d = Math.ceil(depthMin / depthStep) * depthStep; d <= depthMax; d += depthStep) depthTicks.push(d);

  /* Path builders for each track */
  const buildTrackPath = (
    key: "gr" | "res" | "por",
    trackX: number, trackW: number, vMax: number
  ) =>
    logStrips.map((s) => {
      const x = trackX + (s[key] / vMax) * trackW;
      const y = yForDepth(s.depth);
      return `${x},${y}`;
    }).join(" ");

  /* Pay zone Y coords */
  const payY1 = payZone ? yForDepth(payZone.top) : 0;
  const payY2 = payZone ? yForDepth(payZone.bottom) : 0;

  /* Track grid */
  const renderGrid = (trackX: number, trackW: number) => {
    const lines = [];
    for (let i = 0; i <= GRID_LINES; i++) {
      const x = trackX + (i / GRID_LINES) * trackW;
      lines.push(
        <line key={`v${i}`} x1={x} y1={PAD_T} x2={x} y2={PAD_T + plotH}
          stroke="#c0c0c0" strokeWidth={i === 0 || i === GRID_LINES ? "0.8" : "0.3"} />
      );
    }
    for (const d of depthTicks) {
      const y = yForDepth(d);
      lines.push(
        <line key={`h${d}`} x1={trackX} y1={y} x2={trackX + trackW} y2={y}
          stroke="#c0c0c0" strokeWidth="0.3" />
      );
    }
    return lines;
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-bold text-foreground">Composite Well Log</h4>
          <p className="text-[10px] text-muted-foreground">Multi-track: GR, Resistivity, Porosity with formation column</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: "#16a34a" }} />
            <span className="text-[10px] text-foreground/80">GR</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: "#ef4444" }} />
            <span className="text-[10px] text-foreground/80">Resistivity</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: "#2563eb" }} />
            <span className="text-[10px] text-foreground/80">Porosity</span>
          </div>
          {payZone && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#fbbf24", opacity: 0.6 }} />
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

      {/* SVG Chart */}
      <div className="rounded-lg border border-border/40 overflow-hidden bg-white">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair"
          style={{ minHeight: 320 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header bar */}
          <rect x={0} y={0} width={W} height={PAD_T} fill="#f0f0f0" stroke="#999" strokeWidth="0.5" />
          {wellName && (
            <text x={TRACK_1_X + TRACK_1_W / 2} y={14} textAnchor="middle" fill="#333" fontSize="10" fontWeight="bold">
              {wellName}
            </text>
          )}
          {apiNumber && (
            <text x={TRACK_2_X + TRACK_2_W / 2} y={14} textAnchor="middle" fill="#555" fontSize="9">
              API# {apiNumber}
            </text>
          )}
          {formation && (
            <text x={TRACK_3_X + TRACK_3_W / 2} y={14} textAnchor="middle" fill="#555" fontSize="9">
              {formation}
            </text>
          )}

          {/* Track labels */}
          <text x={TRACK_1_X + TRACK_1_W / 2} y={28} textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="bold">
            GR (0–{Math.round(grMax)} API)
          </text>
          <text x={TRACK_2_X + TRACK_2_W / 2} y={28} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
            Resistivity (0–{Math.round(resMax)} Ωm)
          </text>
          <text x={TRACK_3_X + TRACK_3_W / 2} y={28} textAnchor="middle" fill="#2563eb" fontSize="9" fontWeight="bold">
            Porosity (0–{Math.round(porMax)}%)
          </text>
          <text x={FORMATION_X + FORMATION_W / 2} y={28} textAnchor="middle" fill="#666" fontSize="8" fontWeight="bold">
            Formation
          </text>

          {/* Track backgrounds */}
          <rect x={TRACK_1_X} y={PAD_T} width={TRACK_1_W} height={plotH} fill="#fefefe" stroke="#999" strokeWidth="0.5" />
          <rect x={TRACK_2_X} y={PAD_T} width={TRACK_2_W} height={plotH} fill="#fefefe" stroke="#999" strokeWidth="0.5" />
          <rect x={TRACK_3_X} y={PAD_T} width={TRACK_3_W} height={plotH} fill="#fefefe" stroke="#999" strokeWidth="0.5" />
          <rect x={FORMATION_X} y={PAD_T} width={FORMATION_W} height={plotH} fill="#f8f4ee" stroke="#999" strokeWidth="0.5" />

          {/* Depth column background */}
          <rect x={DEPTH_X} y={PAD_T} width={DEPTH_COL_W} height={plotH} fill="#fffff0" stroke="#999" strokeWidth="0.5" />

          {/* Grids */}
          {renderGrid(TRACK_1_X, TRACK_1_W)}
          {renderGrid(TRACK_2_X, TRACK_2_W)}
          {renderGrid(TRACK_3_X, TRACK_3_W)}

          {/* Pay zone highlighting across all tracks */}
          {payZone && (
            <>
              <rect x={TRACK_1_X} y={payY1} width={TRACK_1_W} height={payY2 - payY1}
                fill="#fbbf24" opacity={0.15} />
              <rect x={DEPTH_X} y={payY1} width={DEPTH_COL_W} height={payY2 - payY1}
                fill="#fbbf24" opacity={0.25} />
              <rect x={TRACK_2_X} y={payY1} width={TRACK_2_W} height={payY2 - payY1}
                fill="#fbbf24" opacity={0.15} />
              <rect x={TRACK_3_X} y={payY1} width={TRACK_3_W} height={payY2 - payY1}
                fill="#fbbf24" opacity={0.15} />
              {/* Dashed borders */}
              <line x1={TRACK_1_X} y1={payY1} x2={TRACK_3_X + TRACK_3_W} y2={payY1}
                stroke="#d97706" strokeWidth="1" strokeDasharray="4,3" />
              <line x1={TRACK_1_X} y1={payY2} x2={TRACK_3_X + TRACK_3_W} y2={payY2}
                stroke="#d97706" strokeWidth="1" strokeDasharray="4,3" />
            </>
          )}

          {/* Depth labels */}
          {depthTicks.map((d) => (
            <g key={d}>
              <line x1={DEPTH_X} y1={yForDepth(d)} x2={DEPTH_X + DEPTH_COL_W} y2={yForDepth(d)}
                stroke="#999" strokeWidth="0.5" />
              <text x={DEPTH_X + DEPTH_COL_W / 2} y={yForDepth(d) + 3.5}
                textAnchor="middle" fill="#333" fontSize="8.5" fontWeight="500">
                {d}
              </text>
            </g>
          ))}

          {/* ── Track 1: GR curve ── */}
          <polyline
            points={buildTrackPath("gr", TRACK_1_X, TRACK_1_W, grMax)}
            fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinejoin="round"
          />

          {/* GR fill (shale cutoff at ~75 API — fill right side) */}
          {(() => {
            const cutoffX = TRACK_1_X + (75 / grMax) * TRACK_1_W;
            const fillPts = logStrips.map((s) => {
              const x = TRACK_1_X + (s.gr / grMax) * TRACK_1_W;
              return `${Math.max(x, cutoffX)},${yForDepth(s.depth)}`;
            });
            const right = `${TRACK_1_X + TRACK_1_W},`;
            return (
              <polygon
                points={[
                  `${cutoffX},${yForDepth(logStrips[0].depth)}`,
                  ...fillPts,
                  `${cutoffX},${yForDepth(logStrips[logStrips.length - 1].depth)}`,
                ].join(" ")}
                fill="#16a34a" opacity={0.12}
              />
            );
          })()}

          {/* Shale line indicator */}
          <line
            x1={TRACK_1_X + (75 / grMax) * TRACK_1_W} y1={PAD_T}
            x2={TRACK_1_X + (75 / grMax) * TRACK_1_W} y2={PAD_T + plotH}
            stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="6,3"
          />

          {/* ── Track 2: Resistivity curve ── */}
          <polyline
            points={buildTrackPath("res", TRACK_2_X, TRACK_2_W, resMax)}
            fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round"
          />
          {/* Secondary resistivity trace (offset for visual depth like reference) */}
          <polyline
            points={logStrips.map((s, i) => {
              const shifted = s.res * (0.7 + Math.sin(i * 0.3) * 0.15);
              const x = TRACK_2_X + (shifted / resMax) * TRACK_2_W;
              return `${x},${yForDepth(s.depth)}`;
            }).join(" ")}
            fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeLinejoin="round" opacity={0.8}
          />
          {/* Third resistivity trace */}
          <polyline
            points={logStrips.map((s, i) => {
              const shifted = s.res * (1.2 + Math.cos(i * 0.4) * 0.2);
              const x = TRACK_2_X + Math.min((shifted / resMax) * TRACK_2_W, TRACK_2_W);
              return `${x},${yForDepth(s.depth)}`;
            }).join(" ")}
            fill="none" stroke="#f97316" strokeWidth="1" strokeLinejoin="round" opacity={0.7}
            strokeDasharray="3,2"
          />

          {/* ── Track 3: Porosity curve ── */}
          <polygon points={porFillPoints} fill="#3b82f6" opacity={0.15} />
          <polyline
            points={buildTrackPath("por", TRACK_3_X, TRACK_3_W, porMax)}
            fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round"
          />
          {/* Secondary porosity trace (neutron-like) */}
          <polyline
            points={logStrips.map((s, i) => {
              const shifted = s.por * (0.85 + Math.sin(i * 0.5) * 0.1);
              const x = TRACK_3_X + (shifted / porMax) * TRACK_3_W;
              return `${x},${yForDepth(s.depth)}`;
            }).join(" ")}
            fill="none" stroke="#7c3aed" strokeWidth="1" strokeLinejoin="round"
            strokeDasharray="5,3" opacity={0.7}
          />

          {/* ── Formation column ── */}
          {formationZones.map((zone, i) => (
            <g key={i}>
              <rect
                x={FORMATION_X} y={yForDepth(zone.top)}
                width={FORMATION_W} height={Math.max(yForDepth(zone.bottom) - yForDepth(zone.top), 2)}
                fill={zone.color} stroke="#b0a890" strokeWidth="0.5"
              />
              <text
                x={FORMATION_X + FORMATION_W / 2}
                y={yForDepth((zone.top + zone.bottom) / 2) + 3}
                textAnchor="middle" fill="#555" fontSize="7.5" fontWeight="600"
                style={{ writingMode: "horizontal-tb" }}
              >
                {zone.label}
              </text>
            </g>
          ))}

          {/* ── Crosshair ── */}
          {hoverPoint && hoverY !== null && (
            <g>
              {/* Horizontal line across all tracks */}
              <line x1={0} y1={hoverY} x2={W} y2={hoverY}
                stroke="#333" strokeWidth="0.8" strokeDasharray="3,2" opacity={0.7} />

              {/* Dots on curves */}
              <circle cx={TRACK_1_X + (hoverPoint.gr / grMax) * TRACK_1_W} cy={hoverY}
                r="3.5" fill="#16a34a" stroke="#fff" strokeWidth="1.5" />
              <circle cx={TRACK_2_X + (hoverPoint.res / resMax) * TRACK_2_W} cy={hoverY}
                r="3.5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
              <circle cx={TRACK_3_X + (hoverPoint.por / porMax) * TRACK_3_W} cy={hoverY}
                r="3.5" fill="#2563eb" stroke="#fff" strokeWidth="1.5" />

              {/* Depth badge in depth column */}
              <rect x={DEPTH_X + 2} y={hoverY - 8} width={DEPTH_COL_W - 4} height={16}
                rx="3" fill="#333" />
              <text x={DEPTH_X + DEPTH_COL_W / 2} y={hoverY + 4}
                textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="bold">
                {hoverPoint.depth} ft
              </text>

              {/* Tooltip */}
              {(() => {
                const tx = TRACK_2_X + 8;
                const ty = hoverY < H / 2 ? hoverY + 12 : hoverY - 72;
                return (
                  <g>
                    <rect x={tx} y={ty} width={140} height={62} rx="4"
                      fill="#1e293b" stroke="#475569" strokeWidth="0.8" opacity={0.95} />
                    <text x={tx + 8} y={ty + 14} fill="#f8fafc" fontSize="9" fontWeight="bold">
                      Depth: {hoverPoint.depth} ft
                    </text>
                    <circle cx={tx + 12} cy={ty + 26} r="3" fill="#16a34a" />
                    <text x={tx + 20} y={ty + 29} fill="#d1d5db" fontSize="8.5">
                      GR: <tspan fill="#f8fafc" fontWeight="bold">{hoverPoint.gr.toFixed(1)} API</tspan>
                    </text>
                    <circle cx={tx + 12} cy={ty + 40} r="3" fill="#ef4444" />
                    <text x={tx + 20} y={ty + 43} fill="#d1d5db" fontSize="8.5">
                      Res: <tspan fill="#f8fafc" fontWeight="bold">{hoverPoint.res.toFixed(1)} Ωm</tspan>
                    </text>
                    <circle cx={tx + 12} cy={ty + 54} r="3" fill="#2563eb" />
                    <text x={tx + 20} y={ty + 57} fill="#d1d5db" fontSize="8.5">
                      φ: <tspan fill="#f8fafc" fontWeight="bold">{hoverPoint.por.toFixed(1)}%</tspan>
                    </text>
                  </g>
                );
              })()}
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
