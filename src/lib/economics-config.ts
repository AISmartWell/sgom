/**
 * Unified economic parameters for all modules.
 * Single source of truth for CAPEX, OPEX, oil price, and SPT gain assumptions.
 *
 * Modules consuming this config:
 *   - EconomicStageViz  (Oklahoma Pilot per-well card)
 *   - EconomicAnalysisDemo (Stage 5 detailed analysis)
 *   - FinancialCalculator (Financial Forecast page)
 */

// ── Price & operating costs ─────────────────────────────────────────
export const DEFAULT_OIL_PRICE = 72; // $/bbl WTI baseline
export const DEFAULT_OPEX_PER_BBL = 18; // $/bbl operating cost

// ── SPT treatment cost (per well) ──────────────────────────────────
export const DEFAULT_TREATMENT_COST = 85_000; // $ per well SPT treatment

// ── SPT production gain (bbl/d per well, by water-cut bracket) ─────
export function sptGainByWaterCut(waterCut: number): number {
  if (waterCut < 30) return 7;
  if (waterCut < 50) return 5;
  if (waterCut < 70) return 3;
  return 1.5;
}

// ── Financial Calculator defaults (portfolio-level) ────────────────
export const FINANCIAL_DEFAULTS = {
  landCost: 320_000,
  recoveryCost: 800_000,
  wellCount: 4,
  /** Total production increase across all wells (bbl/d) — 7 bbl/d × 4 wells */
  productionIncrease: 28,
  operatingCostPercent: 30,
};

// ── ROI thresholds for UI color coding ─────────────────────────────
export const ROI_THRESHOLDS = {
  strong: 200,  // ≥200% → green / "Strong"
  good: 100,    // ≥100% → yellow / "Good"
  // <100% → "Marginal", <0% → "Negative"
};

// ── Arps decline defaults ───────────────────────────────────────────
export const ARPS_DEFAULTS = {
  Di: 0.025,
  b: 0.5,
};

// ── Arps decline functions (shared across all economic modules) ─────
/** Generalized Arps decline: q(t) = qi / (1 + b·Di·t)^(1/b) */
export function arpsRate(qi: number, Di: number, b: number, t: number): number {
  if (b < 0.001) return qi * Math.exp(-Di * t);
  const denom = 1 + b * Di * t;
  if (denom <= 0) return 0;
  return qi / Math.pow(denom, 1 / b);
}

/** 5-Year ROI with Arps decline: (cumNetProfit - capex) / capex * 100 */
export function calcFiveYearROI(
  addedProdBPD: number,
  oilPrice: number,
  opex: number,
  capex: number,
  Di: number = ARPS_DEFAULTS.Di,
  b: number = ARPS_DEFAULTS.b,
): { roi: number; fiveYearNet: number; paybackMonths: number } {
  let fiveYearNet = 0;
  let cumProfit = 0;
  let paybackMonths = Infinity;

  for (let m = 1; m <= 60; m++) {
    const monthlyRate = arpsRate(addedProdBPD, Di, b, m);
    const monthProfit = monthlyRate * 30.44 * (oilPrice - opex);
    fiveYearNet += monthProfit;
    cumProfit += monthProfit;
    if (cumProfit >= capex && paybackMonths === Infinity) {
      paybackMonths = m;
    }
  }

  const roi = capex > 0 ? ((fiveYearNet - capex) / capex) * 100 : 0;
  return { roi, fiveYearNet, paybackMonths: paybackMonths === Infinity ? 999 : paybackMonths };
}
