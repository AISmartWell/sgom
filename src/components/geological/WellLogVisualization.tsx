import { useMemo, useRef, useEffect, useState } from "react";
import sampleCoreLimestone from "@/assets/sample-core-limestone.jpg";
import sampleCoreDolomite from "@/assets/sample-core-dolomite.jpg";
import sampleCoreShale from "@/assets/sample-core-shale.jpg";
import sampleCore from "@/assets/sample-core.jpg";

// --- Data generation ---
interface LogPoint {
  depth: number;
  gr: number;
  sp: number;
  caliper: number;
  resDeep: number;
  resMed: number;
  resShallow: number;
  porosity: number;
  nphi: number;
  density: number;
  waterSat: number;
}

function generateWellLogData(): LogPoint[] {
  const data: LogPoint[] = [];
  const seed = 42;
  let r = seed;
  const rand = () => { r = (r * 16807 + 0) % 2147483647; return r / 2147483647; };

  for (let i = 0; i < 160; i++) {
    const depth = 4840 + i;
    // Formation-based responses
    const isRodessa = depth < 4900;
    const isUpperCarlisle = depth >= 4900 && depth < 4945;
    const isLowerCarlisle = depth >= 4945 && depth < 4975;
    const isBasal = depth >= 4975;

    let baseGR = 60, baseSP = -20, baseCal = 8.5;
    let baseResD = 10, baseResM = 8, baseResS = 5;
    let basePor = 12, baseNPHI = 0.18, baseDen = 2.55;
    let baseSw = 60;

    if (isRodessa) {
      baseGR = 35; baseSP = -40; baseCal = 8.2;
      baseResD = 40; baseResM = 30; baseResS = 20;
      basePor = 18; baseNPHI = 0.14; baseDen = 2.42;
      baseSw = 25;
    } else if (isUpperCarlisle) {
      baseGR = 85; baseSP = -10; baseCal = 9.0;
      baseResD = 5; baseResM = 4; baseResS = 3;
      basePor = 8; baseNPHI = 0.28; baseDen = 2.6;
      baseSw = 90;
    } else if (isLowerCarlisle) {
      baseGR = 45; baseSP = -35; baseCal = 8.3;
      baseResD = 25; baseResM = 18; baseResS = 12;
      basePor = 15; baseNPHI = 0.16; baseDen = 2.48;
      baseSw = 35;
    } else if (isBasal) {
      baseGR = 70; baseSP = -15; baseCal = 8.8;
      baseResD = 8; baseResM = 6; baseResS = 4;
      basePor = 10; baseNPHI = 0.22; baseDen = 2.58;
      baseSw = 75;
    }

    const noise = (amp: number) => (rand() - 0.5) * amp * 2;

    data.push({
      depth,
      gr: Math.max(0, Math.min(150, baseGR + noise(20))),
      sp: baseSP + noise(10),
      caliper: Math.max(6, Math.min(12, baseCal + noise(0.6))),
      resDeep: Math.max(0.2, baseResD * (0.7 + rand() * 0.6)),
      resMed: Math.max(0.2, baseResM * (0.7 + rand() * 0.6)),
      resShallow: Math.max(0.2, baseResS * (0.7 + rand() * 0.6)),
      porosity: Math.max(0, Math.min(35, basePor + noise(4))),
      nphi: Math.max(0, Math.min(0.45, baseNPHI + noise(0.04))),
      density: Math.max(2.0, Math.min(2.9, baseDen + noise(0.06))),
      waterSat: Math.max(0, Math.min(100, baseSw + noise(15))),
    });
  }
  return data;
}

// --- Formation definitions ---
const FORMATIONS = [
  { name: "Rodessa Limestone", top: 4840, bottom: 4900, color: "#FDE68A", pattern: "limestone" },
  { name: "Upper Carlisle", top: 4900, bottom: 4945, color: "#D1D5DB", pattern: "shale" },
  { name: "Lower Carlisle", top: 4945, bottom: 4975, color: "#FCD34D", pattern: "sandstone" },
  { name: "Basal Unit", top: 4975, bottom: 5000, color: "#9CA3AF", pattern: "shale" },
];

const CORE_IMAGES = [
  { src: sampleCoreLimestone, top: 4840, bottom: 4880, label: "Limestone" },
  { src: sampleCore, top: 4880, bottom: 4920, label: "Mixed" },
  { src: sampleCoreDolomite, top: 4920, bottom: 4960, label: "Dolomite" },
  { src: sampleCoreShale, top: 4960, bottom: 5000, label: "Shale" },
];

// --- Canvas Drawing Helpers ---
const TRACK_CONFIG = {
  lithology: { width: 50 },
  track1: { width: 160, label: "GR / SP / Caliper" },
  depth: { width: 55 },
  track2: { width: 180, label: "Resistivity" },
  track3: { width: 140, label: "Porosity / Density" },
  core: { width: 70 },
};

const HEADER_H = 50;
const FOOTER_H = 10;

const TOTAL_DEPTH_MIN = 4840;
const TOTAL_DEPTH_MAX = 5000;
const MIN_DEPTH_RANGE = 20; // minimum visible depth window

const WellLogVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: LogPoint } | null>(null);
  const [coreImages, setCoreImages] = useState<HTMLImageElement[]>([]);
  const [viewDepthMin, setViewDepthMin] = useState(TOTAL_DEPTH_MIN);
  const [viewDepthMax, setViewDepthMax] = useState(TOTAL_DEPTH_MAX);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartDepthMin = useRef(TOTAL_DEPTH_MIN);
  const dragStartDepthMax = useRef(TOTAL_DEPTH_MAX);

  const logData = useMemo(() => generateWellLogData(), []);
  const depthMin = viewDepthMin;
  const depthMax = viewDepthMax;
  const zoomLevel = Math.round(((TOTAL_DEPTH_MAX - TOTAL_DEPTH_MIN) / (viewDepthMax - viewDepthMin)) * 100);

  const clampView = (dMin: number, dMax: number): [number, number] => {
    const range = dMax - dMin;
    let newMin = dMin;
    let newMax = dMax;
    if (newMin < TOTAL_DEPTH_MIN) { newMin = TOTAL_DEPTH_MIN; newMax = TOTAL_DEPTH_MIN + range; }
    if (newMax > TOTAL_DEPTH_MAX) { newMax = TOTAL_DEPTH_MAX; newMin = TOTAL_DEPTH_MAX - range; }
    newMin = Math.max(TOTAL_DEPTH_MIN, newMin);
    newMax = Math.min(TOTAL_DEPTH_MAX, newMax);
    return [newMin, newMax];
  };

  const handleZoom = (factor: number, centerDepth?: number) => {
    const currentRange = viewDepthMax - viewDepthMin;
    const newRange = Math.max(MIN_DEPTH_RANGE, Math.min(TOTAL_DEPTH_MAX - TOTAL_DEPTH_MIN, currentRange * factor));
    const center = centerDepth ?? (viewDepthMin + viewDepthMax) / 2;
    const ratio = (center - viewDepthMin) / currentRange;
    const newMin = center - newRange * ratio;
    const newMax = center - newRange * ratio + newRange;
    const [cMin, cMax] = clampView(newMin, newMax);
    setViewDepthMin(cMin);
    setViewDepthMax(cMax);
  };

  const resetZoom = () => {
    setViewDepthMin(TOTAL_DEPTH_MIN);
    setViewDepthMax(TOTAL_DEPTH_MAX);
  };

  // Load core images
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    CORE_IMAGES.forEach((ci, idx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        loaded++;
        if (loaded === CORE_IMAGES.length) setCoreImages([...imgs]);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === CORE_IMAGES.length) setCoreImages([...imgs]);
      };
      img.src = ci.src;
      imgs[idx] = img;
    });
  }, []);

  // Main draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const totalW = Object.values(TRACK_CONFIG).reduce((s, t) => s + t.width, 0);
    const canvasH = 520;

    canvas.width = totalW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = totalW + "px";
    canvas.style.height = canvasH + "px";
    ctx.scale(dpr, dpr);

    const plotH = canvasH - HEADER_H - FOOTER_H;

    const depthToY = (d: number) => HEADER_H + ((d - depthMin) / (depthMax - depthMin)) * plotH;

    // Background
    ctx.fillStyle = "#0f1729";
    ctx.fillRect(0, 0, totalW, canvasH);

    // --- Track positions ---
    let x = 0;
    const trackX: Record<string, number> = {};
    for (const [key, cfg] of Object.entries(TRACK_CONFIG)) {
      trackX[key] = x;
      x += cfg.width;
    }

    // --- Grid & depth ticks ---
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let d = depthMin; d <= depthMax; d += 10) {
      const y = depthToY(d);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalW, y);
      ctx.stroke();
    }

    // --- Headers ---
    ctx.fillStyle = "rgba(15,23,41,0.95)";
    ctx.fillRect(0, 0, totalW, HEADER_H);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(totalW, HEADER_H);
    ctx.stroke();

    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";

    // Track headers
    const drawHeader = (key: string, label: string) => {
      const tx = trackX[key];
      const tw = (TRACK_CONFIG as any)[key].width;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(label, tx + tw / 2, 15);
    };

    drawHeader("lithology", "LITH");
    drawHeader("track1", "GR / SP / CAL");
    drawHeader("depth", "DEPTH");
    drawHeader("track2", "RESISTIVITY");
    drawHeader("track3", "POR / DEN");
    drawHeader("core", "CORE");

    // Track1 scale
    ctx.font = "7px monospace";
    ctx.fillStyle = "#22c55e";
    ctx.fillText("GR: 0-150 API", trackX.track1 + 80, 28);
    ctx.fillStyle = "#3b82f6";
    ctx.fillText("SP: -80/+20 mV", trackX.track1 + 80, 38);
    ctx.fillStyle = "#ec4899";
    ctx.fillText("CAL: 6-12 in", trackX.track1 + 80, 48);

    // Track2 scale
    ctx.fillStyle = "#ef4444";
    ctx.fillText("RD: 0.2-2000 Ωm", trackX.track2 + 90, 28);
    ctx.fillStyle = "#22d3ee";
    ctx.fillText("RM: 0.2-2000", trackX.track2 + 90, 38);
    ctx.fillStyle = "#f97316";
    ctx.fillText("RS: 0.2-2000", trackX.track2 + 90, 48);

    // Track3 scale
    ctx.fillStyle = "#a78bfa";
    ctx.fillText("NPHI: 0.45-0", trackX.track3 + 70, 28);
    ctx.fillStyle = "#6366f1";
    ctx.fillText("RHOB: 2.0-2.9", trackX.track3 + 70, 38);

    // --- Lithology column ---
    for (const fm of FORMATIONS) {
      const y1 = depthToY(Math.max(fm.top, depthMin));
      const y2 = depthToY(Math.min(fm.bottom, depthMax));
      const lx = trackX.lithology;
      const lw = TRACK_CONFIG.lithology.width;

      ctx.fillStyle = fm.color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(lx, y1, lw, y2 - y1);
      ctx.globalAlpha = 1;

      // Pattern overlay
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 0.5;
      if (fm.pattern === "limestone") {
        for (let py = y1; py < y2; py += 8) {
          ctx.beginPath();
          ctx.moveTo(lx, py);
          ctx.lineTo(lx + lw, py);
          ctx.stroke();
          for (let px = lx + 5; px < lx + lw; px += 12) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 4, py + 4);
            ctx.lineTo(px - 4, py + 4);
            ctx.closePath();
            ctx.stroke();
          }
        }
      } else if (fm.pattern === "shale") {
        for (let py = y1; py < y2; py += 4) {
          ctx.beginPath();
          ctx.moveTo(lx + 2, py);
          ctx.lineTo(lx + lw - 2, py);
          ctx.stroke();
        }
      } else if (fm.pattern === "sandstone") {
        for (let py = y1; py < y2; py += 5) {
          for (let px = lx + 3; px < lx + lw; px += 6) {
            ctx.beginPath();
            ctx.arc(px + (py % 10 === 0 ? 3 : 0), py, 1, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fill();
          }
        }
      }

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(lx, y1, lw, y2 - y1);
    }

    // --- Depth track ---
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let d = depthMin; d <= depthMax; d += 10) {
      const y = depthToY(d);
      ctx.fillText(d.toString(), trackX.depth + TRACK_CONFIG.depth.width / 2, y + 3);
      // Tick
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(trackX.depth, y);
      ctx.lineTo(trackX.depth + 5, y);
      ctx.moveTo(trackX.depth + TRACK_CONFIG.depth.width - 5, y);
      ctx.lineTo(trackX.depth + TRACK_CONFIG.depth.width, y);
      ctx.stroke();
    }

    // Depth track borders
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(trackX.depth, HEADER_H);
    ctx.lineTo(trackX.depth, canvasH - FOOTER_H);
    ctx.moveTo(trackX.depth + TRACK_CONFIG.depth.width, HEADER_H);
    ctx.lineTo(trackX.depth + TRACK_CONFIG.depth.width, canvasH - FOOTER_H);
    ctx.stroke();

    // --- Formation labels (right of depth) ---
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "left";
    for (const fm of FORMATIONS) {
      const midY = depthToY((Math.max(fm.top, depthMin) + Math.min(fm.bottom, depthMax)) / 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      // Horizontal separator
      if (fm.top > depthMin) {
        const fy = depthToY(fm.top);
        ctx.strokeStyle = "rgba(255,165,0,0.5)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, fy);
        ctx.lineTo(totalW, fy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // --- Draw curves ---
    const drawCurve = (
      trackKey: string,
      dataKey: keyof LogPoint,
      min: number,
      max: number,
      color: string,
      lineW: number = 1.2,
      logScale = false,
      fillBelow = false
    ) => {
      const tx = trackX[trackKey];
      const tw = (TRACK_CONFIG as any)[trackKey].width;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineJoin = "round";

      const valToX = (v: number) => {
        if (logScale) {
          const logMin = Math.log10(min);
          const logMax = Math.log10(max);
          const logV = Math.log10(Math.max(min, v));
          return tx + ((logV - logMin) / (logMax - logMin)) * tw;
        }
        return tx + ((v - min) / (max - min)) * tw;
      };

      const points: [number, number][] = [];
      for (const pt of logData) {
        const px = valToX(pt[dataKey] as number);
        const py = depthToY(pt.depth);
        points.push([px, py]);
      }

      // Draw line
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i][0], points[i][1]);
        else ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();

      // Fill below curve
      if (fillBelow && points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(tx, points[0][1]);
        for (const p of points) ctx.lineTo(p[0], p[1]);
        ctx.lineTo(tx, points[points.length - 1][1]);
        ctx.closePath();
        ctx.fillStyle = color.replace(")", ",0.12)").replace("rgb", "rgba");
        ctx.fill();
      }
    };

    // Track 1: GR, SP, Caliper
    // GR fill (yellow shading for clean zones)
    const tx1 = trackX.track1;
    const tw1 = TRACK_CONFIG.track1.width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx1, HEADER_H, tw1, plotH);
    ctx.clip();

    // GR yellow fill for clean zones (GR < 75)
    ctx.beginPath();
    for (let i = 0; i < logData.length; i++) {
      const px = tx1 + (logData[i].gr / 150) * tw1;
      const py = depthToY(logData[i].depth);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(tx1, depthToY(logData[logData.length - 1].depth));
    ctx.lineTo(tx1, depthToY(logData[0].depth));
    ctx.closePath();
    ctx.fillStyle = "rgba(253,224,71,0.15)";
    ctx.fill();

    ctx.restore();

    drawCurve("track1", "gr", 0, 150, "#22c55e", 1.5);
    drawCurve("track1", "sp", -80, 20, "#3b82f6", 1.2);
    drawCurve("track1", "caliper", 6, 12, "#ec4899", 1.0);

    // Track 2: Resistivity (log scale)
    ctx.save();
    ctx.beginPath();
    ctx.rect(trackX.track2, HEADER_H, TRACK_CONFIG.track2.width, plotH);
    ctx.clip();

    // Vertical grid for log scale
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    for (const v of [0.2, 1, 2, 10, 20, 100, 200, 1000, 2000]) {
      const logMin = Math.log10(0.2);
      const logMax = Math.log10(2000);
      const logV = Math.log10(v);
      const px = trackX.track2 + ((logV - logMin) / (logMax - logMin)) * TRACK_CONFIG.track2.width;
      ctx.beginPath();
      ctx.moveTo(px, HEADER_H);
      ctx.lineTo(px, HEADER_H + plotH);
      ctx.stroke();
    }

    drawCurve("track2", "resDeep", 0.2, 2000, "#ef4444", 1.5, true);
    drawCurve("track2", "resMed", 0.2, 2000, "#22d3ee", 1.3, true);
    drawCurve("track2", "resShallow", 0.2, 2000, "#f97316", 1.0, true);

    ctx.restore();

    // Track 3: Porosity & Density
    ctx.save();
    ctx.beginPath();
    ctx.rect(trackX.track3, HEADER_H, TRACK_CONFIG.track3.width, plotH);
    ctx.clip();

    drawCurve("track3", "nphi", 0.45, 0, "#a78bfa", 1.3, false, true);
    drawCurve("track3", "density", 2.0, 2.9, "#6366f1", 1.3);

    ctx.restore();

    // --- Core images ---
    if (coreImages.length > 0) {
      const cx = trackX.core;
      const cw = TRACK_CONFIG.core.width;
      for (let i = 0; i < CORE_IMAGES.length; i++) {
        const ci = CORE_IMAGES[i];
        const img = coreImages[i];
        if (!img || !img.complete) continue;
        const y1 = depthToY(ci.top);
        const y2 = depthToY(ci.bottom);
        try {
          ctx.drawImage(img, cx, y1, cw, y2 - y1);
        } catch {}
        // Label
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(cx, y2 - 12, cw, 12);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "7px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ci.label, cx + cw / 2, y2 - 3);
      }
    }

    // Track borders
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (const key of ["track1", "track2", "track3", "core"]) {
      const tx = trackX[key];
      const tw = (TRACK_CONFIG as any)[key].width;
      ctx.strokeRect(tx, HEADER_H, tw, plotH);
    }

    // Formation labels on right side
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "right";
    for (const fm of FORMATIONS) {
      const midY = depthToY((Math.max(fm.top, depthMin) + Math.min(fm.bottom, depthMax)) / 2);
      ctx.save();
      ctx.translate(totalW - 2, midY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "center";
      ctx.fillText(fm.name, 0, 0);
      ctx.restore();
    }

  }, [logData, coreImages]);

  // Mouse tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const plotH = 520 - HEADER_H - FOOTER_H;
    const depthAtMouse = depthMin + ((my - HEADER_H) / plotH) * (depthMax - depthMin);

    if (depthAtMouse < depthMin || depthAtMouse > depthMax) {
      setTooltip(null);
      return;
    }

    const closest = logData.reduce((best, pt) =>
      Math.abs(pt.depth - depthAtMouse) < Math.abs(best.depth - depthAtMouse) ? pt : best
    );

    setTooltip({ x: mx, y: my, data: closest });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Composite Well Log</h4>
          <p className="text-sm text-muted-foreground">Multi-track log display with lithology, curves & core photos</p>
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} /><span>GR</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} /><span>SP</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /><span>Res Deep</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#22d3ee" }} /><span>Res Med</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} /><span>NPHI</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} /><span>RHOB</span></div>
        </div>
      </div>

      <div className="relative overflow-x-auto bg-[#0f1729] rounded-lg p-2" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          className="cursor-crosshair"
        />
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg text-xs"
            style={{ left: Math.min(tooltip.x + 12, 500), top: tooltip.y - 10 }}
          >
            <p className="font-medium mb-1.5 text-foreground">Depth: {tooltip.data.depth} ft</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span style={{ color: "#22c55e" }}>GR: {tooltip.data.gr.toFixed(1)} API</span>
              <span style={{ color: "#3b82f6" }}>SP: {tooltip.data.sp.toFixed(1)} mV</span>
              <span style={{ color: "#ef4444" }}>Res Deep: {tooltip.data.resDeep.toFixed(1)} Ωm</span>
              <span style={{ color: "#22d3ee" }}>Res Med: {tooltip.data.resMed.toFixed(1)} Ωm</span>
              <span style={{ color: "#a78bfa" }}>NPHI: {tooltip.data.nphi.toFixed(3)}</span>
              <span style={{ color: "#6366f1" }}>RHOB: {tooltip.data.density.toFixed(2)} g/cc</span>
              <span className="text-muted-foreground">Sw: {tooltip.data.waterSat.toFixed(0)}%</span>
              <span className="text-muted-foreground">φ: {tooltip.data.porosity.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Petrophysical Summary */}
      <div className="grid grid-cols-4 gap-3">
        {FORMATIONS.map(fm => (
          <div key={fm.name} className="p-3 rounded-lg border border-border/50" style={{ backgroundColor: fm.color + "15" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: fm.color }}>{fm.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {fm.top}–{fm.bottom} ft • {fm.pattern}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WellLogVisualization;
