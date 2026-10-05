// Auto-picked GR sand markers correlated between wells. Candidates only:
// a geophysicist approves faults / pinch-outs. No formation names are assigned.
export interface LogPoint { depth: number; gr: number }
export interface SandBody { top: number; base: number; thickness: number }
export interface WellPicks { wellId: string; name: string; points: LogPoint[]; cutoff: number | null; sands: SandBody[]; logTop: number | null; logBase: number | null }
export type CellFlag = "ok" | "missing" | "offset" | "thinning" | "no_coverage";
export interface UnitCell { sand: SandBody | null; flag: CellFlag; deltaTop: number | null }
export interface CorrUnit { id: string; refTop: number; refBase: number; cells: Record<string, UnitCell>; medianThickness: number }
export interface Correlation { wells: WellPicks[]; units: CorrUnit[]; referenceId: string | null }

const pct = (s: number[], p: number) => s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))];
const median = (v: number[]) => { if (!v.length) return 0; const s = [...v].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function pickSands(wellId: string, name: string, raw: LogPoint[], minThickness = 4): WellPicks {
  const points = raw.filter(p => Number.isFinite(p.depth) && Number.isFinite(p.gr)).sort((a, b) => a.depth - b.depth);
  if (points.length < 3) return { wellId, name, points, cutoff: null, sands: [], logTop: points[0]?.depth ?? null, logBase: points.at(-1)?.depth ?? null };
  const g = points.map(p => p.gr).sort((a, b) => a - b);
  // Per-well normalisation: clean/shale baselines from P10/P90, cutoff at midpoint.
  const cutoff = (pct(g, 0.1) + pct(g, 0.9)) / 2;
  const sands: SandBody[] = [];
  let start: number | null = null;
  for (let i = 0; i < points.length; i++) {
    const clean = points[i].gr <= cutoff;
    if (clean && start === null) start = i;
    if ((!clean || i === points.length - 1) && start !== null) {
      const end = clean ? i : i - 1;
      const top = points[start].depth, base = points[end].depth;
      if (base - top >= minThickness) sands.push({ top, base, thickness: +(base - top).toFixed(1) });
      start = null;
    }
  }
  return { wellId, name, points, cutoff: +cutoff.toFixed(1), sands, logTop: points[0].depth, logBase: points.at(-1)!.depth };
}

export function correlate(wells: WellPicks[], toleranceFt = 100): Correlation {
  const withSands = wells.filter(w => w.sands.length);
  if (!withSands.length) return { wells, units: [], referenceId: null };
  const ref = [...withSands].sort((a, b) => b.sands.length - a.sands.length)[0];
  const units: CorrUnit[] = ref.sands.map((s, i) => ({ id: `U${i + 1}`, refTop: s.top, refBase: s.base, cells: {}, medianThickness: 0 }));
  for (const w of wells) {
    const used = new Set<number>();
    const pairs: { u: number; s: number; d: number }[] = [];
    units.forEach((u, ui) => w.sands.forEach((s, si) => pairs.push({ u: ui, s: si, d: Math.abs(s.top - u.refTop) })));
    pairs.sort((a, b) => a.d - b.d);
    const assigned = new Map<number, number>();
    for (const p of pairs) {
      if (p.d > toleranceFt * 2 || assigned.has(p.u) || used.has(p.s)) continue;
      assigned.set(p.u, p.s); used.add(p.s);
    }
    units.forEach((u, ui) => {
      const si = assigned.get(ui);
      const covered = w.logTop !== null && w.logBase !== null && u.refTop >= w.logTop - toleranceFt && u.refBase <= w.logBase + toleranceFt;
      u.cells[w.wellId] = si === undefined
        ? { sand: null, flag: covered ? "missing" : "no_coverage", deltaTop: null }
        : { sand: w.sands[si], flag: "ok", deltaTop: +(w.sands[si].top - u.refTop).toFixed(1) };
    });
  }
  for (const u of units) {
    const found = Object.values(u.cells).filter(c => c.sand);
    u.medianThickness = +median(found.map(c => c.sand!.thickness)).toFixed(1);
    const medTop = median(found.map(c => c.sand!.top));
    for (const c of found) {
      if (Math.abs(c.sand!.top - medTop) > toleranceFt) c.flag = "offset";
      else if (found.length > 1 && c.sand!.thickness < u.medianThickness * 0.3) c.flag = "thinning";
    }
  }
  return { wells, units, referenceId: ref.wellId };
}

export const flagLabel: Record<CellFlag, string> = {
  ok: "Correlated", missing: "Missing (possible pinch-out / fault)", offset: "Depth offset > tolerance",
  thinning: "Thinning < 30% of median", no_coverage: "Outside logged interval",
};
