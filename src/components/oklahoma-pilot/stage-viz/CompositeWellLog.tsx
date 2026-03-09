import { useMemo, useState, useCallback, useRef } from "react";
import { Database, Activity } from "lucide-react";
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
const W = 760, H = 500;
const HEADER_H = 52;
const PAD_B = 16;
const DEPTH_COL_W = 48;

/* Track definitions */
const TRACK_1_X = 0;
const TRACK_1_W = 200;
const DEPTH_X = TRACK_1_X + TRACK_1_W;
const TRACK_2_X = DEPTH_X + DEPTH_COL_W;
const TRACK_2_W = 210;
const TRACK_3_X = TRACK_2_X + TRACK_2_W;
const TRACK_3_W = 160;
const FORMATION_X = TRACK_3_X + TRACK_3_W;
const FORMATION_W = W - FORMATION_X;

const plotH = H - HEADER_H - PAD_B;
const GRID_LINES = 10;

/* Color palette */
const COLORS = {
  bg: "#0f1729",
  headerBg: "#131d33",
  trackBg: "#0c1220",
  trackBorder: "#1e3a5f",
  depthBg: "#111b2e",
  formationBg: "#0e1525",
  grid: "#1a2d4a",
  gridMajor: "#243a5c",
  text: "#94a3b8",
  textBright: "#e2e8f0",
  gr: "#22c55e",
  grFill: "#22c55e",
  res: "#f43f5e",
  resSecondary: "#06b6d4",
  resTertiary: "#fb923c",
  por: "#3b82f6",
  porSecondary: "#a78bfa",
  porFill: "#3b82f6",
  shale: "#eab308",
  payZone: "#f59e0b",
  crosshair: "#60a5fa",
  tooltipBg: "#1e293b",
  tooltipBorder: "#334155",
};

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
    if (mouseY < HEADER_H || mouseY > H - PAD_B) {
      setHoverPoint(null); setHoverY(null); return;
    }
    const { depthMin, depthRange } = chartData;
    const depthAtMouse = depthMin + ((mouseY - HEADER_H) / plotH) * depthRange;
    let nearest = logStrips[0];
    let minDist = Math.abs(logStrips[0].depth - depthAtMouse);
    for (let i = 1; i < logStrips.length; i++) {
      const dist = Math.abs(logStrips[i].depth - depthAtMouse);
      if (dist < minDist) { minDist = dist; nearest = logStrips[i]; }
    }
    const snappedY = HEADER_H + ((nearest.depth - depthMin) / depthRange) * plotH;
    setHoverPoint(nearest);
    setHoverY(snappedY);
  }, [chartData, logStrips]);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null); setHoverY(null);
  }, []);

  /* Fill polygon for porosity */
  const porFillPoints = useMemo(() => {
    if (!chartData || logStrips.length === 0) return "";
    const { depthMin: dMin, depthRange: dRange, porMax: pMax } = chartData;
    const yFD = (d: number) => HEADER_H + ((d - dMin) / dRange) * plotH;
    const pts = logStrips.map((s) => {
      const x = TRACK_3_X + (s.por / pMax) * TRACK_3_W;
      return `${x},${yFD(s.depth)}`;
    });
    const topLeft = `${TRACK_3_X},${yFD(logStrips[0].depth)}`;
    const botLeft = `${TRACK_3_X},${yFD(logStrips[logStrips.length - 1].depth)}`;
    return [topLeft, ...pts, botLeft].join(" ");
  }, [logStrips, chartData]);

  /* Formation zones */
  const formationZones = useMemo(() => {
    if (!chartData || !payZone) return [];
    const { depthMin: dMin, depthMax: dMax, depthRange: dRange } = chartData;
    const zones: { top: number; bottom: number; label: string; color: string; pattern?: string }[] = [];
    if (payZone.top > dMin + dRange * 0.05) {
      zones.push({ top: dMin, bottom: payZone.top, label: "Overburden", color: "#1a2744", pattern: "dots" });
    }
    zones.push({ top: payZone.top, bottom: payZone.bottom, label: payZone.label, color: "#2a1f0a" });
    if (payZone.bottom < dMax - dRange * 0.05) {
      zones.push({ top: payZone.bottom, bottom: dMax, label: "Sub-pay", color: "#1a2244", pattern: "lines" });
    }
    return zones;
  }, [payZone, chartData]);

  if (!chartData) return null;

  const { depthMin, depthMax, depthRange, grMax, resMax, porMax } = chartData;
  const yForDepth = (d: number) => HEADER_H + ((d - depthMin) / depthRange) * plotH;

  /* Depth ticks */
  const depthStep = depthRange > 2000 ? 500 : depthRange > 800 ? 200 : depthRange > 300 ? 100 : depthRange > 100 ? 50 : 10;
  const depthTicks: number[] = [];
  for (let d = Math.ceil(depthMin / depthStep) * depthStep; d <= depthMax; d += depthStep) depthTicks.push(d);

  /* Path builders */
  const buildTrackPath = (key: "gr" | "res" | "por", trackX: number, trackW: number, vMax: number) =>
    logStrips.map((s) => {
      const x = trackX + (s[key] / vMax) * trackW;
      const y = yForDepth(s.depth);
      return `${x},${y}`;
    }).join(" ");

  /* Pay zone Y */
  const payY1 = payZone ? yForDepth(payZone.top) : 0;
  const payY2 = payZone ? yForDepth(payZone.bottom) : 0;

  /* Track grid */
  const renderGrid = (trackX: number, trackW: number) => {
    const lines = [];
    for (let i = 0; i <= GRID_LINES; i++) {
      const x = trackX + (i / GRID_LINES) * trackW;
      lines.push(
        <line key={`v${i}`} x1={x} y1={HEADER_H} x2={x} y2={HEADER_H + plotH}
          stroke={i === 0 || i === GRID_LINES ? COLORS.gridMajor : COLORS.grid}
          strokeWidth={i === 0 || i === GRID_LINES ? "0.8" : "0.3"} />
      );
    }
    for (const d of depthTicks) {
      const y = yForDepth(d);
      lines.push(
        <line key={`h${d}`} x1={trackX} y1={y} x2={trackX + trackW} y2={y}
          stroke={COLORS.grid} strokeWidth="0.3" />
      );
    }
    return lines;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground tracking-wide">Composite Well Log</h4>
            <p className="text-[10px] text-muted-foreground">Multi-track: GR · Resistivity · Porosity · Formation</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { color: COLORS.gr, label: "Gamma Ray" },
            { color: COLORS.res, label: "Resistivity" },
            { color: COLORS.por, label: "Porosity" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
              <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
          {payZone && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border" style={{ backgroundColor: `${COLORS.payZone}40`, borderColor: `${COLORS.payZone}60` }} />
              <span className="text-[10px] text-muted-foreground font-medium">Pay Zone</span>
            </div>
          )}
          {hasRealData && (
            <Badge variant="outline" className="text-[9px] border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1">
              <Database className="h-2.5 w-2.5" />REAL DATA
            </Badge>
          )}
          {isLoading && <span className="text-muted-foreground animate-pulse text-[9px]">Loading...</span>}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="rounded-xl border border-border/30 overflow-hidden shadow-2xl" style={{ background: COLORS.bg }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair select-none"
          style={{ minHeight: 360 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Glow filters */}
            <filter id="glowGr" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor={COLORS.gr} floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowRes" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor={COLORS.res} floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowPor" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor={COLORS.por} floodOpacity="0.4" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowCrosshair" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feFlood floodColor={COLORS.crosshair} floodOpacity="0.6" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Gradient for porosity fill */}
            <linearGradient id="porGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.porFill} stopOpacity="0.25" />
              <stop offset="100%" stopColor={COLORS.porFill} stopOpacity="0.05" />
            </linearGradient>
            {/* Gradient for GR fill */}
            <linearGradient id="grGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.grFill} stopOpacity="0.05" />
              <stop offset="100%" stopColor={COLORS.grFill} stopOpacity="0.2" />
            </linearGradient>
            {/* Pay zone gradient */}
            <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.payZone} stopOpacity="0.2" />
              <stop offset="50%" stopColor={COLORS.payZone} stopOpacity="0.12" />
              <stop offset="100%" stopColor={COLORS.payZone} stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* ── Header bar ── */}
          <rect x={0} y={0} width={W} height={HEADER_H} fill={COLORS.headerBg} />
          <line x1={0} y1={HEADER_H} x2={W} y2={HEADER_H} stroke={COLORS.trackBorder} strokeWidth="1" />

          {/* Track header labels - Row 1 */}
          {wellName && (
            <text x={TRACK_1_X + TRACK_1_W / 2} y={16} textAnchor="middle" fill={COLORS.textBright} fontSize="10" fontWeight="700" letterSpacing="0.5">
              {wellName}
            </text>
          )}
          {apiNumber && (
            <text x={TRACK_2_X + TRACK_2_W / 2} y={16} textAnchor="middle" fill={COLORS.text} fontSize="9" fontFamily="monospace">
              API# {apiNumber}
            </text>
          )}
          {formation && (
            <text x={TRACK_3_X + TRACK_3_W / 2} y={16} textAnchor="middle" fill={COLORS.text} fontSize="9">
              {formation}
            </text>
          )}

          {/* Track header labels - Row 2: Scale info */}
          <rect x={TRACK_1_X} y={24} width={TRACK_1_W} height={28} fill={`${COLORS.gr}08`} />
          <text x={TRACK_1_X + TRACK_1_W / 2} y={36} textAnchor="middle" fill={COLORS.gr} fontSize="9" fontWeight="700" letterSpacing="0.8">
            GAMMA RAY
          </text>
          <text x={TRACK_1_X + TRACK_1_W / 2} y={48} textAnchor="middle" fill={`${COLORS.gr}99`} fontSize="7.5" fontFamily="monospace">
            0 ——— {Math.round(grMax)} API
          </text>

          <rect x={TRACK_2_X} y={24} width={TRACK_2_W} height={28} fill={`${COLORS.res}08`} />
          <text x={TRACK_2_X + TRACK_2_W / 2} y={36} textAnchor="middle" fill={COLORS.res} fontSize="9" fontWeight="700" letterSpacing="0.8">
            RESISTIVITY
          </text>
          <text x={TRACK_2_X + TRACK_2_W / 2} y={48} textAnchor="middle" fill={`${COLORS.res}99`} fontSize="7.5" fontFamily="monospace">
            0 ——— {Math.round(resMax)} Ωm
          </text>

          <rect x={TRACK_3_X} y={24} width={TRACK_3_W} height={28} fill={`${COLORS.por}08`} />
          <text x={TRACK_3_X + TRACK_3_W / 2} y={36} textAnchor="middle" fill={COLORS.por} fontSize="9" fontWeight="700" letterSpacing="0.8">
            POROSITY
          </text>
          <text x={TRACK_3_X + TRACK_3_W / 2} y={48} textAnchor="middle" fill={`${COLORS.por}99`} fontSize="7.5" fontFamily="monospace">
            0 ——— {Math.round(porMax)}%
          </text>

          <rect x={FORMATION_X} y={24} width={FORMATION_W} height={28} fill="#ffffff06" />
          <text x={FORMATION_X + FORMATION_W / 2} y={40} textAnchor="middle" fill={COLORS.text} fontSize="8" fontWeight="700" letterSpacing="1">
            FORMATION
          </text>

          {/* Depth column header */}
          <rect x={DEPTH_X} y={24} width={DEPTH_COL_W} height={28} fill="#ffffff06" />
          <text x={DEPTH_X + DEPTH_COL_W / 2} y={36} textAnchor="middle" fill={COLORS.text} fontSize="7" fontWeight="700" letterSpacing="0.5">
            DEPTH
          </text>
          <text x={DEPTH_X + DEPTH_COL_W / 2} y={47} textAnchor="middle" fill={`${COLORS.text}88`} fontSize="7">
            (ft)
          </text>

          {/* ── Track backgrounds ── */}
          <rect x={TRACK_1_X} y={HEADER_H} width={TRACK_1_W} height={plotH} fill={COLORS.trackBg} />
          <rect x={TRACK_2_X} y={HEADER_H} width={TRACK_2_W} height={plotH} fill={COLORS.trackBg} />
          <rect x={TRACK_3_X} y={HEADER_H} width={TRACK_3_W} height={plotH} fill={COLORS.trackBg} />
          <rect x={FORMATION_X} y={HEADER_H} width={FORMATION_W} height={plotH} fill={COLORS.formationBg} />
          <rect x={DEPTH_X} y={HEADER_H} width={DEPTH_COL_W} height={plotH} fill={COLORS.depthBg} />

          {/* Track borders */}
          {[TRACK_1_X, DEPTH_X, TRACK_2_X, TRACK_3_X, FORMATION_X].map((x, i) => (
            <line key={`tb${i}`} x1={x} y1={HEADER_H} x2={x} y2={H - PAD_B}
              stroke={COLORS.trackBorder} strokeWidth="0.8" />
          ))}
          <line x1={W} y1={HEADER_H} x2={W} y2={H - PAD_B} stroke={COLORS.trackBorder} strokeWidth="0.8" />
          {/* Bottom line */}
          <line x1={0} y1={H - PAD_B} x2={W} y2={H - PAD_B} stroke={COLORS.trackBorder} strokeWidth="0.8" />

          {/* ── Grids ── */}
          {renderGrid(TRACK_1_X, TRACK_1_W)}
          {renderGrid(TRACK_2_X, TRACK_2_W)}
          {renderGrid(TRACK_3_X, TRACK_3_W)}

          {/* ── Pay zone highlighting ── */}
          {payZone && (
            <>
              <rect x={TRACK_1_X} y={payY1} width={TRACK_1_W} height={payY2 - payY1} fill="url(#payGrad)" />
              <rect x={DEPTH_X} y={payY1} width={DEPTH_COL_W} height={payY2 - payY1} fill={`${COLORS.payZone}20`} />
              <rect x={TRACK_2_X} y={payY1} width={TRACK_2_W} height={payY2 - payY1} fill="url(#payGrad)" />
              <rect x={TRACK_3_X} y={payY1} width={TRACK_3_W} height={payY2 - payY1} fill="url(#payGrad)" />
              {/* Glow borders */}
              <line x1={TRACK_1_X} y1={payY1} x2={TRACK_3_X + TRACK_3_W} y2={payY1}
                stroke={COLORS.payZone} strokeWidth="1.2" strokeDasharray="6,4" opacity={0.7} />
              <line x1={TRACK_1_X} y1={payY2} x2={TRACK_3_X + TRACK_3_W} y2={payY2}
                stroke={COLORS.payZone} strokeWidth="1.2" strokeDasharray="6,4" opacity={0.7} />
            </>
          )}

          {/* ── Depth labels ── */}
          {depthTicks.map((d) => (
            <g key={d}>
              <line x1={DEPTH_X} y1={yForDepth(d)} x2={DEPTH_X + DEPTH_COL_W} y2={yForDepth(d)}
                stroke={COLORS.gridMajor} strokeWidth="0.5" />
              <text x={DEPTH_X + DEPTH_COL_W / 2} y={yForDepth(d) + 3.5}
                textAnchor="middle" fill={COLORS.textBright} fontSize="8" fontWeight="600" fontFamily="monospace">
                {d}
              </text>
            </g>
          ))}

          {/* ══════ Track 1: GR curve ══════ */}
          {/* GR shale fill */}
          {(() => {
            const cutoffX = TRACK_1_X + (75 / grMax) * TRACK_1_W;
            const fillPts = logStrips.map((s) => {
              const x = TRACK_1_X + (s.gr / grMax) * TRACK_1_W;
              return `${Math.max(x, cutoffX)},${yForDepth(s.depth)}`;
            });
            return (
              <polygon
                points={[
                  `${cutoffX},${yForDepth(logStrips[0].depth)}`,
                  ...fillPts,
                  `${cutoffX},${yForDepth(logStrips[logStrips.length - 1].depth)}`,
                ].join(" ")}
                fill="url(#grGrad)"
              />
            );
          })()}
          {/* Shale cutoff line */}
          <line
            x1={TRACK_1_X + (75 / grMax) * TRACK_1_W} y1={HEADER_H}
            x2={TRACK_1_X + (75 / grMax) * TRACK_1_W} y2={HEADER_H + plotH}
            stroke={COLORS.shale} strokeWidth="0.6" strokeDasharray="4,4" opacity={0.5}
          />
          {/* GR curve with glow */}
          <polyline
            points={buildTrackPath("gr", TRACK_1_X, TRACK_1_W, grMax)}
            fill="none" stroke={COLORS.gr} strokeWidth="1.6" strokeLinejoin="round"
            filter="url(#glowGr)"
          />

          {/* ══════ Track 2: Resistivity curves ══════ */}
          {/* Secondary trace */}
          <polyline
            points={logStrips.map((s, i) => {
              const shifted = s.res * (0.7 + Math.sin(i * 0.3) * 0.15);
              const x = TRACK_2_X + (shifted / resMax) * TRACK_2_W;
              return `${x},${yForDepth(s.depth)}`;
            }).join(" ")}
            fill="none" stroke={COLORS.resSecondary} strokeWidth="1" strokeLinejoin="round" opacity={0.6}
          />
          {/* Tertiary trace */}
          <polyline
            points={logStrips.map((s, i) => {
              const shifted = s.res * (1.2 + Math.cos(i * 0.4) * 0.2);
              const x = TRACK_2_X + Math.min((shifted / resMax) * TRACK_2_W, TRACK_2_W);
              return `${x},${yForDepth(s.depth)}`;
            }).join(" ")}
            fill="none" stroke={COLORS.resTertiary} strokeWidth="0.8" strokeLinejoin="round" opacity={0.5}
            strokeDasharray="3,2"
          />
          {/* Primary resistivity with glow */}
          <polyline
            points={buildTrackPath("res", TRACK_2_X, TRACK_2_W, resMax)}
            fill="none" stroke={COLORS.res} strokeWidth="1.6" strokeLinejoin="round"
            filter="url(#glowRes)"
          />

          {/* ══════ Track 3: Porosity curves ══════ */}
          <polygon points={porFillPoints} fill="url(#porGrad)" />
          {/* Secondary porosity trace */}
          <polyline
            points={logStrips.map((s, i) => {
              const shifted = s.por * (0.85 + Math.sin(i * 0.5) * 0.1);
              const x = TRACK_3_X + (shifted / porMax) * TRACK_3_W;
              return `${x},${yForDepth(s.depth)}`;
            }).join(" ")}
            fill="none" stroke={COLORS.porSecondary} strokeWidth="0.8" strokeLinejoin="round"
            strokeDasharray="5,3" opacity={0.5}
          />
          {/* Primary porosity with glow */}
          <polyline
            points={buildTrackPath("por", TRACK_3_X, TRACK_3_W, porMax)}
            fill="none" stroke={COLORS.por} strokeWidth="1.6" strokeLinejoin="round"
            filter="url(#glowPor)"
          />

          {/* ══════ Formation column ══════ */}
          {formationZones.map((zone, i) => {
            const zt = yForDepth(zone.top);
            const zb = yForDepth(zone.bottom);
            const zh = Math.max(zb - zt, 2);
            return (
              <g key={i}>
                <rect x={FORMATION_X} y={zt} width={FORMATION_W} height={zh}
                  fill={zone.color} stroke={COLORS.trackBorder} strokeWidth="0.4" />
                {/* Lithology pattern dots for overburden */}
                {zone.pattern === "dots" && Array.from({ length: Math.min(Math.floor(zh / 8), 20) }).map((_, j) => (
                  <circle key={j}
                    cx={FORMATION_X + 10 + (j % 3) * 12 + (Math.floor(j / 3) % 2) * 6}
                    cy={zt + 6 + Math.floor(j / 3) * 8}
                    r="1" fill={`${COLORS.text}30`}
                  />
                ))}
                {/* Lithology pattern lines for sub-pay */}
                {zone.pattern === "lines" && Array.from({ length: Math.min(Math.floor(zh / 6), 20) }).map((_, j) => (
                  <line key={j}
                    x1={FORMATION_X + 4} y1={zt + 4 + j * 6}
                    x2={FORMATION_X + FORMATION_W - 4} y2={zt + 4 + j * 6}
                    stroke={`${COLORS.text}18`} strokeWidth="0.5"
                  />
                ))}
                <text
                  x={FORMATION_X + FORMATION_W / 2}
                  y={zt + zh / 2 + 3}
                  textAnchor="middle" fill={zone.label === payZone?.label ? COLORS.payZone : COLORS.text}
                  fontSize="7.5" fontWeight="700" letterSpacing="0.5"
                >
                  {zone.label}
                </text>
              </g>
            );
          })}

          {/* ══════ Crosshair ══════ */}
          {hoverPoint && hoverY !== null && (
            <g>
              {/* Horizontal scanline */}
              <line x1={0} y1={hoverY} x2={W} y2={hoverY}
                stroke={COLORS.crosshair} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.6}
                filter="url(#glowCrosshair)" />

              {/* Curve intersection dots */}
              {[
                { cx: TRACK_1_X + (hoverPoint.gr / grMax) * TRACK_1_W, color: COLORS.gr },
                { cx: TRACK_2_X + (hoverPoint.res / resMax) * TRACK_2_W, color: COLORS.res },
                { cx: TRACK_3_X + (hoverPoint.por / porMax) * TRACK_3_W, color: COLORS.por },
              ].map(({ cx, color }, i) => (
                <g key={i}>
                  <circle cx={cx} cy={hoverY} r="5" fill={color} opacity={0.2} />
                  <circle cx={cx} cy={hoverY} r="3" fill={color} stroke={COLORS.bg} strokeWidth="1.5" />
                </g>
              ))}

              {/* Depth badge */}
              <rect x={DEPTH_X + 2} y={hoverY - 9} width={DEPTH_COL_W - 4} height={18}
                rx="4" fill={COLORS.crosshair} opacity={0.9} />
              <text x={DEPTH_X + DEPTH_COL_W / 2} y={hoverY + 4}
                textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="800" fontFamily="monospace">
                {hoverPoint.depth}'
              </text>

              {/* Floating tooltip */}
              {(() => {
                const tx = TRACK_2_X + 10;
                const ty = hoverY < H / 2 ? hoverY + 14 : hoverY - 88;
                const rows = [
                  { icon: COLORS.gr, label: "GR", value: `${hoverPoint.gr.toFixed(1)} API` },
                  { icon: COLORS.res, label: "Res", value: `${hoverPoint.res.toFixed(1)} Ωm` },
                  { icon: COLORS.por, label: "φ", value: `${hoverPoint.por.toFixed(1)}%` },
                ];
                return (
                  <g>
                    {/* Shadow */}
                    <rect x={tx + 2} y={ty + 2} width={150} height={78} rx="6" fill="#000" opacity={0.3} />
                    {/* Card */}
                    <rect x={tx} y={ty} width={150} height={78} rx="6"
                      fill={COLORS.tooltipBg} stroke={COLORS.tooltipBorder} strokeWidth="1" />
                    {/* Header */}
                    <rect x={tx} y={ty} width={150} height={20} rx="6" fill={`${COLORS.crosshair}15`} />
                    <rect x={tx} y={ty + 14} width={150} height={6} fill={COLORS.tooltipBg} />
                    <text x={tx + 10} y={ty + 14} fill={COLORS.crosshair} fontSize="9" fontWeight="800" fontFamily="monospace">
                      ⬥ {hoverPoint.depth} ft
                    </text>
                    {/* Data rows */}
                    {rows.map((r, i) => (
                      <g key={i}>
                        <circle cx={tx + 14} cy={ty + 33 + i * 16} r="3.5" fill={r.icon} opacity={0.9} />
                        <text x={tx + 24} y={ty + 36 + i * 16} fill={COLORS.text} fontSize="8.5" fontWeight="500">
                          {r.label}:
                        </text>
                        <text x={tx + 140} y={ty + 36 + i * 16} textAnchor="end" fill={COLORS.textBright} fontSize="9" fontWeight="700" fontFamily="monospace">
                          {r.value}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Footer */}
      {formation && (
        <div className="flex justify-between text-[9px] text-muted-foreground px-1">
          <span className="font-medium">Formation: <span className="text-foreground/80">{formation}</span></span>
          <span>{logStrips.length} data points · {depthMin}–{depthMax} ft</span>
        </div>
      )}
    </div>
  );
};

export default CompositeWellLog;
