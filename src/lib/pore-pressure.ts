/**
 * Pore Pressure Estimation — Eaton (1975) resistivity method
 *
 * Pp(D) = Sv(D) − (Sv(D) − Pn(D)) · (Robs / Rnct)^n
 *
 *  Sv    — overburden (lithostatic) stress from ∫ρ·g dz (with Miller/Amoco
 *          extrapolation for the shallow interval where density log is absent)
 *  Pn    — normal hydrostatic pressure (0.433 psi/ft fresh, ~0.465 brine)
 *  Rnct  — normal compaction trend: exponential fit log(R) vs D
 *          on shale points only (GR ≥ shale cutoff), non-reservoir
 *  Robs  — measured deep resistivity at that depth
 *  n     — Eaton exponent, default 1.2 (Gulf Coast calibration).
 *          Requires calibration to a single RFT/DST point for local basins.
 *
 * Output is treated as a *soft prior* (not a hard SLSQP constraint) —
 * consumed by the Digital Twin Kalman/Bayesian layer with wide variance.
 *
 * References:
 *   Eaton B.A. (1975). SPE 5544.
 *   Miller T.W. (1995). Amoco overburden extrapolation.
 */

export interface PoreLogPoint {
  depth: number;       // ft
  gr: number | null;   // API
  res: number | null;  // Ω·m (deep resistivity)
  rhob: number | null; // g/cc
}

export interface PorePressurePoint {
  depth: number;
  sv_psi: number;         // overburden
  pn_psi: number;         // normal hydrostatic
  rnct: number | null;    // normal compaction trend value at this depth
  robs: number | null;    // observed resistivity
  pp_psi: number | null;  // Eaton pore pressure (null if no valid R)
  ppg: number | null;     // pore pressure gradient (psi/ft)
  isShale: boolean;
}

export interface PoreFitResult {
  a: number;              // Rnct = a · exp(b · D)  — normal compaction trend
  b: number;              // depth coefficient (typically negative → R grows with D in compaction; positive in resistivity method uses log(R) vs D)
  r2: number;             // fit quality on shale points
  shalePoints: number;
}

export interface PoreOptions {
  grShaleCutoff?: number;    // API — points with GR ≥ cutoff treated as shale
  hydrostaticGrad?: number;  // psi/ft (0.433 fresh, 0.465 brine)
  eatonExponent?: number;    // n (default 1.2 — Gulf Coast)
  surfaceRhob?: number;      // g/cc — Miller/Amoco surface density for extrapolation
  rhobGradient?: number;     // g/cc per 1000 ft — shallow density trend
  waterDepth?: number;       // ft (0 for onshore)
}

const G_TO_PSI_PER_FT = 0.4335; // ρ(g/cc) × 0.4335 = psi/ft

/**
 * Fit normal compaction trend on shale-only points:
 *   ln(R) = ln(a) + b · D   →   Rnct(D) = a · exp(b·D)
 * Least-squares in log-space.
 */
export function fitNCT(points: PoreLogPoint[], grShaleCutoff = 75): PoreFitResult {
  const shale = points.filter(
    (p) => p.gr !== null && p.res !== null && p.res > 0 && p.gr >= grShaleCutoff,
  );
  if (shale.length < 5) {
    return { a: 1, b: 0, r2: 0, shalePoints: shale.length };
  }
  const n = shale.length;
  const xs = shale.map((p) => p.depth);
  const ys = shale.map((p) => Math.log(p.res as number));
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den === 0 ? 0 : num / den;
  const lnA = my - b * mx;
  const a = Math.exp(lnA);
  // R²
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = lnA + b * xs[i];
    ssRes += (ys[i] - yPred) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a, b, r2, shalePoints: n };
}

/**
 * Miller/Amoco-style overburden: extrapolate density in the shallow
 * un-logged interval as a linear ramp from surface, then integrate
 * both extrapolated + measured segments cumulatively.
 */
export function overburdenProfile(
  points: PoreLogPoint[],
  opts: PoreOptions = {},
): Map<number, number> {
  const surfaceRhob = opts.surfaceRhob ?? 1.95;   // near-surface soil/rock
  const rhobGrad = opts.rhobGradient ?? 0.06;     // g/cc per 1000 ft
  const waterDepth = opts.waterDepth ?? 0;
  const seawaterRhob = 1.03;

  const sorted = [...points].sort((a, b) => a.depth - b.depth);
  const sv = new Map<number, number>();

  let cumPsi = waterDepth * seawaterRhob * G_TO_PSI_PER_FT;
  let prevDepth = waterDepth;

  // Fill from surface up to the first density-log point using Miller trend
  const firstWithRhob = sorted.find((p) => p.rhob !== null && p.rhob > 1.5);
  const topLoggedDepth = firstWithRhob?.depth ?? sorted[0]?.depth ?? 0;

  const stepShallow = 100; // ft
  for (let d = prevDepth + stepShallow; d < topLoggedDepth; d += stepShallow) {
    const rho = surfaceRhob + rhobGrad * ((d - waterDepth) / 1000);
    cumPsi += rho * G_TO_PSI_PER_FT * (d - prevDepth);
    prevDepth = d;
  }

  // Integrate real density log
  for (const p of sorted) {
    if (p.depth <= prevDepth) continue;
    const rho = p.rhob && p.rhob > 1.5
      ? p.rhob
      : surfaceRhob + rhobGrad * ((p.depth - waterDepth) / 1000);
    cumPsi += rho * G_TO_PSI_PER_FT * (p.depth - prevDepth);
    sv.set(p.depth, cumPsi);
    prevDepth = p.depth;
  }
  return sv;
}

/**
 * Full Eaton pore pressure profile.
 */
export function estimatePorePressure(
  points: PoreLogPoint[],
  opts: PoreOptions = {},
): { profile: PorePressurePoint[]; nct: PoreFitResult } {
  const grCut = opts.grShaleCutoff ?? 75;
  const pnGrad = opts.hydrostaticGrad ?? 0.465;
  const n = opts.eatonExponent ?? 1.2;

  const nct = fitNCT(points, grCut);
  const sv = overburdenProfile(points, opts);
  const sorted = [...points].sort((a, b) => a.depth - b.depth);

  const profile: PorePressurePoint[] = sorted.map((p) => {
    const svPsi = sv.get(p.depth) ?? p.depth * 1.0; // fallback: 1 psi/ft lithostatic
    const pn = p.depth * pnGrad;
    const rnct = nct.b === 0 && nct.a === 1 ? null : nct.a * Math.exp(nct.b * p.depth);
    let pp: number | null = null;
    if (rnct !== null && p.res !== null && p.res > 0) {
      const ratio = p.res / rnct;
      // Eaton: undercompaction → R below trend → ratio < 1 → Pp > Pn
      pp = svPsi - (svPsi - pn) * Math.pow(ratio, n);
      // clamp physically: Pn ≤ Pp ≤ Sv
      pp = Math.max(pn, Math.min(svPsi, pp));
    }
    return {
      depth: p.depth,
      sv_psi: svPsi,
      pn_psi: pn,
      rnct,
      robs: p.res,
      pp_psi: pp,
      ppg: pp !== null && p.depth > 0 ? pp / p.depth : null,
      isShale: p.gr !== null && p.gr >= grCut,
    };
  });

  return { profile, nct };
}

/**
 * Calibrate Eaton exponent n from a single measured pressure point
 * (RFT / DST / production test). Solves:
 *   Pp_meas = Sv − (Sv − Pn) · (Robs/Rnct)^n
 *   →  n = log((Sv − Pp_meas)/(Sv − Pn)) / log(Robs/Rnct)
 */
export function calibrateEatonExponent(
  depth: number,
  ppMeasured: number,
  sv: number,
  pn: number,
  robs: number,
  rnct: number,
): number | null {
  if (sv <= pn || robs <= 0 || rnct <= 0) return null;
  const numer = (sv - ppMeasured) / (sv - pn);
  const denom = robs / rnct;
  if (numer <= 0 || denom <= 0 || denom === 1) return null;
  return Math.log(numer) / Math.log(denom);
}
