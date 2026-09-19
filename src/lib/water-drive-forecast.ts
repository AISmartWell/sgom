/**
 * Reservoir-dynamics forecast for a gas well with aquifer support.
 *
 * Deterministic, physics-first: the forecast is a forward solution of the
 * Havlena–Odeh gas balance coupled with an inflow-performance (deliverability)
 * relation and an aquifer influx model.
 *
 *   Material balance :  Gp·Bg + Wp·Bw = G·(Bg − Bgi) + We(P, t)
 *   Deliverability   :  qg = C · (P² − Pwf²)        (back-pressure, n = 1)
 *   Aquifer          :  Fetkovich (1971) or Carter–Tracy (1960), from water-drive.ts
 *
 * Each time step solves for the reservoir pressure P that satisfies both the
 * balance and the deliverability equation (bisection), then advances time.
 * Water production follows the measured water–gas ratio, amplified as the
 * water-drive index grows (advancing front / coning proxy).
 */

import {
  gasFVF, fetkovichInflux, carterTracyInflux,
  type AquiferModel, type WaterDrivePoint,
  type FetkovichParams, type CarterTracyParams,
} from "./water-drive";

export interface DynamicsForecastInput {
  history: WaterDrivePoint[];
  model: AquiferModel;
  params: FetkovichParams | CarterTracyParams;
  /** aquifer-corrected OGIP, scf */
  G: number;
  T_R: number;
  Bw: number;
  /** flowing bottom-hole pressure, psia */
  Pwf: number;
  /** abandonment reservoir pressure, psia */
  Pab: number;
  /** economic gas rate limit, Mscf/d */
  qEconMscfd: number;
  /** forecast horizon, years */
  years: number;
  /** time step, days */
  stepDays?: number;
}

export interface DynamicsForecastPoint {
  t: number;        // days
  years: number;
  P: number;        // psia
  qg: number;       // Mscf/d
  qw: number;       // bbl/d
  Gp: number;       // scf, cumulative
  Wp: number;       // bbl, cumulative
  We: number;       // reservoir bbl, cumulative influx
  wgr: number;      // bbl/MMscf
  wdi: number;      // water-drive index, fraction
  forecast: boolean;
}

export interface DynamicsForecastResult {
  series: DynamicsForecastPoint[];
  /** last historical point index in series */
  historyCount: number;
  qNow: number;         // Mscf/d at start of forecast
  EUR: number;          // scf, cumulative gas at end of forecast
  remaining: number;    // scf produced during the forecast
  waterForecast: number;// bbl produced during the forecast
  rf: number;           // EUR / G
  yearsToLimit: number | null;
  stopReason: "abandonment pressure" | "economic rate" | "horizon";
  wdiEnd: number;
}

/** Linear Z(P) from the measured history, clamped to a physical window. */
function zModel(history: WaterDrivePoint[]) {
  const n = history.length;
  const sx = history.reduce((a, p) => a + p.P, 0);
  const sy = history.reduce((a, p) => a + p.Z, 0);
  const sxx = history.reduce((a, p) => a + p.P * p.P, 0);
  const sxy = history.reduce((a, p) => a + p.P * p.Z, 0);
  const den = n * sxx - sx * sx;
  const slope = Math.abs(den) > 1e-9 ? (n * sxy - sx * sy) / den : 0;
  const icpt = (sy - slope * sx) / n;
  return (P: number) => Math.min(1.6, Math.max(0.3, slope * P + icpt));
}

function influx(pts: WaterDrivePoint[], model: AquiferModel, params: FetkovichParams | CarterTracyParams) {
  return model === "fetkovich"
    ? fetkovichInflux(pts, params as FetkovichParams)
    : carterTracyInflux(pts, params as CarterTracyParams);
}

export function forecastWaterDrive(input: DynamicsForecastInput): DynamicsForecastResult | null {
  const {
    history, model, params, G, T_R, Bw, Pwf, Pab, qEconMscfd, years,
    stepDays = 90,
  } = input;

  if (history.length < 3 || !(G > 0)) return null;
  const hist = [...history].sort((a, b) => a.t - b.t);
  const Z = zModel(hist);
  const Bgi = gasFVF(hist[0].P, hist[0].Z, T_R);

  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  const dtLast = last.t - prev.t;
  const qLast = dtLast > 0 ? (last.Gp - prev.Gp) / dtLast : 0; // scf/d
  if (!(qLast > 0)) return null;

  const pwf = Math.min(Math.max(Pwf, 14.7), last.P * 0.95);
  const C = qLast / Math.max(last.P * last.P - pwf * pwf, 1); // scf/d/psi²

  // measured water-gas ratio, bbl per scf
  const wgr0 = last.Gp > prev.Gp
    ? Math.max(0, ((last.Wp ?? 0) - (prev.Wp ?? 0)) / (last.Gp - prev.Gp))
    : 0;

  // historical series (for display + baseline We)
  const heWe = influx(hist, model, params);
  const series: DynamicsForecastPoint[] = hist.map((p, i) => {
    const Bg = gasFVF(p.P, p.Z, T_R);
    const F = p.Gp * Bg + (p.Wp ?? 0) * Bw;
    const dt = i > 0 ? p.t - hist[i - 1].t : 0;
    const qg = dt > 0 ? (p.Gp - hist[i - 1].Gp) / dt / 1e3 : 0;
    const qw = dt > 0 ? ((p.Wp ?? 0) - (hist[i - 1].Wp ?? 0)) / dt : 0;
    return {
      t: p.t, years: p.t / 365.25, P: p.P, qg, qw, Gp: p.Gp, Wp: p.Wp ?? 0,
      We: heWe[i], wgr: qg > 0 ? (qw / (qg * 1e3)) * 1e6 : 0,
      wdi: F > 0 ? heWe[i] / F : 0, forecast: false,
    };
  });

  const wdi0 = series[series.length - 1].wdi || 0.01;

  const work: WaterDrivePoint[] = hist.map(p => ({ ...p }));
  let Gp = last.Gp;
  let Wp = last.Wp ?? 0;
  let P = last.P;
  let t = last.t;
  let stopReason: DynamicsForecastResult["stopReason"] = "horizon";
  let yearsToLimit: number | null = null;
  const tEnd = last.t + years * 365.25;

  while (t < tEnd) {
    const tNext = Math.min(t + stepDays, tEnd);
    const dt = tNext - t;

    // Gp implied by the balance at candidate pressure Pc
    const gpAt = (Pc: number) => {
      const z = Z(Pc);
      const Bg = gasFVF(Pc, z, T_R);
      const trial = [...work, { t: tNext, P: Pc, Z: z, Gp, Wp }];
      const we = influx(trial, model, params);
      const We = we[we.length - 1];
      const gp = (G * (Bg - Bgi) + We - Wp * Bw) / Bg;
      return { gp, We, Bg, z };
    };

    // f(P) = balance rate − deliverability rate; root via bisection
    const f = (Pc: number) => (gpAt(Pc).gp - Gp) / dt - C * Math.max(Pc * Pc - pwf * pwf, 0);

    let lo = pwf + 1, hi = P;
    if (f(hi) > 0) { // already producing faster than deliverability allows
      lo = hi; hi = P;
    }
    let Pn = lo;
    if (f(lo) > 0 && f(hi) < 0) {
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        if (f(mid) > 0) lo = mid; else hi = mid;
      }
      Pn = (lo + hi) / 2;
    } else {
      Pn = Math.max(pwf + 1, hi * 0.995);
    }

    const state = gpAt(Pn);
    const dGp = Math.max(0, state.gp - Gp);
    const qg = dGp / dt / 1e3; // Mscf/d

    // water: measured WGR amplified by the growth of the water-drive index
    const Fn = state.gp * state.Bg + Wp * Bw;
    const wdi = Fn > 0 ? state.We / Fn : 0;
    const amp = Math.min(6, Math.max(1, (wdi / Math.max(wdi0, 0.01)) ** 1.5));
    const wgr = wgr0 * amp;
    const dWp = wgr * dGp;

    Gp = state.gp; Wp += dWp; P = Pn; t = tNext;
    work.push({ t, P, Z: state.z, Gp, Wp });

    series.push({
      t, years: t / 365.25, P, qg, qw: dWp / dt, Gp, Wp, We: state.We,
      wgr: qg > 0 ? (dWp / dt / (qg * 1e3)) * 1e6 : 0,
      wdi, forecast: true,
    });

    if (P <= Pab) { stopReason = "abandonment pressure"; yearsToLimit = (t - last.t) / 365.25; break; }
    if (qg <= qEconMscfd) { stopReason = "economic rate"; yearsToLimit = (t - last.t) / 365.25; break; }
  }

  const end = series[series.length - 1];
  return {
    series,
    historyCount: hist.length,
    qNow: qLast / 1e3,
    EUR: end.Gp,
    remaining: Math.max(0, end.Gp - last.Gp),
    waterForecast: Math.max(0, end.Wp - (last.Wp ?? 0)),
    rf: G > 0 ? end.Gp / G : 0,
    yearsToLimit,
    stopReason,
    wdiEnd: end.wdi,
  };
}
