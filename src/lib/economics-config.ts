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

// ── Arps decline defaults (EconomicAnalysisDemo) ───────────────────
export const ARPS_DEFAULTS = {
  Di: 0.025,
  b: 0.5,
};
