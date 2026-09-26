import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

// A fixed, illustrative visual narrative. No well records, measurements or analysis are fetched.
const TOP = 4850;
const BOTTOM = 5225;
const HEADER = 72;
const HEIGHT = 690;
const PLOT = HEIGHT - HEADER;
const W = 1100;
const zones = [
  { from: 4850, to: 4876, name: "Shale", kind: "shale" },
  { from: 4876, to: 4900, name: "Candidate · unperforated", kind: "missed" },
  { from: 4900, to: 4936, name: "Silty sand", kind: "silt" },
  { from: 4936, to: 4960, name: "Illustrative pay", kind: "pay" },
  { from: 4960, to: 5010, name: "Shale", kind: "shale" },
  { from: 5010, to: 5040, name: "Water response", kind: "water" },
  { from: 5040, to: 5095, name: "Silty sand", kind: "silt" },
  { from: 5095, to: 5130, name: "Candidate · unperforated", kind: "missed" },
  { from: 5130, to: 5180, name: "Shale", kind: "shale" },
  { from: 5180, to: 5225, name: "Water response", kind: "water" },
] as const;

const y = (depth: number) => HEADER + ((depth - TOP) / (BOTTOM - TOP)) * PLOT;
const ticks = Array.from({ length: 16 }, (_, i) => TOP + i * 25);
const tracks = [
  { label: "LITH", x: 0, width: 90 },
  { label: "GR / SP", x: 90, width: 230 },
  { label: "DEPTH", x: 320, width: 105 },
  { label: "RESISTIVITY", x: 425, width: 220 },
  { label: "POR / DEN", x: 645, width: 215 },
  { label: "FLUID", x: 860, width: 85 },
  { label: "PERF", x: 945, width: 70 },
  { label: "COR", x: 1015, width: 85 },
] as const;

const zoneAt = (depth: number) => zones.find((z) => depth >= z.from && depth < z.to)?.kind ?? "shale";

function trace(x: number, width: number, value: (depth: number) => number) {
  return Array.from({ length: 251 }, (_, i) => {
    const depth = TOP + (i / 250) * (BOTTOM - TOP);
    return `${i ? "L" : "M"}${(x + 8 + (width - 16) * Math.max(0.03, Math.min(0.97, value(depth)))).toFixed(1)},${y(depth).toFixed(1)}`;
  }).join(" ");
}

const wave = (d: number) => Math.sin(d * 0.17) * 0.045 + Math.sin(d * 0.44) * 0.025;
const clean = (d: number) => zoneAt(d) === "missed" || zoneAt(d) === "pay";

export default function IllustrativeCompositeLog({ scanProgress }: { scanProgress?: number }) {
  const paths = useMemo(() => ({
    gr: trace(90, 230, d => (clean(d) ? 0.28 : zoneAt(d) === "shale" ? 0.75 : 0.53) + wave(d)),
    sp: trace(90, 230, d => (clean(d) ? 0.32 : 0.62) - wave(d) * 0.7),
    resistivity: trace(425, 220, d => (clean(d) ? 0.78 : zoneAt(d) === "water" ? 0.23 : 0.43) + wave(d)),
    resistivityNear: trace(425, 220, d => (clean(d) ? 0.64 : zoneAt(d) === "water" ? 0.3 : 0.48) + wave(d) * 0.6),
    porosity: trace(645, 215, d => (clean(d) ? 0.64 : zoneAt(d) === "shale" ? 0.25 : 0.45) + wave(d)),
    density: trace(645, 215, d => (clean(d) ? 0.31 : zoneAt(d) === "shale" ? 0.69 : 0.52) - wave(d) * 0.7),
  }), []);

  return <section className="border border-border bg-card" aria-label="Illustrative composite well log">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-accent/40 text-accent">Stage 8 · Composite log</Badge>
          <Badge variant="outline" className="border-primary/40 text-primary">ILLUSTRATIVE · NOT MEASURED</Badge>
        </div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5 text-accent" /> Brawner 10-15 — Composite Well Log</h2>
        <p className="mt-1 text-sm text-muted-foreground">Curves, rock layers, fluid response and candidate intervals shown together. Schematic data only; no live analysis or private well records.</p>
      </div>
    </div>
    <div className="overflow-x-auto" role="region" aria-label="Composite log tracks; scroll horizontally on narrow screens" tabIndex={0}>
      <svg viewBox={`0 0 ${W} ${HEIGHT}`} className="block h-auto min-w-[850px] w-full" role="img" aria-label="Illustrative depth-aligned tracks: lithology, gamma ray, spontaneous potential, resistivity, porosity, density, fluid, perforation and formation correlation. Two unperforated candidate intervals are highlighted for review.">
        <rect width={W} height={HEIGHT} fill="hsl(var(--card))" />
        <rect y={0} width={W} height={HEADER} fill="hsl(var(--secondary))" />
        {tracks.map((track) => <g key={track.label}>
          <rect x={track.x} y={HEADER} width={track.width} height={PLOT} fill={track.label === "DEPTH" ? "hsl(var(--secondary) / 0.45)" : "hsl(var(--background) / 0.5)"} />
          <line x1={track.x} x2={track.x} y1={0} y2={HEIGHT} stroke="hsl(var(--border))" />
          <text x={track.x + track.width / 2} y={25} fill="hsl(var(--foreground))" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="1">{track.label}</text>
        </g>)}
        <text x={W - 2} y={25} fill="hsl(var(--border))" fontSize="12">|</text>
        <text x={205} y={49} fill="hsl(var(--success))" textAnchor="middle" fontSize="11">GR</text>
        <text x={246} y={49} fill="hsl(var(--primary-glow))" textAnchor="middle" fontSize="11">SP</text>
        <text x={535} y={49} fill="hsl(var(--destructive))" textAnchor="middle" fontSize="11">DEEP / SHALLOW</text>
        <text x={750} y={49} fill="hsl(var(--accent))" textAnchor="middle" fontSize="11">NPHI / RHOB</text>
        <text x={372} y={49} fill="hsl(var(--muted-foreground))" textAnchor="middle" fontSize="11">ft</text>
        {ticks.map((d) => <g key={d}>
          <line x1={0} x2={W} y1={y(d)} y2={y(d)} stroke="hsl(var(--border))" strokeDasharray={d % 50 ? "2 6" : undefined} />
          <text x={372} y={y(d) - 5} fill="hsl(var(--foreground))" textAnchor="middle" fontFamily="monospace" fontSize="11">{d.toLocaleString()}</text>
        </g>)}
        {zones.map((z) => {
          const top = y(z.from), height = y(z.to) - top;
          const isCandidate = z.kind === "missed";
          const isPay = z.kind === "pay";
          return <g key={z.from}>
            <rect x={0} y={top} width={90} height={height} fill={z.kind === "shale" ? "hsl(var(--secondary))" : z.kind === "water" ? "hsl(var(--primary-glow) / 0.2)" : "hsl(var(--accent) / 0.2)"} />
            {Array.from({ length: Math.floor(height / 9) }, (_, i) => <line key={i} x1={5} x2={85} y1={top + 5 + i * 9} y2={top + 5 + i * 9} stroke={z.kind === "shale" ? "hsl(var(--muted-foreground) / 0.35)" : "hsl(var(--accent) / 0.5)"} />)}
            {(isCandidate || isPay) && <rect x={90} y={top} width={770} height={height} fill={isCandidate ? "hsl(var(--destructive) / 0.12)" : "hsl(var(--success) / 0.1)"} />}
            {isCandidate && <>
              <line x1={0} x2={W} y1={top} y2={top} stroke="hsl(var(--destructive) / 0.8)" strokeDasharray="5 4" />
              <line x1={0} x2={W} y1={top + height} y2={top + height} stroke="hsl(var(--destructive) / 0.8)" strokeDasharray="5 4" />
            </>}
            {(isCandidate || isPay || z.kind === "water") && <>
              <rect x={865} y={top + 2} width={75} height={Math.max(0, height - 4)} fill={isCandidate || isPay ? "hsl(var(--success) / 0.35)" : "hsl(var(--primary-glow) / 0.2)"} />
              <text x={902} y={top + height / 2 + 4} fill={isCandidate || isPay ? "hsl(var(--success))" : "hsl(var(--primary-glow))"} textAnchor="middle" fontSize="10" fontWeight="700">{z.kind === "water" ? "WATER" : "OIL?"}</text>
            </>}
            {isPay && <rect x={966} y={top + 3} width={26} height={Math.max(0, height - 6)} fill="hsl(var(--accent) / 0.8)" />}
            {isCandidate && <>
              <rect x={322} y={top + height / 2 - 11} width={101} height={22} rx={2} fill="hsl(var(--destructive))" />
              <text x={372} y={top + height / 2 + 4} fill="hsl(var(--destructive-foreground))" textAnchor="middle" fontSize="10" fontWeight="700">REVIEW</text>
            </>}
            {height > 30 && <text x={1056} y={top + height / 2 + 3} fill="hsl(var(--muted-foreground))" textAnchor="middle" fontSize="10">{z.name.length > 14 ? (isCandidate ? "Candidate" : z.name) : z.name}</text>}
          </g>;
        })}
        {[{ d: paths.gr, color: "--success" }, { d: paths.sp, color: "--primary-glow" }, { d: paths.resistivity, color: "--destructive" }, { d: paths.resistivityNear, color: "--accent" }, { d: paths.porosity, color: "--accent" }, { d: paths.density, color: "--primary-glow" }].map((p, i) => <path key={i} d={p.d} fill="none" stroke={`hsl(var(${p.color}))`} strokeWidth={i % 2 ? 1.3 : 2.2} opacity={i % 2 ? 0.7 : 1} />)}
        {scanProgress !== undefined && scanProgress < 1 && <g>
          <line x1={0} x2={W} y1={HEADER + scanProgress * PLOT} y2={HEADER + scanProgress * PLOT} stroke="hsl(var(--primary))" strokeWidth={2} />
          <rect x={0} y={HEADER + scanProgress * PLOT + 2} width={W} height={PLOT * (1 - scanProgress)} fill="hsl(var(--background) / 0.5)" />
        </g>}
      </svg>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
      <span><span className="text-success">●</span> Gamma ray</span><span><span className="text-destructive">●</span> Resistivity</span><span><span className="text-accent">●</span> Porosity</span><span><span className="text-primary-glow">●</span> Fluid response</span><span><span className="text-destructive">●</span> Unperforated candidate · needs verification</span>
    </div>
  </section>;
}