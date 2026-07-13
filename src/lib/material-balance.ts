/**
 * Material Balance — honest MBAL for oil & gas reservoirs
 *
 *  Gas:  P/Z straight line (Havlena-Odeh reduced to gas)
 *        (P/Z) = (Pi/Zi) · (1 - Gp/G)
 *        → linear regression of (P/Z) vs Gp yields G (OGIP in scf).
 *
 *  Oil (undersaturated, no gas cap, no water):
 *        F = N · Eo
 *        F  = Np · [Bo + (Rp - Rs)·Bg]        (reservoir bbl)
 *        Eo = (Bo - Boi) + (Rsi - Rs)·Bg      (bbl/STB)
 *        Straight-line: plot F vs Eo → slope = N (OOIP in STB).
 *
 *  Both branches optionally accept measured (P, Np/Gp) history plus a PVT
 *  snapshot per pressure point. If no measured P history is available, the
 *  caller can fall back to the older MB-surrogate.
 *
 * References:
 *   Havlena D., Odeh A.S. (1963). SPE 559.
 *   Craft B.C., Hawkins M.F. (1991). Applied Petroleum Reservoir Engineering.
 */

export interface OilMBPoint {
  P: number;      // reservoir pressure, psia
  Np: number;     // cumulative oil, STB
  Rp?: number;    // cumulative GOR, scf/STB (Gp/Np)
  Bo: number;     // bbl/STB at P
  Rs: number;     // scf/STB at P
  Bg?: number;    // rcf/scf (or bbl/scf) at P; needed if Rp > Rs anywhere
}

export interface OilMBResult {
  N: number;                 // OOIP, STB
  intercept: number;
  r2: number;                // fit quality
  points: Array<{ Eo: number; F: number }>;
  Boi: number;
  Rsi: number;
  method: "havlena_odeh_oil";
}

/**
 * Havlena-Odeh straight-line for undersaturated oil (no aquifer, no gas cap).
 * First point (lowest Np, highest P) is treated as initial.
 */
export function havlenaOdehOil(points: OilMBPoint[]): OilMBResult | null {
  if (points.length < 3) return null;
  const sorted = [...points].sort((a, b) => a.Np - b.Np);
  const p0 = sorted[0];
  const Boi = p0.Bo;
  const Rsi = p0.Rs;

  const xy: Array<{ Eo: number; F: number }> = [];
  for (const p of sorted.slice(1)) {
    const Bg = p.Bg ?? 0;
    const Rp = p.Rp ?? Rsi; // if Rp not reported, assume solution GOR only
    const Eo = (p.Bo - Boi) + (Rsi - p.Rs) * Bg;
    const F  = p.Np * (p.Bo + (Rp - p.Rs) * Bg);
    if (isFinite(Eo) && isFinite(F) && Eo > 0) xy.push({ Eo, F });
  }
  if (xy.length < 2) return null;

  // Linear regression F = N · Eo + b   (force intercept for OOIP-only, or fit both)
  const n = xy.length;
  const sx = xy.reduce((s, p) => s + p.Eo, 0);
  const sy = xy.reduce((s, p) => s + p.F, 0);
  const sxx = xy.reduce((s, p) => s + p.Eo * p.Eo, 0);
  const sxy = xy.reduce((s, p) => s + p.Eo * p.F, 0);
  const denom = n * sxx - sx * sx;
  if (denom <= 0) return null;
  const N = (n * sxy - sx * sy) / denom;
  const intercept = (sy - N * sx) / n;

  const meanY = sy / n;
  const ssTot = xy.reduce((s, p) => s + (p.F - meanY) ** 2, 0);
  const ssRes = xy.reduce((s, p) => s + (p.F - (N * p.Eo + intercept)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { N, intercept, r2, points: xy, Boi, Rsi, method: "havlena_odeh_oil" };
}

/**
 * P/Z material balance for dry / wet gas reservoir.
 * Requires (P, Gp, Z) history. Returns OGIP (scf) and abandonment forecast.
 */
export interface GasMBPoint {
  P: number;   // psia
  Gp: number;  // cumulative gas produced, scf
  Z: number;   // gas deviation factor at P & T
}

export interface GasMBResult {
  G: number;          // OGIP, scf
  Pi_over_Zi: number;
  r2: number;
  slope: number;      // −(Pi/Zi)/G  → so slope < 0
  points: Array<{ x: number; y: number }>;
  method: "p_over_z_gas";
}

export function pOverZGas(points: GasMBPoint[]): GasMBResult | null {
  if (points.length < 3) return null;
  const xy = points
    .filter(p => p.Z > 0 && isFinite(p.P) && isFinite(p.Gp))
    .map(p => ({ x: p.Gp, y: p.P / p.Z }));
  if (xy.length < 3) return null;

  const n = xy.length;
  const sx = xy.reduce((s, p) => s + p.x, 0);
  const sy = xy.reduce((s, p) => s + p.y, 0);
  const sxx = xy.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = xy.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (denom <= 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const Pi_over_Zi = (sy - slope * sx) / n;
  if (slope >= 0 || Pi_over_Zi <= 0) return null;

  const G = -Pi_over_Zi / slope;
  const meanY = sy / n;
  const ssTot = xy.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = xy.reduce((s, p) => s + (p.y - (slope * p.x + Pi_over_Zi)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { G, Pi_over_Zi, slope, r2, points: xy, method: "p_over_z_gas" };
}

/**
 * Estimate reservoir pressure at cumulative Np using the calibrated
 * Havlena-Odeh straight-line and a PVT lookup that returns (Bo, Rs, Bg)
 * for a candidate P. Used to project future depletion using an honest MB
 * rather than the older linear surrogate.
 */
export function pressureFromMB(
  Np: number,
  N: number,
  Boi: number,
  Rsi: number,
  pvt: (P: number) => { Bo: number; Rs: number; Bg: number; Rp?: number },
  pMin = 100,
  pMax = 12000,
  iters = 40,
): number | null {
  // Bisection on F(P) − N·Eo(P) = 0
  const g = (P: number) => {
    const { Bo, Rs, Bg, Rp = Rsi } = pvt(P);
    const Eo = (Bo - Boi) + (Rsi - Rs) * Bg;
    const F  = Np * (Bo + (Rp - Rs) * Bg);
    return F - N * Eo;
  };
  let lo = pMin, hi = pMax;
  let flo = g(lo), fhi = g(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < iters; i++) {
    const mid = 0.5 * (lo + hi);
    const fmid = g(mid);
    if (!isFinite(fmid)) return null;
    if (flo * fmid <= 0) { hi = mid; fhi = fmid; }
    else                 { lo = mid; flo = fmid; }
    if (Math.abs(hi - lo) < 1) return mid;
  }
  return 0.5 * (lo + hi);
}
