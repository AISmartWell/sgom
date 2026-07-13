/**
 * PVT correlations for black oil (US field units)
 *
 * Correlations implemented:
 *   Standing (1947)        — Pb, Rs, Bo (saturated)
 *   Vasquez-Beggs (1980)   — Rs, Bo, co (saturated & undersaturated),
 *                            gas gravity correction to separator conditions
 *   Beggs-Robinson (1975)  — μod (dead oil), μob (live oil below Pb)
 *   Vasquez-Beggs (1980)   — μo above Pb
 *   McCain / Standing      — oil density from Rs, Bo, γo, γg
 *
 * Units:
 *   P, Pb    psia
 *   T        °F
 *   Rs       scf/STB
 *   Bo       bbl/STB
 *   γo       oil specific gravity (water = 1)  ↔  API = 141.5/γo − 131.5
 *   γg       gas specific gravity (air = 1)
 *   μo       cp
 *   ρo       lb/ft³
 *   co       1/psi
 *
 * References:
 *   Standing M.B. (1947, 1952). Volumetric and Phase Behavior of Oil
 *   Vasquez M., Beggs H.D. (1980). SPE 6719.
 *   Beggs H.D., Robinson J.R. (1975). SPE JPT 1140.
 *   McCain W.D. (1990). Properties of Petroleum Fluids, 2nd ed.
 *
 * All functions are pure — safe for both browser and Deno edge runtime.
 */

// ── Unit helpers ──────────────────────────────────────────────────────────
export const apiToGamma = (api: number) => 141.5 / (api + 131.5);
export const gammaToApi = (g: number) => 141.5 / g - 131.5;

// Vasquez-Beggs uses different constants above and below 30 °API
type VBCoefs = { c1: number; c2: number; c3: number };
function vbCoefs(api: number, kind: "rs" | "bo" | "co"): VBCoefs {
  if (kind === "rs") {
    return api <= 30
      ? { c1: 0.0362,  c2: 1.0937, c3: 25.7240 }
      : { c1: 0.0178,  c2: 1.1870, c3: 23.9310 };
  }
  if (kind === "bo") {
    return api <= 30
      ? { c1: 4.677e-4, c2: 1.751e-5, c3: -1.811e-8 }
      : { c1: 4.670e-4, c2: 1.100e-5, c3:  1.337e-9 };
  }
  // co (undersaturated compressibility)
  return api <= 30
    ? { c1: -1433.0, c2: 5.0, c3: 17.2 }
    : { c1: -1433.0, c2: 5.0, c3: 17.2 };
}

// ── Standing correlations ─────────────────────────────────────────────────

/** Standing bubble-point pressure. Pb [psia]. */
export function pbStanding(Rs: number, gammaG: number, tempF: number, api: number): number {
  // Pb = 18.2 · [(Rs/γg)^0.83 · 10^(0.00091·T − 0.0125·API) − 1.4]
  const a = (Rs / gammaG) ** 0.83;
  const b = 10 ** (0.00091 * tempF - 0.0125 * api);
  return 18.2 * (a * b - 1.4);
}

/** Standing solution GOR at pressure P (≤ Pb). Rs [scf/STB]. */
export function rsStanding(P: number, gammaG: number, tempF: number, api: number): number {
  const term = (P / 18.2 + 1.4) * 10 ** (0.0125 * api - 0.00091 * tempF);
  return gammaG * term ** 1.2048;
}

/** Standing Bo at saturated pressure (P = Pb, Rs known). Bo [bbl/STB]. */
export function boStanding(Rs: number, gammaG: number, gammaO: number, tempF: number): number {
  const F = Rs * Math.sqrt(gammaG / gammaO) + 1.25 * tempF;
  return 0.9759 + 12e-5 * F ** 1.2;
}

// ── Vasquez-Beggs ─────────────────────────────────────────────────────────

/**
 * Corrected gas gravity to 100 psig separator basis.
 * Applied once before Rs / Bo / Pb — pass tsep / psep from the actual first-stage separator.
 */
export function gammaGCorrected(gammaG: number, api: number, tsepF: number, psepPsia: number): number {
  // γg100 = γg · [1 + 5.912e-5 · API · Tsep · log10(Psep/114.7)]
  const factor = 1 + 5.912e-5 * api * tsepF * Math.log10(psepPsia / 114.7);
  return gammaG * factor;
}

/** Vasquez-Beggs Rs at pressure P (≤ Pb). */
export function rsVasquezBeggs(P: number, gammaG: number, tempF: number, api: number): number {
  const { c1, c2, c3 } = vbCoefs(api, "rs");
  // Rs = c1 · γg · P^c2 · exp(c3 · API / (T + 460))
  return c1 * gammaG * P ** c2 * Math.exp((c3 * api) / (tempF + 460));
}

/** Vasquez-Beggs Bo. If P > Pb, applies undersaturated compressibility. */
export function boVasquezBeggs(
  P: number, Pb: number, Rs: number, gammaG: number, api: number, tempF: number,
): number {
  const { c1, c2, c3 } = vbCoefs(api, "bo");
  const dT = tempF - 60;
  const boSat = 1 + c1 * Rs + dT * (api / gammaG) * (c2 + c3 * Rs);
  if (P <= Pb) return boSat;
  // Undersaturated: Bo = Bob · exp(-co · (P - Pb))
  const co = coVasquezBeggs(P, Pb, Rs, gammaG, api, tempF);
  return boSat * Math.exp(-co * (P - Pb));
}

/** Vasquez-Beggs undersaturated oil compressibility [1/psi]. */
export function coVasquezBeggs(
  P: number, _Pb: number, Rs: number, gammaG: number, api: number, tempF: number,
): number {
  // co = (-1433 + 5·Rs + 17.2·T − 1180·γg + 12.61·API) / (1e5 · P)
  const num = -1433 + 5 * Rs + 17.2 * tempF - 1180 * gammaG + 12.61 * api;
  return num / (1e5 * Math.max(P, 1));
}

// ── Beggs-Robinson viscosity ──────────────────────────────────────────────

/** Beggs-Robinson dead-oil viscosity μod [cp]. */
export function muDeadBeggsRobinson(api: number, tempF: number): number {
  // z = 3.0324 − 0.02023·API,  y = 10^z,  x = y · T^-1.163
  // μod = 10^x − 1
  const z = 3.0324 - 0.02023 * api;
  const y = 10 ** z;
  const x = y * tempF ** -1.163;
  return 10 ** x - 1;
}

/** Beggs-Robinson live (saturated) oil viscosity μob [cp]. */
export function muLiveBeggsRobinson(muDead: number, Rs: number): number {
  const a = 10.715 * (Rs + 100) ** -0.515;
  const b = 5.44 * (Rs + 150) ** -0.338;
  return a * muDead ** b;
}

/** Vasquez-Beggs viscosity above bubble point (undersaturated). */
export function muUnderVasquezBeggs(muob: number, P: number, Pb: number): number {
  if (P <= Pb) return muob;
  const m = 2.6 * P ** 1.187 * Math.exp(-11.513 - 8.98e-5 * P);
  return muob * (P / Pb) ** m;
}

/** Composite oil viscosity valid across P. */
export function muOil(
  P: number, Pb: number, Rs: number, api: number, tempF: number,
): number {
  const muod = muDeadBeggsRobinson(api, tempF);
  const muob = muLiveBeggsRobinson(muod, Rs);
  return muUnderVasquezBeggs(muob, P, Pb);
}

// ── Density (McCain material-balance form) ────────────────────────────────

/** Oil density at reservoir conditions ρo [lb/ft³]. */
export function rhoOil(Rs: number, Bo: number, gammaO: number, gammaG: number): number {
  // ρo = (62.4·γo + 0.0136·Rs·γg) / Bo
  return (62.4 * gammaO + 0.0136 * Rs * gammaG) / Math.max(Bo, 1e-6);
}

/** Convenience: fluid pressure gradient at reservoir conditions [psi/ft]. */
export function pressureGradient(rhoLbFt3: number): number {
  // g = ρ [lb/ft³] / 144  →  psi/ft
  return rhoLbFt3 / 144;
}

// ── Convenience: full PVT snapshot ────────────────────────────────────────

export interface PVTInput {
  P: number;         // psia
  tempF: number;     // °F
  api: number;       // °API
  gammaG: number;    // gas gravity (air = 1)
  Rsb?: number;      // if known, forces Pb = P at Rsb
  tsepF?: number;    // separator T
  psepPsia?: number; // separator P
  correlation?: "standing" | "vasquez_beggs";
}

export interface PVTSnapshot {
  Pb: number;
  Rs: number;
  Bo: number;
  muO: number;
  rhoO: number;
  co: number;
  gradient: number;
  correlation: string;
}

export function pvtSnapshot(inp: PVTInput): PVTSnapshot {
  const {
    P, tempF, api, Rsb, tsepF, psepPsia,
    correlation = "vasquez_beggs",
  } = inp;
  let gammaG = inp.gammaG;
  if (tsepF && psepPsia) gammaG = gammaGCorrected(gammaG, api, tsepF, psepPsia);
  const gammaO = apiToGamma(api);

  // Bubble point
  const Pb = Rsb !== undefined
    ? pbStanding(Rsb, gammaG, tempF, api)
    : pbStanding(rsVasquezBeggs(P, gammaG, tempF, api), gammaG, tempF, api);

  const useVB = correlation === "vasquez_beggs";
  const Rs = P <= Pb
    ? (useVB ? rsVasquezBeggs(P, gammaG, tempF, api)
             : rsStanding(P, gammaG, tempF, api))
    : (useVB ? rsVasquezBeggs(Pb, gammaG, tempF, api)
             : rsStanding(Pb, gammaG, tempF, api));

  const Bo = useVB
    ? boVasquezBeggs(P, Pb, Rs, gammaG, api, tempF)
    : boStanding(Rs, gammaG, gammaO, tempF);

  const co  = coVasquezBeggs(P, Pb, Rs, gammaG, api, tempF);
  const muO = muOil(P, Pb, Rs, api, tempF);
  const rho = rhoOil(Rs, Bo, gammaO, gammaG);

  return {
    Pb, Rs, Bo, muO, rhoO: rho, co,
    gradient: pressureGradient(rho),
    correlation,
  };
}
