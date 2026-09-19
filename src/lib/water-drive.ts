/**
 * Water-drive gas material balance — aquifer influx models.
 *
 * When the P/Z plot curves downward the reservoir is not volumetric:
 * an aquifer is supporting pressure, and the straight-line extrapolation
 * UNDER-estimates OGIP. The honest balance is the Havlena–Odeh gas form:
 *
 *      F = G · Eg + We
 *      F  = Gp·Bg + Wp·Bw        (reservoir bbl withdrawn)
 *      Eg = Bg − Bgi             (gas expansion, bbl/scf)
 *      We = cumulative water influx (reservoir bbl)
 *
 * Diagnostic plot:  F/Eg  vs  We/Eg  → intercept = G, slope = 1 when the
 * aquifer model is correct. We therefore grid-search the aquifer parameters
 * that drive the slope to unity with the best linearity.
 *
 * Aquifer models implemented:
 *   Fetkovich (1971), SPE 2603 — pseudo-steady-state finite aquifer.
 *   Carter–Tracy (1960) — infinite-acting radial aquifer, van Everdingen–Hurst
 *   dimensionless pressure via the Edwardson et al. (1962) approximation.
 *
 * References:
 *   Havlena D., Odeh A.S. (1963) SPE 559.
 *   Fetkovich M.J. (1971) JPT, "A Simplified Approach to Water Influx Calculations".
 *   Carter R.D., Tracy G.W. (1960) Trans. AIME 219.
 *   Craft & Hawkins, Applied Petroleum Reservoir Engineering, Ch. 6.
 */

export interface WaterDrivePoint {
  t: number;   // time, days (cumulative since production start)
  P: number;   // reservoir pressure, psia
  Z: number;   // gas deviation factor at P & T
  Gp: number;  // cumulative gas produced, scf
  Wp?: number; // cumulative water produced, STB
}

export type AquiferModel = "fetkovich" | "carter_tracy";

export interface FetkovichParams {
  /** Initial encroachable water, reservoir bbl:  Wei = ct · Wi · pi */
  Wei: number;
  /** Aquifer productivity index, bbl/d/psi */
  J: number;
}

export interface CarterTracyParams {
  /** Aquifer constant B' = 1.119·φ·ct·ro²·h·f, bbl/psi */
  B: number;
  /** Dimensionless-time conversion, tD = C · t(days) */
  C: number;
}

export interface WaterDriveResult {
  model: AquiferModel;
  /** OGIP corrected for aquifer support, scf */
  G: number;
  /** slope of F/Eg vs We/Eg — should be ≈ 1 for a correct aquifer model */
  slope: number;
  r2: number;
  /** coefficient of variation of the per-point OGIP — 0 = perfect aquifer match */
  cv: number;
  /** cumulative water influx at the last point, reservoir bbl */
  We_last: number;
  /** water-drive index We / F at the last point (0 = volumetric, 1 = full support) */
  wdi: number;
  params: FetkovichParams | CarterTracyParams;
  series: Array<{ t: number; P: number; We: number; F: number; Eg: number; FoverEg: number; WeoverEg: number }>;
}

/** Bg in reservoir bbl per scf.  Bg = 0.00504 · Z · T(°R) / P(psia) */
export function gasFVF(P: number, Z: number, T_R: number): number {
  return (0.00504 * Z * T_R) / P;
}

/** Fetkovich pseudo-steady-state finite aquifer influx series. */
export function fetkovichInflux(
  pts: WaterDrivePoint[],
  { Wei, J }: FetkovichParams,
): number[] {
  const pi = pts[0].P;
  const We: number[] = [0];
  let Wecum = 0;
  for (let n = 1; n < pts.length; n++) {
    const dt = pts[n].t - pts[n - 1].t;
    if (!(dt > 0) || Wei <= 0 || J <= 0) { We.push(Wecum); continue; }
    // average aquifer pressure after previous influx
    const pa = pi * (1 - Wecum / Wei);
    // average reservoir (inner boundary) pressure over the step
    const pR = (pts[n].P + pts[n - 1].P) / 2;
    const dWe = ((Wei / pi) * (pa - pR)) * (1 - Math.exp((-J * pi * dt) / Wei));
    Wecum = Math.max(0, Wecum + dWe);
    We.push(Wecum);
  }
  return We;
}

/** van Everdingen–Hurst dimensionless pressure, Edwardson et al. approximation. */
function pD(tD: number): number {
  if (tD <= 0) return 0;
  if (tD < 100) {
    const s = Math.sqrt(tD);
    return (
      (370.529 * s + 137.582 * tD + 5.69549 * tD * s) /
      (328.834 + 265.488 * s + 45.2157 * tD + tD * s)
    );
  }
  return (2.02566 * tD - 4.29881) / Math.log(tD);
}

function pDprime(tD: number): number {
  const h = Math.max(tD * 1e-4, 1e-6);
  return (pD(tD + h) - pD(Math.max(tD - h, 1e-9))) / (tD + h - Math.max(tD - h, 1e-9));
}

/** Carter–Tracy infinite radial aquifer influx series. */
export function carterTracyInflux(
  pts: WaterDrivePoint[],
  { B, C }: CarterTracyParams,
): number[] {
  const pi = pts[0].P;
  const We: number[] = [0];
  let Wecum = 0;
  for (let n = 1; n < pts.length; n++) {
    const tDn = C * pts[n].t;
    const tDprev = C * pts[n - 1].t;
    const dtD = tDn - tDprev;
    if (!(dtD > 0) || B <= 0) { We.push(Wecum); continue; }
    const dp = pi - pts[n].P;
    const p = pD(tDn);
    const dp_dtD = pDprime(tDn);
    const denom = p - tDprev * dp_dtD;
    if (!isFinite(denom) || Math.abs(denom) < 1e-12) { We.push(Wecum); continue; }
    Wecum = Math.max(0, Wecum + ((B * dp - Wecum * dp_dtD) / denom) * dtD);
    We.push(Wecum);
  }
  return We;
}

function regress(x: number[], y: number[]) {
  const n = x.length;
  const sx = x.reduce((a, b) => a + b, 0);
  const sy = y.reduce((a, b) => a + b, 0);
  const sxx = x.reduce((a, b) => a + b * b, 0);
  const sxy = x.reduce((a, b, i) => a + b * y[i], 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const meanY = sy / n;
  const ssTot = y.reduce((a, b) => a + (b - meanY) ** 2, 0);
  const ssRes = y.reduce((a, b, i) => a + (b - (slope * x[i] + intercept)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

/**
 * Evaluate a given aquifer parameter set: builds the F/Eg vs We/Eg
 * diagnostic and returns OGIP (intercept) plus fit quality.
 */
export function evaluateWaterDrive(
  pts: WaterDrivePoint[],
  model: AquiferModel,
  params: FetkovichParams | CarterTracyParams,
  T_R: number,
  Bw = 1.0,
): WaterDriveResult | null {
  if (pts.length < 4) return null;
  const sorted = [...pts].sort((a, b) => a.t - b.t);
  const We =
    model === "fetkovich"
      ? fetkovichInflux(sorted, params as FetkovichParams)
      : carterTracyInflux(sorted, params as CarterTracyParams);

  const Bgi = gasFVF(sorted[0].P, sorted[0].Z, T_R);
  const series: WaterDriveResult["series"] = [];
  const xs: number[] = [];
  const ys: number[] = [];

  for (let n = 1; n < sorted.length; n++) {
    const p = sorted[n];
    const Bg = gasFVF(p.P, p.Z, T_R);
    const Eg = Bg - Bgi;
    if (!(Eg > 0)) continue;
    const F = p.Gp * Bg + (p.Wp ?? 0) * Bw;
    const FoverEg = F / Eg;
    const WeoverEg = We[n] / Eg;
    if (!isFinite(FoverEg) || !isFinite(WeoverEg)) continue;
    series.push({ t: p.t, P: p.P, We: We[n], F, Eg, FoverEg, WeoverEg });
    xs.push(WeoverEg);
    ys.push(FoverEg);
  }
  if (series.length < 3) return null;

  // Unit-slope (physically constrained) solution: G_i = (F_i - We_i)/Eg_i.
  // The correct aquifer model makes every G_i identical.
  const Gi = series.map(s => (s.F - s.We) / s.Eg);
  if (Gi.some(g => !isFinite(g) || g <= 0)) return null;
  const G = Gi.reduce((a, b) => a + b, 0) / Gi.length;
  const sd = Math.sqrt(Gi.reduce((a, b) => a + (b - G) ** 2, 0) / Gi.length);
  const cv = G > 0 ? sd / G : Infinity;

  // Free regression is kept purely as a diagnostic (slope should come out ~1).
  const reg = regress(xs, ys);
  const last = series[series.length - 1];

  return {
    model,
    G,
    slope: reg ? reg.slope : NaN,
    r2: (() => {
      const meanF = series.reduce((a, b) => a + b.F, 0) / series.length;
      const ssTot = series.reduce((a, b) => a + (b.F - meanF) ** 2, 0);
      const ssRes = series.reduce((a, b) => a + (b.F - (G * b.Eg + b.We)) ** 2, 0);
      return ssTot > 0 ? 1 - ssRes / ssTot : 0;
    })(),
    cv,
    We_last: last.We,
    wdi: last.F > 0 ? last.We / last.F : 0,
    params,
    series,
  };
}

/**
 * Grid-search the aquifer parameters that make every point return the same
 * OGIP on the unit-slope Havlena-Odeh line. Objective = coefficient of
 * variation of the per-point G_i.
 */
export function fitWaterDrive(
  pts: WaterDrivePoint[],
  model: AquiferModel,
  T_R: number,
  Bw = 1.0,
): WaterDriveResult | null {
  if (pts.length < 4) return null;
  const sorted = [...pts].sort((a, b) => a.t - b.t);
  const lastGp = sorted[sorted.length - 1].Gp;
  const Bg_last = gasFVF(sorted[sorted.length - 1].P, sorted[sorted.length - 1].Z, T_R);
  const scale = Math.max(lastGp * Bg_last, 1e3); // reservoir-bbl order of magnitude
  const days = sorted[sorted.length - 1].t - sorted[0].t || 1;

  let best: WaterDriveResult | null = null;
  let bestObj = Infinity;

  const consider = (params: FetkovichParams | CarterTracyParams) => {
    const res = evaluateWaterDrive(sorted, model, params, T_R, Bw);
    if (!res || !isFinite(res.G) || res.G <= 0) return;
    const obj = res.cv;
    if (obj < bestObj) { bestObj = obj; best = res; }
  };

  if (model === "fetkovich") {
    for (let a = -1; a <= 3; a += 0.25) {
      const Wei = scale * Math.pow(10, a);          // bbl
      for (let b = -4; b <= 1; b += 0.25) {
        const J = (scale / days) * Math.pow(10, b); // bbl/d/psi
        consider({ Wei, J });
      }
    }
  } else {
    for (let a = -3; a <= 2; a += 0.2) {
      const B = (scale / 1000) * Math.pow(10, a);   // bbl/psi
      for (let b = -4; b <= 0; b += 0.25) {
        const C = Math.pow(10, b);                  // 1/day
        consider({ B, C });
      }
    }
  }

  return best;
}
