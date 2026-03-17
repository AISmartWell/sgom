import { useMemo, useState, useCallback, useRef } from "react";
import { Activity, Database, ZoomIn, ZoomOut, RotateCcw, Download, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useWellLogs, WellLogPoint } from "@/hooks/useWellLogs";
import { useWellPerforations, PerforationInterval } from "@/hooks/useWellPerforations";
import { interpretWellLog, fluidColor, fluidEmoji, type PetroPoint, type InterpretationSummary } from "@/lib/petrophysics";
import WellLogInterpretation from "./WellLogInterpretation";

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
const GR_W = 170;
const DEPTH_W = 50;
const RES_W = 180;
const POR_W = 150;
const FLUID_W = 45;
const PERF_W = 50;
const COR_W = 50;
const TOTAL_W = LITH_W + GR_W + DEPTH_W + RES_W + POR_W + FLUID_W + PERF_W + COR_W;
const HEADER_H = 60;
const PAD_B = 10;

const LITH_X = 0;
const GR_X = LITH_W;
const DEPTH_X = GR_X + GR_W;
const RES_X = DEPTH_X + DEPTH_W;
const POR_X = RES_X + RES_W;
const FLUID_X = POR_X + POR_W;
const PERF_X = FLUID_X + FLUID_W;
const COR_X = PERF_X + PERF_W;

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
  totalDepth?: number;
  showInterpretationByDefault?: boolean;
}

const EnhancedWellLog = ({ wellId, wellName, formation, defaultExpanded = true, totalDepth, showInterpretationByDefault = false }: EnhancedWellLogProps) => {
  const { data: rawLogs, isLoading, hasRealData } = useWellLogs(wellId);
  const { data: perforations, hasData: hasPerfs } = useWellPerforations(wellId);
  // Generate synthetic perforations when no real data exists
  const perfIntervals = useMemo<PerforationInterval[]>(() => {
    if (hasPerfs) return perforations;
    // Synthetic: create 2-3 perforation intervals near pay zones
    const depth = totalDepth ?? 3500;
    const synth: PerforationInterval[] = [
      { id: "s1", depth_from: Math.round(depth * 0.48), depth_to: Math.round(depth * 0.52), shots_per_foot: 4, hole_diameter: 0.42, phasing: 120, date_perforated: null, status: "open", notes: null },
      { id: "s2", depth_from: Math.round(depth * 0.58), depth_to: Math.round(depth * 0.61), shots_per_foot: 6, hole_diameter: 0.38, phasing: 60, date_perforated: null, status: "open", notes: null },
    ];
    return synth;
  }, [hasPerfs, perforations, totalDepth]);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [zoomFactor, setZoomFactor] = useState(2);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showInterpretation, setShowInterpretation] = useState(showInterpretationByDefault);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ point: DataPoint; y: number } | null>(null);

  // Generate synthetic data when no real data exists
  const syntheticData = useMemo<DataPoint[]>(() => {
    const depth = totalDepth ?? 3500;
    const topDepth = Math.round(depth * 0.3);
    const segments = 60;
    const pts: DataPoint[] = [];
    for (let i = 0; i <= segments; i++) {
      const d = topDepth + ((depth - topDepth) / segments) * i;
      const frac = i / segments;
      // Realistic-ish curves
      const baseGR = 50 + Math.sin(frac * Math.PI * 4) * 35 + Math.sin(frac * Math.PI * 9) * 15;
      const gr = Math.max(5, Math.min(145, baseGR + (Math.random() - 0.5) * 12));
      const sp = -10 + Math.sin(frac * Math.PI * 3 + 0.5) * 25 + (Math.random() - 0.5) * 5;
      const res = Math.max(0.3, 8 + Math.cos(frac * Math.PI * 5) * 20 + Math.sin(frac * Math.PI * 11) * 10 + (Math.random() - 0.5) * 4);
      const por = Math.max(1, Math.min(40, 12 + Math.sin(frac * Math.PI * 6 + 1) * 10 + (Math.random() - 0.5) * 3));
      const sw = Math.max(5, Math.min(95, 45 + Math.cos(frac * Math.PI * 4) * 25 + (Math.random() - 0.5) * 8));
      const rhob = 2.3 + Math.sin(frac * Math.PI * 5) * 0.25 + (Math.random() - 0.5) * 0.05;
      const nphi = Math.max(0.01, 0.18 - por * 0.002 + Math.sin(frac * Math.PI * 7) * 0.08);
      pts.push({ depth: Math.round(d), gr: +gr.toFixed(1), sp: +sp.toFixed(1), res: +res.toFixed(2), por: +por.toFixed(1), sw: +sw.toFixed(1), rhob: +rhob.toFixed(3), nphi: +nphi.toFixed(3) });
    }
    return pts;
  }, [totalDepth]);

  // Convert raw data or use synthetic
  const allData = useMemo<DataPoint[]>(() => {
    if (!rawLogs || rawLogs.length === 0) return syntheticData;
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
  }, [rawLogs, syntheticData]);

  const depthMin = useMemo(() => allData.length ? allData[0].depth : 0, [allData]);
  const depthMax = useMemo(() => allData.length ? allData[allData.length - 1].depth : 100, [allData]);
  const depthRange = depthMax - depthMin || 1;

  // Zoom/scroll
  const visibleSpan = depthRange / zoomFactor;
  const maxOffset = Math.max(0, depthRange - visibleSpan);
  const viewMin = depthMin + Math.min(scrollOffset, maxOffset);
  const viewMax = viewMin + visibleSpan;
  const visibleData = allData.filter(p => p.depth >= viewMin && p.depth <= viewMax);

  const plotH = Math.max(500, Math.min(1400, visibleData.length * 6));
  const totalH = HEADER_H + plotH + PAD_B;

  const yForDepth = useCallback((d: number) =>
    HEADER_H + ((d - viewMin) / visibleSpan) * plotH
  , [viewMin, visibleSpan, plotH]);

  // Petrophysical interpretation (Ko Ko Rules + Archie + Net Pay cutoffs)
  const interpretation = useMemo<InterpretationSummary>(() => {
    const petroData: PetroPoint[] = allData.map(p => ({
      depth: p.depth, gr: p.gr, sp: p.sp, res: p.res,
      por: p.por, sw: p.sw, rhob: p.rhob, nphi: p.nphi,
    }));
    return interpretWellLog(petroData);
  }, [allData]);

  // Pay zones from interpretation engine (replaces simple heuristic)
  const payZones = useMemo<PayZone[]>(() => {
    return interpretation.intervals
      .filter(i => i.isReservoir)
      .map(i => ({ top: i.top, bottom: i.bottom, label: `${fluidEmoji(i.fluidType)} ${i.fluidType}` }));
  }, [interpretation]);

  // Parse formation intervals from formation string (e.g. "Rodessa / Upper Carlisle / James Lime")
  const formationIntervals = useMemo(() => {
    if (!formation) return [];
    const names = formation.split(/\s*[\/,]\s*/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return [];
    const dMin = allData.length > 0 ? allData[0].depth : 0;
    const dMax = allData.length > 0 ? allData[allData.length - 1].depth : totalDepth ?? 3500;
    const range = dMax - dMin;
    // Distribute formation intervals across the depth range
    // Focus intervals in the lower 60% of the well (where productive zones typically are)
    const startFrac = 0.4;
    const intervalStart = dMin + range * startFrac;
    const intervalRange = range * (1 - startFrac);
    return names.map((name, i) => ({
      name,
      top: Math.round(intervalStart + (i / names.length) * intervalRange),
      bottom: Math.round(intervalStart + ((i + 1) / names.length) * intervalRange),
      color: ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"][i % 5],
    }));
  }, [formation, allData, totalDepth]);

  // Missed/bypassed zones — pay zones with no perforation overlap
  const missedZones = useMemo(() => {
    return payZones.filter(pz => {
      const hasPerf = perfIntervals.some(p =>
        p.depth_from < pz.bottom && p.depth_to > pz.top
      );
      return !hasPerf;
    });
  }, [payZones, perfIntervals]);

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
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-[2px] rounded-full" style={{ backgroundColor: "#f97316" }} />
            <span className="text-[9px] text-muted-foreground">PERF ({perfIntervals.length})</span>
          </div>
          {hasRealData ? (
            <Badge variant="outline" className="text-[9px] h-4 border-success/40 bg-success/10 text-success gap-1">
              <Database className="h-2.5 w-2.5" />REAL DATA
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] h-4 border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1">
              SIMULATED
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

              <text x={PERF_X + PERF_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">PERF</text>
              <text x={PERF_X + PERF_W / 2} y={30} textAnchor="middle" fill="#f97316" fontSize="7" fontFamily="monospace">SPF / ⌀</text>

              <text x={FLUID_X + FLUID_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">FLUID</text>
              <text x={FLUID_X + FLUID_W / 2} y={30} textAnchor="middle" fill="#a78bfa" fontSize="7" fontFamily="monospace">Ko Ko</text>

              <text x={COR_X + COR_W / 2} y={16} textAnchor="middle" fill={C.textBright} fontSize="8" fontWeight="700" letterSpacing="1">COR</text>

              {/* ═══ TRACK BACKGROUNDS ═══ */}
              <rect x={LITH_X} y={HEADER_H} width={LITH_W} height={plotH} fill="#0d1424" />
              <rect x={GR_X} y={HEADER_H} width={GR_W} height={plotH} fill={C.trackBg} />
              <rect x={DEPTH_X} y={HEADER_H} width={DEPTH_W} height={plotH} fill="#0e1628" />
              <rect x={RES_X} y={HEADER_H} width={RES_W} height={plotH} fill={C.trackBg} />
              <rect x={POR_X} y={HEADER_H} width={POR_W} height={plotH} fill={C.trackBg} />
              <rect x={FLUID_X} y={HEADER_H} width={FLUID_W} height={plotH} fill="#0d1020" />
              <rect x={PERF_X} y={HEADER_H} width={PERF_W} height={plotH} fill="#120d1a" />
              <rect x={COR_X} y={HEADER_H} width={COR_W} height={plotH} fill="#0d1220" />

              {/* Track borders */}
              {[LITH_X, GR_X, DEPTH_X, RES_X, POR_X, FLUID_X, PERF_X, COR_X, TOTAL_W].map((x, i) => (
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
                const isMissed = missedZones.some(mz => mz.top === pz.top && mz.bottom === pz.bottom);
                return (
                  <g key={`pz${i}`}>
                    {[GR_X, RES_X, POR_X].map((tx, ti) => (
                      <rect key={ti} x={tx} y={y1} width={ti === 0 ? GR_W : ti === 1 ? RES_W : POR_W}
                        height={y2 - y1} fill={isMissed ? "#ef444425" : `${C.payZone}15`} />
                    ))}
                    <line x1={LITH_X} y1={y1} x2={COR_X + COR_W} y2={y1}
                      stroke={isMissed ? "#ef4444" : C.payZone} strokeWidth={isMissed ? 1.5 : 0.8} strokeDasharray={isMissed ? "3,2" : "6,4"} opacity={0.8} />
                    <line x1={LITH_X} y1={y2} x2={COR_X + COR_W} y2={y2}
                      stroke={isMissed ? "#ef4444" : C.payZone} strokeWidth={isMissed ? 1.5 : 0.8} strokeDasharray={isMissed ? "3,2" : "6,4"} opacity={0.8} />
                    {/* Missed zone label */}
                    {isMissed && y2 - y1 > 15 && (
                      <g>
                        <rect x={DEPTH_X + 1} y={(y1 + y2) / 2 - 6} width={DEPTH_W - 2} height={12} rx="2" fill="#ef4444" opacity={0.85} />
                        <text x={DEPTH_X + DEPTH_W / 2} y={(y1 + y2) / 2 + 2} textAnchor="middle"
                          fill="#fff" fontSize="5.5" fontWeight="800" letterSpacing="0.5">MISSED</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ═══ FORMATION INTERVAL LABELS ═══ */}
              {formationIntervals.map((fi, i) => {
                const y1 = yForDepth(fi.top), y2 = yForDepth(fi.bottom);
                if (y2 < HEADER_H || y1 > HEADER_H + plotH) return null;
                const clampY1 = Math.max(HEADER_H + 2, y1);
                const clampY2 = Math.min(HEADER_H + plotH - 2, y2);
                const h = clampY2 - clampY1;
                if (h < 10) return null;
                return (
                  <g key={`fi-${i}`}>
                    {/* Side bracket on LITH track */}
                    <line x1={LITH_X + 2} y1={clampY1} x2={LITH_X + 2} y2={clampY2}
                      stroke={fi.color} strokeWidth="2.5" opacity={0.7} />
                    <line x1={LITH_X + 2} y1={clampY1} x2={LITH_X + 8} y2={clampY1}
                      stroke={fi.color} strokeWidth="1.5" opacity={0.7} />
                    <line x1={LITH_X + 2} y1={clampY2} x2={LITH_X + 8} y2={clampY2}
                      stroke={fi.color} strokeWidth="1.5" opacity={0.7} />
                    {/* Formation name label */}
                    {h > 20 && (
                      <g transform={`translate(${LITH_X + LITH_W / 2}, ${(clampY1 + clampY2) / 2})`}>
                        <rect x={-35} y={-7} width={70} height={14} rx="3" fill={`${fi.color}30`} stroke={fi.color} strokeWidth="0.5" />
                        <text x={0} y={3.5} textAnchor="middle" fill={fi.color} fontSize="6.5" fontWeight="700">
                          {fi.name.length > 12 ? fi.name.substring(0, 11) + "…" : fi.name}
                        </text>
                      </g>
                    )}
                    {/* Depth range */}
                    {h > 35 && (
                      <text x={LITH_X + LITH_W / 2} y={(clampY1 + clampY2) / 2 + 14} textAnchor="middle"
                        fill={`${fi.color}88`} fontSize="5.5">{fi.top}–{fi.bottom} ft</text>
                    )}
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
                    fill={C.textBright} fontSize="8" fontWeight="600" fontFamily="monospace">{d.toFixed(2)}</text>
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
              {/* ═══ GR ZONE COLOR BANDS ═══ */}
              {/* Green: Reservoir (GR < 45) */}
              <rect x={GR_X} y={HEADER_H} width={(45 / 150) * GR_W} height={plotH}
                fill="#22c55e" opacity={0.06} />
              {/* Yellow: Transition (45 ≤ GR ≤ 75) */}
              <rect x={GR_X + (45 / 150) * GR_W} y={HEADER_H} width={(30 / 150) * GR_W} height={plotH}
                fill="#eab308" opacity={0.06} />
              {/* Red: Cap/Shale (GR > 75) */}
              <rect x={GR_X + (75 / 150) * GR_W} y={HEADER_H} width={(75 / 150) * GR_W} height={plotH}
                fill="#ef4444" opacity={0.06} />

              {/* Zone cutlines */}
              <line x1={GR_X + (45 / 150) * GR_W} y1={HEADER_H} x2={GR_X + (45 / 150) * GR_W} y2={HEADER_H + plotH}
                stroke="#22c55e" strokeWidth="0.5" strokeDasharray="4,4" opacity={0.5} />
              <line x1={GR_X + (75 / 150) * GR_W} y1={HEADER_H} x2={GR_X + (75 / 150) * GR_W} y2={HEADER_H + plotH}
                stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4,4" opacity={0.5} />

              {/* Zone labels at top */}
              <text x={GR_X + (22.5 / 150) * GR_W} y={HEADER_H + 10} textAnchor="middle" fill="#22c55e" fontSize="6" fontWeight="600" opacity={0.7}>RESERVOIR</text>
              <text x={GR_X + (60 / 150) * GR_W} y={HEADER_H + 10} textAnchor="middle" fill="#eab308" fontSize="6" fontWeight="600" opacity={0.7}>TRANSITION</text>
              <text x={GR_X + (112.5 / 150) * GR_W} y={HEADER_H + 10} textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="600" opacity={0.7}>SHALE</text>

              {/* GR zone-colored fill segments */}
              {visibleData.length > 1 && (() => {
                const elements: JSX.Element[] = [];
                const cut45 = GR_X + (45 / 150) * GR_W;
                const cut75 = GR_X + (75 / 150) * GR_W;

                // Green fill: reservoir zone (GR < 45)
                const greenPts = visibleData.map(pt => {
                  const x = GR_X + (Math.min(pt.gr, 45) / 150) * GR_W;
                  return `${x},${yForDepth(pt.depth)}`;
                });
                elements.push(<polygon key="gr-green"
                  points={[`${GR_X},${yForDepth(visibleData[0].depth)}`, ...greenPts, `${GR_X},${yForDepth(visibleData[visibleData.length - 1].depth)}`].join(" ")}
                  fill="#22c55e" opacity={0.1} />);

                // Yellow fill: transition zone (45–75)
                const yellowPts = visibleData.map(pt => {
                  const x = GR_X + (Math.max(45, Math.min(pt.gr, 75)) / 150) * GR_W;
                  return `${x},${yForDepth(pt.depth)}`;
                });
                elements.push(<polygon key="gr-yellow"
                  points={[`${cut45},${yForDepth(visibleData[0].depth)}`, ...yellowPts, `${cut45},${yForDepth(visibleData[visibleData.length - 1].depth)}`].join(" ")}
                  fill="#eab308" opacity={0.1} />);

                // Red fill: shale zone (GR > 75)
                const redPts = visibleData.map(pt => {
                  const x = GR_X + (Math.max(pt.gr, 75) / 150) * GR_W;
                  return `${Math.max(x, cut75)},${yForDepth(pt.depth)}`;
                });
                elements.push(<polygon key="gr-red"
                  points={[`${cut75},${yForDepth(visibleData[0].depth)}`, ...redPts, `${cut75},${yForDepth(visibleData[visibleData.length - 1].depth)}`].join(" ")}
                  fill="#ef4444" opacity={0.12} />);

                return elements;
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

              {/* ═══ PERF TRACK ═══ — perforation intervals */}
              {perfIntervals.map((perf, pi) => {
                const y1 = yForDepth(perf.depth_from);
                const y2 = yForDepth(perf.depth_to);
                if (y2 < HEADER_H || y1 > HEADER_H + plotH) return null;
                const clampY1 = Math.max(HEADER_H, y1);
                const clampY2 = Math.min(HEADER_H + plotH, y2);
                const h = clampY2 - clampY1;
                if (h < 1) return null;
                const spf = perf.shots_per_foot ?? 4;
                const cx = PERF_X + PERF_W / 2;
                // Draw perforation symbols (small arrows/bursts)
                const perfShots: JSX.Element[] = [];
                const shotSpacing = Math.max(4, PERF_W * 0.15);
                const numShots = Math.min(Math.floor(h / shotSpacing), 60);
                for (let s = 0; s < numShots; s++) {
                  const sy = clampY1 + (s + 0.5) * (h / numShots);
                  const side = s % 2 === 0 ? 1 : -1;
                  const tipX = cx + side * (PERF_W * 0.38);
                  const baseX = cx + side * 2;
                  perfShots.push(
                    <g key={`ps-${pi}-${s}`}>
                      <line x1={baseX} y1={sy} x2={tipX} y2={sy}
                        stroke="#f97316" strokeWidth="1.2" opacity={0.8} />
                      {/* Arrow tip */}
                      <polygon
                        points={`${tipX},${sy} ${tipX - side * 3},${sy - 1.5} ${tipX - side * 3},${sy + 1.5}`}
                        fill="#f97316" opacity={0.9} />
                      {/* Burst dot */}
                      <circle cx={tipX + side * 1.5} cy={sy} r="1" fill="#fbbf24" opacity={0.6} />
                    </g>
                  );
                }
                return (
                  <g key={`perf-${pi}`}>
                    {/* Interval background */}
                    <rect x={PERF_X + 1} y={clampY1} width={PERF_W - 2} height={h}
                      fill="#f9731610" stroke="#f97316" strokeWidth="0.6" strokeDasharray="2,2" rx="2" />
                    {/* Top/bottom depth markers */}
                    <line x1={PERF_X} y1={clampY1} x2={PERF_X + PERF_W} y2={clampY1}
                      stroke="#f97316" strokeWidth="1" opacity={0.8} />
                    <line x1={PERF_X} y1={clampY2} x2={PERF_X + PERF_W} y2={clampY2}
                      stroke="#f97316" strokeWidth="1" opacity={0.8} />
                    {/* Perforation shot symbols */}
                    {perfShots}
                    {/* SPF label */}
                    {h > 20 && (
                      <text x={cx} y={clampY1 + h / 2 + 3} textAnchor="middle"
                        fill="#fbbf24" fontSize="7" fontWeight="700" fontFamily="monospace">
                        {spf} SPF
                      </text>
                    )}
                    {/* Depth labels */}
                    {h > 30 && (
                      <>
                        <text x={cx} y={clampY1 - 2} textAnchor="middle"
                          fill="#f97316" fontSize="6" fontFamily="monospace">{perf.depth_from.toFixed(2)}'</text>
                        <text x={cx} y={clampY2 + 8} textAnchor="middle"
                          fill="#f97316" fontSize="6" fontFamily="monospace">{perf.depth_to.toFixed(2)}'</text>
                      </>
                    )}
                  </g>
                );
              })}

              {/* ═══ FLUID TYPE TRACK ═══ — Ko Ko Rules interpretation */}
              {interpretation.intervals.map((iv, i) => {
                const y1 = yForDepth(iv.top);
                const y2 = yForDepth(iv.bottom);
                if (y2 < HEADER_H || y1 > HEADER_H + plotH) return null;
                const clampY1 = Math.max(HEADER_H, y1);
                const clampY2 = Math.min(HEADER_H + plotH, y2);
                const h = clampY2 - clampY1;
                if (h < 2) return null;
                const color = fluidColor(iv.fluidType);
                return (
                  <g key={`fluid-${i}`}>
                    <rect x={FLUID_X + 2} y={clampY1} width={FLUID_W - 4} height={h}
                      fill={color} opacity={iv.isNetPay ? 0.35 : 0.12}
                      stroke={color} strokeWidth={iv.isNetPay ? 0.8 : 0.3} rx="1" />
                    {h > 14 && (
                      <text x={FLUID_X + FLUID_W / 2} y={(clampY1 + clampY2) / 2 + 3}
                        textAnchor="middle" fill={color} fontSize="6" fontWeight="700">
                        {fluidEmoji(iv.fluidType)}
                      </text>
                    )}
                    {h > 24 && iv.isNetPay && (
                      <text x={FLUID_X + FLUID_W / 2} y={(clampY1 + clampY2) / 2 + 12}
                        textAnchor="middle" fill="#22c55e" fontSize="5" fontWeight="800">
                        NET
                      </text>
                    )}
                  </g>
                );
              })}

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
                          fill={`${C.text}88`} fontSize="6">{visibleData[i].depth.toFixed(2)}'</text>
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
                    fill="#0a0f1c" fontSize="8" fontWeight="800" fontFamily="monospace">{hoverData.point.depth.toFixed(2)}'</text>
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
                          ⬥ {hoverData.point.depth.toFixed(2)} ft
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
          <div className="flex justify-between items-center text-[9px] text-muted-foreground px-1 flex-wrap gap-1">
            <span>Formation: <span className="text-foreground/80">{formation || "Unknown"}</span></span>
            <span>{allData.length} pts · {Math.round(viewMin)}–{Math.round(viewMax)} ft</span>
            {interpretation.netPay > 0 && (
              <span className="text-emerald-400">Net Pay: {interpretation.netPay} ft (N/G: {interpretation.netToGross}%)</span>
            )}
            {payZones.length > 0 && <span className="text-amber-400">Reservoir zones: {payZones.length}</span>}
            {missedZones.length > 0 && <span className="text-red-400">⚠ Missed: {missedZones.length}</span>}
            <button
              onClick={() => setShowInterpretation(p => !p)}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              <FlaskConical className="h-3 w-3" />
              {showInterpretation ? "Hide" : "Show"} Interpretation
            </button>
          </div>

          {/* Petrophysical Interpretation Panel */}
          {showInterpretation && (
            <div className="border border-border/30 rounded-lg p-3 bg-muted/5">
              <WellLogInterpretation summary={interpretation} wellName={wellName} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedWellLog;
