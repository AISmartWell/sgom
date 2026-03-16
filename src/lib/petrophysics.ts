/**
 * Petrophysical calculation engine
 * Based on: Archie (1942), Ko Ko Rules, SLB interpretation methodology
 */

/* ── Types ── */
export type FluidType = "oil" | "gas" | "water" | "tight" | "shale" | "transition";

export interface PetroPoint {
  depth: number;
  gr: number;
  sp: number;
  res: number;
  por: number;         // effective porosity %
  sw: number;          // water saturation %
  rhob: number | null; // bulk density g/cc
  nphi: number | null; // neutron porosity (fraction or %)
}

export interface IntervalResult {
  top: number;
  bottom: number;
  thickness: number;
  avgGR: number;
  avgPor: number;
  avgSw: number;
  avgRes: number;
  avgRhob: number | null;
  avgNphi: number | null;
  vshale: number;           // 0–1
  fluidType: FluidType;
  kokoPattern: string;      // e.g. "L-R-L-L"
  isNetPay: boolean;
  isReservoir: boolean;
  archieSwCalc: number | null;  // Sw from Archie
  hydroSat: number | null;      // 1 - Sw
}

export interface InterpretationSummary {
  intervals: IntervalResult[];
  grossPay: number;
  netPay: number;
  netToGross: number;
  totalMissedPay: number;
  avgPorosity: number;
  avgSw: number;
  dominantFluid: FluidType;
}

/* ── Constants ── */
// GR cutoffs (API units)
const GR_CLEAN = 20;    // cleanest sandstone/carbonate
const GR_SHALE = 120;   // pure shale baseline

// Net Pay cutoffs
const CUTOFF_POR = 8;   // minimum porosity %
const CUTOFF_SW = 60;   // maximum water saturation %
const CUTOFF_VSH = 0.40; // maximum shale volume fraction

// Archie parameters (typical carbonate/sandstone)
const ARCHIE_A = 1.0;    // tortuosity factor
const ARCHIE_M = 2.0;    // cementation exponent
const ARCHIE_N = 2.0;    // saturation exponent
const RW_DEFAULT = 0.04; // formation water resistivity at reservoir temp (Ω·m)

/* ── Calculations ── */

/** Calculate Vshale (linear method) */
export const calcVshale = (gr: number, grClean = GR_CLEAN, grShale = GR_SHALE): number => {
  return Math.max(0, Math.min(1, (gr - grClean) / (grShale - grClean)));
};

/** Calculate Sw using Archie equation: Sw^n = (a * Rw) / (φ^m * Rt) */
export const calcArchieSwFromInputs = (
  porosity: number,    // fraction (0–1)
  rt: number,          // true resistivity Ω·m
  rw: number = RW_DEFAULT,
  a: number = ARCHIE_A,
  m: number = ARCHIE_M,
  n: number = ARCHIE_N
): number => {
  if (porosity <= 0.01 || rt <= 0) return 1.0;
  const phiM = Math.pow(porosity, m);
  const swN = (a * rw) / (phiM * rt);
  const sw = Math.pow(Math.max(0, Math.min(1, swN)), 1 / n);
  return Math.max(0, Math.min(1, sw));
};

/**
 * Ko Ko Rules: determine fluid type by curve deflection patterns
 * GR → Res → Density → Neutron
 * L = deflects left (lower), R = deflects right (higher)
 */
export const applyKoKoRules = (
  gr: number,
  res: number,
  rhob: number | null,
  nphi: number | null,
  por: number,
  // Baseline values for determining deflection direction
  grBaseline = 75,
  resBaseline = 10,
  rhobBaseline = 2.55,
  nphiBaseline = 15
): { fluidType: FluidType; pattern: string } => {
  // Determine deflection direction relative to baseline
  // "Left" = lower value, "Right" = higher value
  const grDir = gr < grBaseline ? "L" : "R";
  const resDir = res > resBaseline ? "R" : "L";

  // For density: lower = left (porous/gas), higher = right (tight)
  const denDir = rhob !== null
    ? (rhob < rhobBaseline ? "L" : "R")
    : (por > 10 ? "L" : "R"); // infer from porosity

  // For neutron: higher apparent porosity = left, lower = right
  const neuDir = nphi !== null
    ? (nphi > nphiBaseline ? "L" : "R")
    : (por > 10 ? "L" : "R");

  const pattern = `${grDir}-${resDir}-${denDir}-${neuDir}`;

  // Apply Ko Ko Rules
  // R-R-R-R → Tight non-reservoir
  if (grDir === "R" && resDir === "R" && denDir === "R" && neuDir === "R") {
    return { fluidType: "tight", pattern };
  }
  // R-R-R-L or R-L-R-L → Shale
  if (grDir === "R" && denDir === "R" && neuDir === "L") {
    return { fluidType: "shale", pattern };
  }
  // L-R-R-R → Low porosity (tight) reservoir
  if (grDir === "L" && resDir === "R" && denDir === "R" && neuDir === "R") {
    return { fluidType: "tight", pattern };
  }
  // L-L-L-L → Water bearing reservoir
  if (grDir === "L" && resDir === "L" && denDir === "L" && neuDir === "L") {
    return { fluidType: "water", pattern };
  }
  // L-R-L-L → Oil bearing reservoir
  if (grDir === "L" && resDir === "R" && denDir === "L" && neuDir === "L") {
    return { fluidType: "oil", pattern };
  }
  // L-R-L-R → Gas reservoir (density-neutron crossover)
  if (grDir === "L" && resDir === "R" && denDir === "L" && neuDir === "R") {
    return { fluidType: "gas", pattern };
  }
  // Transition / mixed — reservoir rock with ambiguous fluid
  if (grDir === "L") {
    return { fluidType: "transition", pattern };
  }
  return { fluidType: "shale", pattern };
};

/* ── Interval segmentation ── */

/**
 * Segment well log data into lithological intervals by GR changes
 * Uses sliding window to detect significant GR shifts
 */
export const segmentIntervals = (data: PetroPoint[], minThickness = 5): IntervalResult[] => {
  if (data.length < 3) return [];

  // Step 1: assign each point a lithology class based on GR
  const classes = data.map(p => {
    if (p.gr > 75) return "shale";
    if (p.gr > 50) return "transition";
    return "reservoir";
  });

  // Step 2: merge consecutive same-class points into intervals
  const rawIntervals: { start: number; end: number; class: string; points: PetroPoint[] }[] = [];
  let curClass = classes[0];
  let startIdx = 0;

  for (let i = 1; i < data.length; i++) {
    if (classes[i] !== curClass) {
      rawIntervals.push({
        start: startIdx,
        end: i - 1,
        class: curClass,
        points: data.slice(startIdx, i),
      });
      curClass = classes[i];
      startIdx = i;
    }
  }
  rawIntervals.push({
    start: startIdx,
    end: data.length - 1,
    class: curClass,
    points: data.slice(startIdx),
  });

  // Step 3: merge thin intervals (< minThickness ft) into neighbors
  const merged: typeof rawIntervals = [];
  for (const iv of rawIntervals) {
    const thickness = iv.points[iv.points.length - 1].depth - iv.points[0].depth;
    if (thickness < minThickness && merged.length > 0) {
      // Merge into previous
      merged[merged.length - 1].end = iv.end;
      merged[merged.length - 1].points.push(...iv.points);
    } else {
      merged.push({ ...iv });
    }
  }

  // Step 4: compute petrophysical properties per interval
  return merged.map(iv => {
    const pts = iv.points;
    const top = pts[0].depth;
    const bottom = pts[pts.length - 1].depth;
    const thickness = bottom - top;

    const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;

    const avgGR = avg(pts.map(p => p.gr));
    const avgPor = avg(pts.map(p => p.por));
    const avgSw = avg(pts.map(p => p.sw));
    const avgRes = avg(pts.map(p => p.res));

    const rhobVals = pts.map(p => p.rhob).filter(v => v !== null) as number[];
    const nphiVals = pts.map(p => p.nphi).filter(v => v !== null) as number[];
    const avgRhob = rhobVals.length > 0 ? avg(rhobVals) : null;
    const avgNphi = nphiVals.length > 0 ? avg(nphiVals) : null;

    const vshale = calcVshale(avgGR);

    // Archie Sw
    const porFrac = avgPor / 100;
    const archieSwCalc = porFrac > 0.01 ? calcArchieSwFromInputs(porFrac, avgRes) * 100 : null;

    // Ko Ko Rules
    const { fluidType, pattern } = applyKoKoRules(avgGR, avgRes, avgRhob, avgNphi, avgPor);

    // Net Pay determination
    const isReservoir = vshale < CUTOFF_VSH && avgPor > CUTOFF_POR;
    const effectiveSw = archieSwCalc ?? avgSw;
    const isNetPay = isReservoir && effectiveSw < CUTOFF_SW;

    const hydroSat = archieSwCalc !== null ? 100 - archieSwCalc : null;

    return {
      top,
      bottom,
      thickness: Math.round(thickness * 10) / 10,
      avgGR: Math.round(avgGR * 10) / 10,
      avgPor: Math.round(avgPor * 10) / 10,
      avgSw: Math.round(avgSw * 10) / 10,
      avgRes: Math.round(avgRes * 100) / 100,
      avgRhob,
      avgNphi,
      vshale: Math.round(vshale * 1000) / 1000,
      fluidType,
      kokoPattern: pattern,
      isNetPay,
      isReservoir,
      archieSwCalc: archieSwCalc !== null ? Math.round(archieSwCalc * 10) / 10 : null,
      hydroSat: hydroSat !== null ? Math.round(hydroSat * 10) / 10 : null,
    };
  });
};

/** Generate full interpretation summary */
export const interpretWellLog = (data: PetroPoint[]): InterpretationSummary => {
  const intervals = segmentIntervals(data);

  const payIntervals = intervals.filter(i => i.isReservoir);
  const netPayIntervals = intervals.filter(i => i.isNetPay);

  const grossPay = payIntervals.reduce((s, i) => s + i.thickness, 0);
  const netPay = netPayIntervals.reduce((s, i) => s + i.thickness, 0);

  const avgPorosity = netPayIntervals.length > 0
    ? netPayIntervals.reduce((s, i) => s + i.avgPor * i.thickness, 0) / (netPay || 1)
    : 0;
  const avgSw = netPayIntervals.length > 0
    ? netPayIntervals.reduce((s, i) => s + (i.archieSwCalc ?? i.avgSw) * i.thickness, 0) / (netPay || 1)
    : 0;

  // Dominant fluid in net pay
  const fluidCounts: Record<FluidType, number> = { oil: 0, gas: 0, water: 0, tight: 0, shale: 0, transition: 0 };
  for (const iv of netPayIntervals) fluidCounts[iv.fluidType] += iv.thickness;
  const dominantFluid = (Object.entries(fluidCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "water") as FluidType;

  // Missed pay = reservoir intervals with no net pay flag
  const totalMissedPay = payIntervals.filter(i => !i.isNetPay).reduce((s, i) => s + i.thickness, 0);

  return {
    intervals,
    grossPay: Math.round(grossPay),
    netPay: Math.round(netPay),
    netToGross: grossPay > 0 ? Math.round((netPay / grossPay) * 1000) / 10 : 0,
    totalMissedPay: Math.round(totalMissedPay),
    avgPorosity: Math.round(avgPorosity * 10) / 10,
    avgSw: Math.round(avgSw * 10) / 10,
    dominantFluid,
  };
};

/* ── Color helpers ── */
export const fluidColor = (ft: FluidType): string => {
  switch (ft) {
    case "oil": return "#22c55e";
    case "gas": return "#ef4444";
    case "water": return "#3b82f6";
    case "tight": return "#6b7280";
    case "shale": return "#8b8b2a";
    case "transition": return "#eab308";
  }
};

export const fluidLabel = (ft: FluidType): string => {
  switch (ft) {
    case "oil": return "🛢️ Oil";
    case "gas": return "⛽ Gas";
    case "water": return "💧 Water";
    case "tight": return "🪨 Tight";
    case "shale": return "📐 Shale";
    case "transition": return "🔀 Transition";
  }
};

export const fluidEmoji = (ft: FluidType): string => {
  switch (ft) {
    case "oil": return "🛢️";
    case "gas": return "⛽";
    case "water": return "💧";
    case "tight": return "🪨";
    case "shale": return "📐";
    case "transition": return "🔀";
  }
};
