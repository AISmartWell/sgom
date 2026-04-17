// Shared data + config for Well Log Analyzer video

const mkRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};

export type LogPoint = {
  depth: number;
  gr: number;
  sp: number;
  res: number;
  nphi: number;
  rhob: number;
};

export const generateData = (): LogPoint[] => {
  const rng = mkRng(42);
  const n = () => rng() - 0.5;
  const pts: LogPoint[] = [];
  for (let d = 1000; d <= 2500; d += 12) {
    const l =
      Math.sin(d / 88) +
      Math.sin(d / 41) * 0.6 +
      Math.cos(d / 185) * 0.3;
    pts.push({
      depth: d,
      gr: +Math.max(5, Math.min(148, 75 + l * 45 + n() * 10)).toFixed(1),
      sp: +Math.max(-128, Math.min(10, -55 - l * 38 + n() * 8)).toFixed(1),
      res: +Math.max(0.5, Math.min(298, Math.exp(2.3 + l * 1.8 + n() * 0.6))).toFixed(1),
      nphi: +Math.max(0.01, Math.min(0.44, 0.22 - l * 0.09 + n() * 0.04)).toFixed(3),
      rhob: +Math.max(1.82, Math.min(2.76, 2.35 + l * 0.18 + n() * 0.04)).toFixed(3),
    });
  }
  return pts;
};

export const WELL_DATA = generateData();

export type TrackCfg = {
  key: keyof Omit<LogPoint, "depth">;
  label: string;
  unit: string;
  color: string;
  domain: [number, number];
};

export const TRACKS: TrackCfg[] = [
  { key: "gr",   label: "GR",   unit: "API",  color: "#4ade80", domain: [0, 150] },
  { key: "sp",   label: "SP",   unit: "mV",   color: "#60a5fa", domain: [-140, 20] },
  { key: "res",  label: "RT",   unit: "Ω·m",  color: "#fb923c", domain: [0.5, 300] },
  { key: "nphi", label: "NPHI", unit: "v/v",  color: "#22d3ee", domain: [0.45, 0] },
  { key: "rhob", label: "RHOB", unit: "g/cc", color: "#e879f9", domain: [2.95, 1.75] },
];

export const STEPS = [
  "Parsing LAS file headers…",
  "Validating depth index…",
  "Normalizing curve data…",
  "Running AI Smart Well neural model…",
  "Computing petrophysical zones…",
  "Rendering well log display…",
];

export const FONT_DISPLAY = "'Rajdhani', system-ui, sans-serif";
export const FONT_MONO = "'Share Tech Mono', monospace";
export const BG = "#040912";
export const ACCENT = "#1A9FFF";
export const AMBER = "#f59e0b";
