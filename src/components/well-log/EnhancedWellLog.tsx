import { useMemo, useState, useCallback, useRef } from "react";
import { Activity, Database, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useWellLogs, WellLogPoint } from "@/hooks/useWellLogs";

/* ── Interpolation ── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpNull = (a: number | null, b: number | null, t: number): number | null =>
  a === null || b === null ? null : lerp(a, b, t);

const hermiteInterp = (pts: { x: number; y: number }[], xT: number): number => {
  let i = 0;
  while (i < pts.length - 2 && pts[i + 1].x < xT) i++;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const h = p2.x - p1.x;
  if (h === 0) return p1.y;
  const t = (xT - p1.x) / h;
  const m1 = ((p2.y - p0.y) / (p2.x - p0.x || 1)) * h;
  const m2 = ((p3.y - p1.y) / (p3.x - p1.x || 1)) * h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1.y + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2.y + (t3 - t2) * m2;
};

interface DataPoint {
  depth: number;
  gr: number;
  sp: number;
  res: number;
  por: number;
  sw: number;
  rhob: number | null;
  nphi: number | null;
}

const interpolateData = (data: DataPoint[], maxStep: number): DataPoint[] => {
  if (data.length < 2) return data;
  const result: DataPoint[] = [];
  const tracks = {
    gr: data.map(p => ({ x: p.depth, y: p.gr })),
    sp: data.map(p => ({ x: p.depth, y: p.sp })),
    res: data.map(p => ({ x: p.depth, y: p.res })),
    por: data.map(p => ({ x: p.depth, y: p.por })),
    sw: data.map(p => ({ x: p.depth, y: p.sw })),
  };
  for (let i = 0; i < data.length - 1; i++) {
    result.push(data[i]);
    const gap = data[i + 1].depth - data[i].depth;
    if (gap <= maxStep) continue;
    const n = Math.ceil(gap / maxStep) - 1;
    for (let j = 1; j <= n; j++) {
      const t = j / (n + 1);
      const d = lerp(data[i].depth, data[i + 1].depth, t);
      result.push({
        depth: Math.round(d * 10) / 10,
        gr: Math.max(0, hermiteInterp(tracks.gr, d)),
        sp: hermiteInterp(tracks.sp, d),
        res: Math.max(0.01, hermiteInterp(tracks.res, d)),
        por: Math.max(0, Math.min(50, hermiteInterp(tracks.por, d))),
        sw: Math.max(0, Math.min(100, hermiteInterp(tracks.sw, d))),
        rhob: lerpNull(data[i].rhob, data[i + 1].rhob, t),
        nphi: lerpNull(data[i].nphi, data[i + 1].nphi, t),
      });
    }
  }
  result.push(data[data.length - 1]);
  return result;
};

/* ── Layout ── */
const LITH_W = 80;
const GR_W = 180;
const DEPTH_W = 50;
const RES_W = 190;
const POR_W = 160;
const COR_W = 60;
const TOTAL_W = LITH_W + GR_W + DEPTH_W + RES_W + POR_W + COR_W;
const HEADER_H = 60;
const PAD_B = 10;

const LITH_X = 0;
const GR_X = LITH_W;
const DEPTH_X = GR_X + GR_W;
const RES_X = DEPTH_X + DEPTH_W;
const POR_X = RES_X + RES_W;
const COR_X = POR_X + POR_W;

const C = {
  bg: "#0a0f1c",
  headerBg: "#0d1527",
  trackBg: "#0b1220",
  grid: "#152040",
  gridMajor: "#1e2d55",
  border: "#1a2d55",
  text: "#8899bb",
  textBright: "#d0daf0",
  gr: "#22c55e",
  sp: "#38bdf8",
  cal: "#e879f9",
  resDeep: "#ef4444",
  resMed: "#818cf8",
  resShallow: "#fb923c",
  nphi: "#a78bfa",
  rhob: "#1e293b",
  nphiFill: "#a78bfa",
  payZone: "#eab308",
  crosshair: "#60a5fa",
  tooltipBg: "#131d33",
  shaleFill: "#8b8b2a",
  limeFill: "#2563eb",
  sandFill: "#d97706",
  dolomiteFill: "#7c3aed",
};

/* ── Lithology patterns ── */
const getLithology = (gr: number): { type: string; fill: string; label: string } => {
  if (gr > 100) return { type: "shale", fill: C.shaleFill, label: "Shale" };
  if (gr > 75) return { type: "silt", fill: "#6b7280", label: "Siltstone" };
  if (gr > 50) return { type: "lime", fill: C.limeFill, label: "Limestone" };
  if (gr > 30) return { type: "dolo", fill: C.dolomiteFill, label: "Dolomite" };
  return { type: "sand", fill: C.sandFill, label: "Sandstone" };
};

interface PayZone {
  top: number; bottom: number; label: string;
}

/* ── Component ── */
interface EnhancedWellLogProps {
  wellId: string;
  wellName: string;
  formation?: string | null;
  defaultExpanded?: boolean;
}

const EnhancedWellLog = ({ wellId, wellName, formation, defaultExpanded = true }: EnhancedWellLogProps) => {
  const { data: rawLogs, isLoading, hasRealData } = useWellLogs(wellId);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ point: DataPoint; y: number } | null>(null);

  // Convert raw data
  const allData = useMemo<DataPoint[]>(() => {
    if (!rawLogs || rawLogs.length === 0) return [];
    const mapped = rawLogs.map(p => ({
      depth: p.measured_depth,
      gr: p.gamma_ray ?? 50,
      sp: p.sp ?? -10,
      res: p.resistivity ?? 5,
      por: p.porosity ?? 5,
      sw: p.water_saturation ?? 50,
      rhob: p.density,
      nphi: p.neutron_porosity,
    }));
    return interpolateData(mapped, 15);
  }, [rawLogs]);

  const depthMin = useMemo(() => allData.length ? allData[0].depth : 0, [allData]);
  const depthMax = useMemo(() => allData.length ? allData[allData.length - 1].depth : 100, [allData]);
  const depthRange = depthMax - depthMin || 1;

  // Zoom/scroll
  const visibleSpan = depthRange / zoomFactor;
  const maxOffset = Math.max(0, depthRange - visibleSpan);
  const viewMin = depthMin + Math.min(scrollOffset, maxOffset);
  const viewMax = viewMin + visibleSpan;
  const visibleData = allData.filter(p => p.depth >= viewMin && p.depth <= viewMax);

  const plotH = Math.max(400, Math.min(1000, visibleData.length * 4));
  const totalH = HEADER_H + plotH + PAD_B;

  const yForDepth = useCallback((d: number) =>
    HEADER_H + ((d - viewMin) / visibleSpan) * plotH
  , [viewMin, visibleSpan, plotH]);

  // Pay zones
  const payZones = useMemo<PayZone[]>(() => {
    if (allData.length < 5) return [];
    const zones: PayZone[] = [];
    let inZone = false, zStart = 0;
    for (const pt of allData) {
      const isPay = pt.gr < 75 && pt.por > 6 && pt.res > 5;
      if (isPay && !inZone) { inZone = true; zStart = pt.depth; }
      if (!isPay && inZone) {
        if (pt.depth - zStart > 10) zones.push({ top: zStart, bottom: pt.depth, label: formation || "Pay" });
        inZone = false;
      }
    }
    if (inZone) zones.push({ top: zStart, bottom: allData[allData.length - 1].depth, label: formation || "Pay" });
    return zones;
  }, [allData, formation]);

  // Has NPHI/RHOB
  const hasDenNphi = useMemo(() => allData.some(p => p.rhob !== null || p.nphi !== null), [allData]);

  // Depth ticks
  const depthStep = visibleSpan > 2000 ? 500 : visibleSpan > 800 ? 200 : visibleSpan > 300 ? 100 : visibleSpan > 100 ? 50 : 10;
  const depthTicks: number[] = [];
  for (let d = Math.ceil(viewMin / depthStep) * depthStep; d <= viewMax; d += depthStep) depthTicks.push(d);

  // Mouse interactions
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      setZoomFactor(prev => Math.max(1, Math.min(10, prev + (e.deltaY > 0 ? -0.3 : 0.3))));
    } else {
      setScrollOffset(prev => Math.max(0, Math.min(maxOffset, prev + e.deltaY * 2)));
    }
  }, [maxOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || visibleData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const my = ((e.clientY - rect.top) / rect.height) * totalH;
    if (my < HEADER_H || my > totalH - PAD_B) { setHoverData(null); return; }
    const depthAtMouse = viewMin + ((my - HEADER_H) / plotH) * visibleSpan;
    let nearest = visibleData[0], minDist = Math.abs(visibleData[0].depth - depthAtMouse);
    for (const pt of visibleData) {
      const dist = Math.abs(pt.depth - depthAtMouse);
      if (dist < minDist) { minDist = dist; nearest = pt; }
    }
    setHoverData({ point: nearest, y: yForDepth(nearest.depth) });
  }, [visibleData, viewMin, visibleSpan, plotH, totalH, yForDepth]);

  const handleExportPNG = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement("a");
      link.download = `${wellName.replace(/\s+/g, "_")}_composite_log.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Well log exported as PNG");
    } catch { toast.error("Export failed"); }
  }, [wellName]);

  // Path builders
  const buildPath = useCallback((data: DataPoint[], key: keyof DataPoint, trackX: number, trackW: number, vMin: number, vMax: number, logScale = false) => {
    return data.map(pt => {
      const v = pt[key] as number;
      let norm: number;
      if (logScale) {
        const logMin = Math.log10(Math.max(0.1, vMin));
        const logMax = Math.log10(Math.max(1, vMax));
        norm = (Math.log10(Math.max(0.1, v)) - logMin) / (logMax - logMin);
      } else {
        norm = (v - vMin) / (vMax - vMin);
      }
      const x = trackX + Math.max(0, Math.min(1, norm)) * trackW;
      return `${x},${yForDepth(pt.depth)}`;
    }).join(" ");
  }, [yForDepth]);

  // Grid renderer
  const renderGrid = useCallback((trackX: number, trackW: number, divisions = 10) => {
    const lines = [];
    for (let i = 0; i <= divisions; i++) {
      const x = trackX + (i / divisions) * trackW;
      lines.push(<line key={`v${trackX}_${i}`} x1={x} y1={HEADER_H} x2={x} y2={HEADER_H + plotH}
        stroke={i === 0 || i === divisions ? C.gridMajor : C.grid} strokeWidth={i === 0 || i === divisions ? "0.6" : "0.25"} />);
    }
    for (const d of depthTicks) {
      const y = yForDepth(d);
      lines.push(<line key={`h${trackX}_${d}`} x1={trackX} y1={y} x2={trackX + trackW} y2={y}
        stroke={C.grid} strokeWidth="0.25" />);
    }
    return lines;
  }, [depthTicks, yForDepth, plotH]);

  if (!hasRealData && !isLoading) return null;
  if (isLoading) return (
    <div className="p-3 text-xs text-muted-foreground flex items-center gap-2 border border-border/30 rounded-lg">
      <Activity className="h-3.5 w-3.5 animate-spin text-primary" />Loading well log…
    </div>
  );

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      {/* Header toggle */}
      <button onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors text-left">
        <div className="flex items-center gap-2 text-xs">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold">Composite Well Log</span>
          <span className="text-muted-foreground">Multi-track log display — scroll to zoom, drag to pan</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { color: C.gr, label: "GR" }, { color: C.sp, label: "SP" },
            { color: C.resDeep, label: "Res Deep" }, { color: C.resMed, label: "Res Med" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-[2px] rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
          {hasDenNphi && <>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-[2px] rounded-full" style={{ backgroundColor: C.nphi }} />
              <span className="text-[9px] text-muted-foreground">NPHI</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-[2px] rounded-full" style={{ backgroundColor: "#94a3b8" }} />
              <span className="text-[9px] text-muted-foreground">RHOB</span>
            </div>
          </>}
          {hasRealData && (
            <Badge variant="outline" className="text-[9px] h-4 border-success/40 bg-success/10 text-success gap-1">
              <Database className="h-2.5 w-2.5" />REAL DATA
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div ref={containerRef} className="p-2 space-y-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 border border-border/50 rounded px-2 py-1">
              <button onClick={() => setZoomFactor(z => Math.min(10, z + 0.5))} className="p-0.5 hover:bg-muted rounded"><ZoomIn className="h-3.5 w-3.5" /></button>
              <span className="text-muted-foreground min-w-[36px] text-center">{Math.round(zoomFactor * 100)}%</span>
              <button onClick={() => setZoomFactor(z => Math.max(1, z - 0.5))} className="p-0.5 hover:bg-muted rounded"><ZoomOut className="h-3.5 w-3.5" /></button>
              {zoomFactor > 1 && <button onClick={() => { setZoomFactor(1); setScrollOffset(0); }} className="p-0.5 hover:bg-muted rounded"><RotateCcw className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
            <span className="text-muted-foreground">Ctrl+Scroll to zoom · Scroll to pan</span>
            <button onClick={handleExportPNG} className="flex items-center gap-1 border border-border/50 rounded px-2 py-1 hover:bg-muted ml-auto">
              <Download className="h-3.5 w-3.5" /><span>PNG</span>
            </button>
          </div>

          {/* SVG Well Log */}
          <div className="rounded-lg border border-border/30 overflow-hidden" style={{ background: C.bg }} onWheel={handleWheel}>
            <svg ref={svgRef} viewBox={`0 0 ${TOTAL_W} ${totalH}`} className="w-full cursor-crosshair select-none"
              style={{ minHeight: 400 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverData(null)}>
              <defs>
                <filter id="ewl-glow-gr"><feGaussianBlur stdDeviation="1.5" result="b" /><feFlood floodColor={C.gr} floodOpacity="0.4" /><feComposite in2="b" operator="in" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="ewl-glow-res"><feGaussianBlur stdDeviation="1.5" result="b" /><feFlood floodColor={C.resDeep} floodOpacity="0.4" /><feComposite in2="b" operator="in" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <linearGradient id="ewl-nphi-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.nphiFill} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={C.nphiFill} stopOpacity="0.08" />
                </linearGradient>
                {/* Lithology patterns */}
                <pattern id="pat-shale" patternUnits="userSpaceOnUse" width="12" height="6">
                  <line x1="0" y1="3" x2="12" y2="3" stroke={C.shaleFill} strokeWidth="0.8" opacity="0.6" />
                  <line x1="3" y1="0" x2="3" y2="6" stroke={C.shaleFill} strokeWidth="0.3" opacity="0.3" />
                </pattern>
                <pattern id="pat-sand" patternUnits="userSpaceOnUse" width="8" height="8">
                  <circle cx="2" cy="2" r="0.8" fill={C.sandFill} opacity="0.5" />
                  <circle cx="6" cy="6" r="0.8" fill={C.sandFill} opacity="0.5" />
                  <circle cx="6" cy="2" r="0.5" fill={C.sandFill} opacity="0.3" />
                </pattern>
                <pattern id="pat-lime" patternUnits="userSpaceOnUse" width="14" height="10">
                  <rect width="14" height="10" fill="none" />
                  <line x1="0" y1="5" x2="14" y2="5" stroke={C.limeFill} strokeWidth="0.5" opacity="0.4" />
                  <line x1="3" y1="0" x2="3" y2="5" stroke={C.limeFill} strokeWidth="0.3" opacity="0.3" />
                  <line x1="10" y1="5" x2="10" y2="10" stroke={C.limeFill} strokeWidth="0.3" opacity="0.3" />
                </pattern>
                <pattern id="pat-dolo" patternUnits="userSpaceOnUse" width="12" height="10">
                  <line x1="0" y1="5" x2="12" y2="5" stroke={C.dolomiteFill} strokeWidth="0.5" opacity="0.4" />
                  <line x1="3" y1="0" x2="3" y2="5" stroke={C.dolomiteFill} strokeWidth="0.3" opacity="0.3" />
                  <line x1="9" y1="5" x2="9" y2="10" stroke={C.dolomiteFill} strokeWidth="0.3" opacity="0.3" />
                  <path d="M6,2 L8,4 L4,4 Z" fill={C.dolomiteFill} opacity="0.25" />
                </pattern>
                <pattern id="pat-silt" patternUnits="userSpaceOnUse" width="10" height="6">
                  <line x1="0" y1="3" x2="10" y2="3" stroke="#6b7280" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="5" cy="1" r="0.5" fill="#6b7280" opacity="0.3" />
                </pattern>
              </defs>

              {/* ═══ HEADER ═══ */}
              <rect width={TOTAL_W} height={HEADER_H} fill={C.headerBg} />
              <line x1={0} y1={HEADER_H} x2={TOTAL_W} y2={HEADER_H} stroke={C.border} />

              {/* Track headers */}
              <text x={LITH_X + LITH_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">LITH</text>
              
              <text x={GR_X + GR_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">GR / SP / CAL</text>
              <text x={GR_X + GR_W / 2} y={30} textAnchor="middle" fill={C.gr} fontSize="7" fontFamily="monospace">GR: 0–150 API</text>
              <text x={GR_X + GR_W / 2} y={42} textAnchor="middle" fill={C.sp} fontSize="7" fontFamily="monospace">SP: -80/+20 mV</text>
              <text x={GR_X + GR_W / 2} y={54} textAnchor="middle" fill={C.cal} fontSize="7" fontFamily="monospace">CAL: 6–12 in</text>

              <text x={DEPTH_X + DEPTH_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">DEPTH</text>

              <text x={RES_X + RES_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">RESISTIVITY</text>
              <text x={RES_X + RES_W / 2} y={30} textAnchor="middle" fill={C.resDeep} fontSize="7" fontFamily="monospace">RS: 0.2–2000 Ωm</text>
              <text x={RES_X + RES_W / 2} y={42} textAnchor="middle" fill={C.resMed} fontSize="7" fontFamily="monospace">RM: 0.2–2000</text>
              <text x={RES_X + RES_W / 2} y={54} textAnchor="middle" fill={C.resShallow} fontSize="7" fontFamily="monospace">RS: 0.2–2000</text>

              <text x={POR_X + POR_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">POR / DEN</text>
              <text x={POR_X + POR_W / 2} y={30} textAnchor="middle" fill={C.nphi} fontSize="7" fontFamily="monospace">NPHI: 0.45–0</text>
              <text x={POR_X + POR_W / 2} y={42} textAnchor="middle" fill={C.text} fontSize="7" fontFamily="monospace">RHOB: 1.9–2.9</text>

              <text x={COR_X + COR_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">COR</text>

              {/* ═══ TRACK BACKGROUNDS ═══ */}
              <rect x={LITH_X} y={HEADER_H} width={LITH_W} height={plotH} fill="#0d1424" />
              <rect x={GR_X} y={HEADER_H} width={GR_W} height={plotH} fill={C.trackBg} />
              <rect x={DEPTH_X} y={HEADER_H} width={DEPTH_W} height={plotH} fill="#0e1628" />
              <rect x={RES_X} y={HEADER_H} width={RES_W} height={plotH} fill={C.trackBg} />
              <rect x={POR_X} y={HEADER_H} width={POR_W} height={plotH} fill={C.trackBg} />
              <rect x={COR_X} y={HEADER_H} width={COR_W} height={plotH} fill="#0d1220" />

              {/* Track borders */}
              {[LITH_X, GR_X, DEPTH_X, RES_X, POR_X, COR_X, TOTAL_W].map((x, i) => (
                <line key={`b${i}`} x1={x} y1={HEADER_H} x2={x} y2={HEADER_H + plotH} stroke={C.border} strokeWidth="0.6" />
              ))}
              <line x1={0} y1={HEADER_H + plotH} x2={TOTAL_W} y2={HEADER_H + plotH} stroke={C.border} />

              {/* ═══ GRIDS ═══ */}
              {renderGrid(GR_X, GR_W)}
              {renderGrid(RES_X, RES_W)}
              {renderGrid(POR_X, POR_W)}

              {/* ═══ PAY ZONES ═══ */}
              {payZones.map((pz, i) => {
                const y1 = yForDepth(pz.top), y2 = yForDepth(pz.bottom);
                return (
                  <g key={`pz${i}`}>
                    {[GR_X, RES_X, POR_X].map((tx, ti) => (
                      <rect key={ti} x={tx} y={y1} width={ti === 0 ? GR_W : ti === 1 ? RES_W : POR_W}
                        height={y2 - y1} fill={`${C.payZone}15`} />
                    ))}
                    <line x1={LITH_X} y1={y1} x2={COR_X + COR_W} y2={y1} stroke={C.payZone} strokeWidth="0.8" strokeDasharray="6,4" opacity={0.6} />
                    <line x1={LITH_X} y1={y2} x2={COR_X + COR_W} y2={y2} stroke={C.payZone} strokeWidth="0.8" strokeDasharray="6,4" opacity={0.6} />
                  </g>
                );
              })}

              {/* ═══ LITHOLOGY TRACK ═══ */}
              {(() => {
                if (visibleData.length < 2) return null;
                const segments: JSX.Element[] = [];
                for (let i = 0; i < visibleData.length - 1; i++) {
                  const pt = visibleData[i];
                  const nextPt = visibleData[i + 1];
                  const lith = getLithology(pt.gr);
                  const y1 = yForDepth(pt.depth);
                  const y2 = yForDepth(nextPt.depth);
                  const h = Math.max(1, y2 - y1);
                  const patId = `pat-${lith.type}`;
                  segments.push(
                    <g key={`lith-${i}`}>
                      <rect x={LITH_X + 1} y={y1} width={LITH_W - 2} height={h}
                        fill={`${lith.fill}20`} />
                      <rect x={LITH_X + 1} y={y1} width={LITH_W - 2} height={h}
                        fill={`url(#${patId})`} />
                    </g>
                  );
                }
                return segments;
              })()}

              {/* ═══ DEPTH LABELS ═══ */}
              {depthTicks.map(d => (
                <g key={`dt-${d}`}>
                  <line x1={DEPTH_X} y1={yForDepth(d)} x2={DEPTH_X + DEPTH_W} y2={yForDepth(d)} stroke={C.gridMajor} strokeWidth="0.4" />
                  <text x={DEPTH_X + DEPTH_W / 2} y={yForDepth(d) + 3.5} textAnchor="middle"
                    fill={C.textBright} fontSize="8" fontWeight="600" fontFamily="monospace">{d}</text>
                </g>
              ))}

              {/* ═══ GR / SP TRACK ═══ */}
              {/* SP curve */}
              <polyline points={buildPath(visibleData, "sp", GR_X, GR_W, -80, 20)}
                fill="none" stroke={C.sp} strokeWidth="1" strokeLinejoin="round" opacity={0.7} />
              {/* Simulated Caliper */}
              <polyline points={visibleData.map(pt => {
                const cal = 8 + Math.sin(pt.depth * 0.02) * 1.5 + (pt.gr > 80 ? 0.8 : 0);
                const norm = (cal - 6) / (12 - 6);
                return `${GR_X + Math.max(0, Math.min(1, norm)) * GR_W},${yForDepth(pt.depth)}`;
              }).join(" ")} fill="none" stroke={C.cal} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.5} />
              {/* Shale line at GR=75 */}
              <line x1={GR_X + (75 / 150) * GR_W} y1={HEADER_H} x2={GR_X + (75 / 150) * GR_W} y2={HEADER_H + plotH}
                stroke={C.shaleFill} strokeWidth="0.5" strokeDasharray="4,4" opacity={0.4} />
              {/* GR fill */}
              {visibleData.length > 1 && (() => {
                const cutX = GR_X + (75 / 150) * GR_W;
                const pts = visibleData.map(pt => {
                  const x = GR_X + (pt.gr / 150) * GR_W;
                  return `${Math.max(x, cutX)},${yForDepth(pt.depth)}`;
                });
                return <polygon
                  points={[`${cutX},${yForDepth(visibleData[0].depth)}`, ...pts, `${cutX},${yForDepth(visibleData[visibleData.length - 1].depth)}`].join(" ")}
                  fill={`${C.shaleFill}18`} />;
              })()}
              {/* GR curve */}
              <polyline points={buildPath(visibleData, "gr", GR_X, GR_W, 0, 150)}
                fill="none" stroke={C.gr} strokeWidth="1.5" strokeLinejoin="round" filter="url(#ewl-glow-gr)" />

              {/* ═══ RESISTIVITY TRACK ═══ */}
              {/* Shallow (simulated) */}
              <polyline points={visibleData.map(pt => {
                const v = pt.res * (0.7 + Math.sin(pt.depth * 0.01) * 0.15);
                const norm = (Math.log10(Math.max(0.2, v)) - Math.log10(0.2)) / (Math.log10(2000) - Math.log10(0.2));
                return `${RES_X + Math.max(0, Math.min(1, norm)) * RES_W},${yForDepth(pt.depth)}`;
              }).join(" ")} fill="none" stroke={C.resShallow} strokeWidth="0.8" strokeDasharray="3,2" opacity={0.5} />
              {/* Medium (simulated) */}
              <polyline points={visibleData.map(pt => {
                const v = pt.res * (1.1 + Math.cos(pt.depth * 0.008) * 0.12);
                const norm = (Math.log10(Math.max(0.2, v)) - Math.log10(0.2)) / (Math.log10(2000) - Math.log10(0.2));
                return `${RES_X + Math.max(0, Math.min(1, norm)) * RES_W},${yForDepth(pt.depth)}`;
              }).join(" ")} fill="none" stroke={C.resMed} strokeWidth="1" strokeLinejoin="round" opacity={0.6} />
              {/* Deep resistivity */}
              <polyline points={buildPath(visibleData, "res", RES_X, RES_W, 0.2, 2000, true)}
                fill="none" stroke={C.resDeep} strokeWidth="1.5" strokeLinejoin="round" filter="url(#ewl-glow-res)" />

              {/* ═══ POR / DEN TRACK ═══ */}
              {hasDenNphi && (() => {
                // NPHI/RHOB crossover fill
                const nphiPts = visibleData.map(pt => {
                  const nphi = pt.nphi ?? pt.por / 100;
                  const norm = 1 - (nphi / 0.45); // reversed: 0.45 left, 0 right
                  return { x: POR_X + Math.max(0, Math.min(1, norm)) * POR_W, y: yForDepth(pt.depth) };
                });
                const rhobPts = visibleData.map(pt => {
                  const rhob = pt.rhob ?? 2.65;
                  const norm = (rhob - 1.9) / (2.9 - 1.9);
                  return { x: POR_X + Math.max(0, Math.min(1, norm)) * POR_W, y: yForDepth(pt.depth) };
                });
                // Fill between
                const fillPoly = [...nphiPts.map(p => `${p.x},${p.y}`), ...rhobPts.reverse().map(p => `${p.x},${p.y}`)].join(" ");
                return (
                  <g>
                    <polygon points={fillPoly} fill="url(#ewl-nphi-grad)" />
                    {/* RHOB curve */}
                    <polyline points={visibleData.map(pt => {
                      const rhob = pt.rhob ?? 2.65;
                      const norm = (rhob - 1.9) / (2.9 - 1.9);
                      return `${POR_X + Math.max(0, Math.min(1, norm)) * POR_W},${yForDepth(pt.depth)}`;
                    }).join(" ")} fill="none" stroke="#64748b" strokeWidth="1.2" />
                    {/* NPHI curve */}
                    <polyline points={visibleData.map(pt => {
                      const nphi = pt.nphi ?? pt.por / 100;
                      const norm = 1 - (nphi / 0.45);
                      return `${POR_X + Math.max(0, Math.min(1, norm)) * POR_W},${yForDepth(pt.depth)}`;
                    }).join(" ")} fill="none" stroke={C.nphi} strokeWidth="1.2" strokeDasharray="5,3" />
                    {/* Limestone matrix reference */}
                    {(() => {
                      const matrixNorm = (2.71 - 1.9) / (2.9 - 1.9);
                      const x = POR_X + matrixNorm * POR_W;
                      return <line x1={x} y1={HEADER_H} x2={x} y2={HEADER_H + plotH}
                        stroke="#94a3b8" strokeWidth="0.4" strokeDasharray="2,4" opacity={0.3} />;
                    })()}
                  </g>
                );
              })()}
              {/* Porosity curve fallback if no den/nphi */}
              {!hasDenNphi && (
                <polyline points={buildPath(visibleData, "por", POR_X, POR_W, 0, 45)}
                  fill="none" stroke={C.nphi} strokeWidth="1.2" />
              )}

              {/* ═══ COR TRACK ═══ — lithology labels */}
              {(() => {
                const labels: JSX.Element[] = [];
                let lastLabel = "";
                for (let i = 0; i < visibleData.length; i++) {
                  const lith = getLithology(visibleData[i].gr);
                  if (lith.label !== lastLabel) {
                    const y = yForDepth(visibleData[i].depth);
                    labels.push(
                      <g key={`cor-${i}`}>
                        <rect x={COR_X + 2} y={y - 1} width={COR_W - 4} height={28}
                          rx="3" fill={`${lith.fill}25`} stroke={`${lith.fill}40`} strokeWidth="0.5" />
                        <text x={COR_X + COR_W / 2} y={y + 10} textAnchor="middle"
                          fill={C.text} fontSize="6.5" fontWeight="600">{lith.label}</text>
                        <text x={COR_X + COR_W / 2} y={y + 20} textAnchor="middle"
                          fill={`${C.text}88`} fontSize="6">{Math.round(visibleData[i].depth)}'</text>
                      </g>
                    );
                    lastLabel = lith.label;
                  }
                }
                return labels;
              })()}

              {/* ═══ CROSSHAIR ═══ */}
              {hoverData && (
                <g>
                  <line x1={0} y1={hoverData.y} x2={TOTAL_W} y2={hoverData.y}
                    stroke={C.crosshair} strokeWidth="0.7" strokeDasharray="4,3" opacity={0.5} />
                  {/* Dots on curves */}
                  {[
                    { x: GR_X + (hoverData.point.gr / 150) * GR_W, c: C.gr },
                    { x: (() => { const n = (Math.log10(Math.max(0.2, hoverData.point.res)) - Math.log10(0.2)) / (Math.log10(2000) - Math.log10(0.2)); return RES_X + Math.max(0, Math.min(1, n)) * RES_W; })(), c: C.resDeep },
                  ].map(({ x, c }, i) => (
                    <g key={i}>
                      <circle cx={x} cy={hoverData.y} r="4" fill={c} opacity={0.2} />
                      <circle cx={x} cy={hoverData.y} r="2.5" fill={c} stroke={C.bg} strokeWidth="1" />
                    </g>
                  ))}
                  {/* Depth badge */}
                  <rect x={DEPTH_X + 2} y={hoverData.y - 8} width={DEPTH_W - 4} height={16} rx="3" fill={C.crosshair} opacity={0.85} />
                  <text x={DEPTH_X + DEPTH_W / 2} y={hoverData.y + 3.5} textAnchor="middle"
                    fill="#0a0f1c" fontSize="8" fontWeight="800" fontFamily="monospace">{Math.round(hoverData.point.depth)}'</text>
                  {/* Tooltip */}
                  {(() => {
                    const tx = RES_X + 8;
                    const ty = hoverData.y < totalH / 2 ? hoverData.y + 12 : hoverData.y - 110;
                    const rows = [
                      { c: C.gr, l: "GR", v: `${hoverData.point.gr.toFixed(1)} API` },
                      { c: C.sp, l: "SP", v: `${hoverData.point.sp.toFixed(1)} mV` },
                      { c: C.resDeep, l: "Res", v: `${hoverData.point.res.toFixed(1)} Ωm` },
                      { c: C.nphi, l: "φ", v: `${hoverData.point.por.toFixed(1)}%` },
                    ];
                    if (hoverData.point.rhob !== null) rows.push({ c: "#94a3b8", l: "RHOB", v: `${hoverData.point.rhob.toFixed(2)} g/cc` });
                    if (hoverData.point.nphi !== null) rows.push({ c: C.nphi, l: "NPHI", v: `${(hoverData.point.nphi).toFixed(1)}%` });
                    return (
                      <g>
                        <rect x={tx + 1} y={ty + 1} width={140} height={22 + rows.length * 14} rx="5" fill="#000" opacity={0.25} />
                        <rect x={tx} y={ty} width={140} height={22 + rows.length * 14} rx="5" fill={C.tooltipBg} stroke={C.border} strokeWidth="0.8" />
                        <text x={tx + 8} y={ty + 14} fill={C.crosshair} fontSize="8.5" fontWeight="800" fontFamily="monospace">
                          ⬥ {Math.round(hoverData.point.depth)} ft
                        </text>
                        {rows.map((r, i) => (
                          <g key={i}>
                            <circle cx={tx + 12} cy={ty + 28 + i * 14} r="3" fill={r.c} opacity={0.8} />
                            <text x={tx + 20} y={ty + 31 + i * 14} fill={C.text} fontSize="7.5">{r.l}:</text>
                            <text x={tx + 132} y={ty + 31 + i * 14} textAnchor="end" fill={C.textBright} fontSize="8" fontWeight="700" fontFamily="monospace">{r.v}</text>
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
          <div className="flex justify-between text-[9px] text-muted-foreground px-1">
            <span>Formation: <span className="text-foreground/80">{formation || "Unknown"}</span></span>
            <span>{allData.length} pts · {Math.round(viewMin)}–{Math.round(viewMax)} ft</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWellLog;
