/**
 * SPT-oriented end-to-end demo pipeline.
 * Stage 2 (ingest) -> Stage 8 (petrophysics) -> Stage 4 (forecast)
 * -> Stage 6 (SPT Advisor) -> Stage 7 (economics)
 *
 * Deterministic: no Math.random anywhere.
 */
import { calcTimurPermeability, classifyPermeability } from "@/lib/petrophysics";
import {
  DEFAULT_OIL_PRICE,
  DEFAULT_OPEX_PER_BBL,
  DEFAULT_TREATMENT_COST,
  sptGainByWaterCut,
  arpsRate,
  calcNPV,
  calcFiveYearROI,
  ARPS_DEFAULTS,
} from "@/lib/economics-config";

/* ── Ingest ─────────────────────────────────────────────── */

export interface ProductionPoint {
  month: string;      // label, e.g. "2023-04"
  oil: number;        // bbl/d
  water: number;      // bbl/d
  gas?: number;       // mcf/d
}

export interface WellInput {
  name: string;
  api?: string;
  formation?: string;
  depthFt: number;
  netPayFt: number;
  porosity: number;   // fraction
  swirr: number;      // fraction
  reservoirPressurePsi: number;
  history: ProductionPoint[];
}

export interface IngestReport {
  rows: number;
  months: number;
  source: "csv" | "sample";
  warnings: string[];
  quality: number;    // 0-100 data completeness
}

const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^0-9.\-eE]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Parse a simple CSV: date/month, oil, water[, gas] — header names are fuzzy-matched. */
export function parseProductionCsv(text: string): { points: ProductionPoint[]; warnings: string[] } {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { points: [], warnings: ["File contains no data rows"] };

  const delim = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const header = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  const idx = (...keys: string[]) =>
    header.findIndex((h) => keys.some((k) => h.includes(k)));

  const iDate = idx("date", "month", "period");
  const iOil = idx("oil", "bopd", "liquid");
  const iWater = idx("water", "bwpd");
  const iGas = idx("gas", "mcf");

  if (iOil < 0) warnings.push("No oil column detected — first numeric column used");
  if (iWater < 0) warnings.push("No water column detected — water cut assumed from oil trend");

  const points: ProductionPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(delim);
    if (c.length < 2) continue;
    const oil = num(c[iOil >= 0 ? iOil : 1]);
    const water = iWater >= 0 ? num(c[iWater]) : oil * 1.4;
    points.push({
      month: iDate >= 0 ? String(c[iDate]).trim() : `M${i}`,
      oil,
      water,
      gas: iGas >= 0 ? num(c[iGas]) : undefined,
    });
  }
  if (points.length < 6) warnings.push("Fewer than 6 months of history — forecast confidence reduced");
  return { points, warnings };
}

export function buildIngestReport(input: WellInput, source: "csv" | "sample"): IngestReport {
  const warnings: string[] = [];
  if (!input.formation) warnings.push("Formation not specified — attribution falls back to depth lookup");
  if (input.history.length < 12) warnings.push("Short production history (<12 months)");
  const fields = [
    input.depthFt > 0, input.netPayFt > 0, input.porosity > 0, input.swirr > 0,
    input.reservoirPressurePsi > 0, input.history.length > 0, !!input.formation, !!input.api,
  ];
  const quality = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  return { rows: input.history.length, months: input.history.length, source, warnings, quality };
}

/* ── Petrophysics ───────────────────────────────────────── */

export interface PetroResult {
  permMd: number;
  permClass: string;
  netPayFt: number;
  porosityPct: number;
  swirrPct: number;
  mobilityIndex: number;   // 0-1
  skinProxy: number;       // estimated near-wellbore damage
}

export function runPetrophysics(w: WellInput, latestWaterCut: number): PetroResult {
  const k = calcTimurPermeability(w.porosity, w.swirr);
  const permClass = classifyPermeability(k) ?? "tight";
  // Mobility: high k and moderate water cut => better inflow potential
  const kScore = Math.min(1, Math.log10(Math.max(k, 0.01) * 100 + 1) / 3);
  const wcPenalty = Math.max(0, Math.min(1, (latestWaterCut - 40) / 60));
  const mobilityIndex = Math.max(0, Math.min(1, kScore * (1 - 0.5 * wcPenalty)));
  // Skin proxy: legacy wells with low current rate vs k potential => damaged
  const skinProxy = Math.round((6 - kScore * 6 + wcPenalty * 3) * 10) / 10;
  return {
    permMd: k,
    permClass,
    netPayFt: w.netPayFt,
    porosityPct: w.porosity * 100,
    swirrPct: w.swirr * 100,
    mobilityIndex,
    skinProxy,
  };
}

/* ── Forecast (Arps) ────────────────────────────────────── */

export interface ForecastPoint {
  t: number;
  label: string;
  history: number | null;
  base: number | null;
  spt: number | null;
}

export interface ForecastResult {
  qi: number;
  Di: number;
  b: number;
  latestOil: number;
  latestWaterCut: number;
  baseCum5y: number;      // bbl
  economicLimitMonth: number;
  points: ForecastPoint[];
}

/** Fit a monthly Arps decline (b fixed at 0.5) on log-rate least squares. */
export function fitArps(history: ProductionPoint[]): { qi: number; Di: number; b: number } {
  const b = ARPS_DEFAULTS.b;
  const pts = history.filter((p) => p.oil > 0);
  if (pts.length < 3) {
    const q = pts.length ? pts[pts.length - 1].oil : 10;
    return { qi: q, Di: ARPS_DEFAULTS.Di, b };
  }
  // Linearize: q^-b = qi^-b (1 + b Di t)  =>  y = a + c t
  const ys = pts.map((p) => Math.pow(p.oil, -b));
  const n = pts.length;
  const meanX = (n - 1) / 2;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0;
  ys.forEach((y, i) => {
    sxy += (i - meanX) * (y - meanY);
    sxx += (i - meanX) ** 2;
  });
  const c = sxx > 0 ? sxy / sxx : 0;
  const a = meanY - c * meanX;
  const qiRaw = a > 0 ? Math.pow(a, -1 / b) : pts[0].oil;
  const DiRaw = a > 0 ? c / (a * b) : ARPS_DEFAULTS.Di;
  const qi = Math.max(0.5, Math.min(qiRaw, pts[0].oil * 2));
  const Di = Math.max(0.003, Math.min(0.12, DiRaw));
  return { qi, Di, b };
}

export function runForecast(
  w: WellInput,
  upliftBpd: number,
  economicLimitBpd: number,
  months = 60,
): ForecastResult {
  const { qi, Di, b } = fitArps(w.history);
  const hist = w.history;
  const last = hist[hist.length - 1] ?? { oil: qi, water: 0, month: "M0" };
  const latestOil = last.oil;
  const totalLiquid = last.oil + last.water;
  const latestWaterCut = totalLiquid > 0 ? (last.water / totalLiquid) * 100 : 0;

  const points: ForecastPoint[] = hist.map((p, i) => ({
    t: i - hist.length + 1,
    label: p.month,
    history: p.oil,
    base: null,
    spt: null,
  }));
  if (points.length) {
    points[points.length - 1].base = latestOil;
    points[points.length - 1].spt = latestOil;
  }

  let baseCum5y = 0;
  let economicLimitMonth = months;
  for (let m = 1; m <= months; m++) {
    const base = arpsRate(latestOil, Di, b, m);
    const spt = base + arpsRate(upliftBpd, Di, b, m);
    baseCum5y += base * 30.44;
    if (base < economicLimitBpd && economicLimitMonth === months) economicLimitMonth = m;
    points.push({ t: m, label: `+${m}m`, history: null, base, spt });
  }

  return { qi, Di, b, latestOil, latestWaterCut, baseCum5y, economicLimitMonth, points };
}

/* ── SPT Advisor (MCDA) ─────────────────────────────────── */

export interface Criterion {
  key: string;
  label: string;
  weight: number;
  raw: string;
  score: number;   // 0-100 normalized (higher = better SPT candidate)
  note: string;
}

export interface AdvisorResult {
  score: number;               // 0-100 Restoration Potential Score
  verdict: "Recommended" | "Conditional" | "Not recommended";
  confidence: number;          // 0-100
  criteria: Criterion[];
  rationale: string[];
  risks: string[];
  upliftBpd: number;
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function runAdvisor(
  w: WellInput,
  petro: PetroResult,
  fc: { latestOil: number; latestWaterCut: number },
  dataQuality: number,
): AdvisorResult {
  const wc = fc.latestWaterCut;
  const kScore = clamp((Math.log10(Math.max(petro.permMd, 0.01)) + 2) * 28);
  const wcScore = clamp(100 - wc);                        // inverted: low water cut is better
  const payScore = clamp((w.netPayFt / 40) * 100);
  const presScore = clamp(((w.reservoirPressurePsi - 300) / 2200) * 100);
  const skinScore = clamp(petro.skinProxy * 14);          // damaged well = better SPT upside
  const rateScore = clamp(100 - Math.abs(fc.latestOil - 12) * 5);

  const criteria: Criterion[] = [
    { key: "k", label: "Permeability (Timur)", weight: 0.20, raw: `${petro.permMd.toFixed(2)} mD`, score: kScore, note: "Slot channels need matrix flow capacity" },
    { key: "wc", label: "Water cut (inverted)", weight: 0.20, raw: `${wc.toFixed(1)} %`, score: wcScore, note: "High water cut lowers net oil uplift" },
    { key: "pay", label: "Net pay thickness", weight: 0.15, raw: `${w.netPayFt.toFixed(0)} ft`, score: payScore, note: "Slot length limited to ~1.5 ft per slot" },
    { key: "p", label: "Reservoir pressure", weight: 0.15, raw: `${w.reservoirPressurePsi.toFixed(0)} psi`, score: presScore, note: "Drive energy for post-treatment inflow" },
    { key: "skin", label: "Near-wellbore damage", weight: 0.20, raw: `skin ≈ ${petro.skinProxy}`, score: skinScore, note: "SPT bypasses perforation/compaction damage" },
    { key: "q", label: "Current oil rate fit", weight: 0.10, raw: `${fc.latestOil.toFixed(1)} bbl/d`, score: rateScore, note: "Marginal producers gain most in relative terms" },
  ];

  const score = Math.round(criteria.reduce((s, c) => s + c.weight * c.score, 0));
  const verdict = score >= 65 ? "Recommended" : score >= 45 ? "Conditional" : "Not recommended";
  const confidence = Math.round(0.6 * dataQuality + 0.4 * Math.min(100, w.history.length * 5));

  const baseGain = sptGainByWaterCut(wc);
  const upliftBpd = Math.round(baseGain * (0.6 + (score / 100) * 0.9) * 10) / 10;

  const rationale: string[] = [
    `Restoration Potential Score ${score}/100 (MCDA over 6 weighted criteria).`,
    `Timur permeability ${petro.permMd.toFixed(2)} mD (${petro.permClass}) supports ${petro.permClass === "tight" ? "limited" : "sustained"} inflow through slot channels.`,
    `Estimated near-wellbore skin ≈ ${petro.skinProxy}: SPT (US 8,863,823) cuts 1–1.5 ft slots past the damaged zone instead of re-perforating.`,
    `Water cut ${wc.toFixed(1)}% places the well in the ${baseGain} bbl/d benchmark bracket; score-adjusted uplift ${upliftBpd} bbl/d.`,
  ];

  const risks: string[] = [];
  if (wc > 70) risks.push("Water cut >70% — uplift may be mostly water; consider selective slotting.");
  if (petro.permMd < 1) risks.push("Sub-millidarcy matrix — verify with core or DST before treatment.");
  if (w.reservoirPressurePsi < 600) risks.push("Low reservoir pressure — artificial lift review required.");
  if (w.history.length < 12) risks.push("Short history — decline fit uncertainty is high.");
  if (!risks.length) risks.push("No blocking risks identified from the supplied dataset.");

  return { score, verdict, confidence, criteria, rationale, risks, upliftBpd };
}

/* ── Economics ──────────────────────────────────────────── */

export interface EconomicsInput {
  oilPrice: number;
  opexPerBbl: number;
  treatmentCost: number;
  discountRate: number;
}

export interface EconomicsResult {
  incrementalBbl5y: number;
  grossRevenue: number;
  netProfit5y: number;
  npv: number;
  roi: number;
  paybackMonths: number;
  breakevenPrice: number;
  cashflow: { m: number; cum: number }[];
}

export const DEFAULT_ECONOMICS: EconomicsInput = {
  oilPrice: DEFAULT_OIL_PRICE,
  opexPerBbl: DEFAULT_OPEX_PER_BBL,
  treatmentCost: DEFAULT_TREATMENT_COST,
  discountRate: 0.10,
};

export function runEconomics(upliftBpd: number, e: EconomicsInput): EconomicsResult {
  const { Di, b } = ARPS_DEFAULTS;
  let incrementalBbl5y = 0;
  const cashflow: { m: number; cum: number }[] = [{ m: 0, cum: -e.treatmentCost }];
  let cum = -e.treatmentCost;
  for (let m = 1; m <= 60; m++) {
    const bbl = arpsRate(upliftBpd, Di, b, m) * 30.44;
    incrementalBbl5y += bbl;
    cum += bbl * (e.oilPrice - e.opexPerBbl);
    cashflow.push({ m, cum });
  }
  const npv = calcNPV(upliftBpd, e.oilPrice, e.opexPerBbl, e.treatmentCost, e.discountRate);
  const { roi, fiveYearNet, paybackMonths } = calcFiveYearROI(
    upliftBpd, e.oilPrice, e.opexPerBbl, e.treatmentCost,
  );
  const breakevenPrice = incrementalBbl5y > 0
    ? e.opexPerBbl + e.treatmentCost / incrementalBbl5y
    : 0;
  return {
    incrementalBbl5y,
    grossRevenue: incrementalBbl5y * e.oilPrice,
    netProfit5y: fiveYearNet - e.treatmentCost,
    npv,
    roi,
    paybackMonths,
    breakevenPrice,
    cashflow,
  };
}

/* ── Sample dataset (deterministic) ─────────────────────── */

export const SAMPLE_WELL: WellInput = {
  name: "Brawner 10-15",
  api: "15-125-21034",
  formation: "Mississippian Chat",
  depthFt: 3980,
  netPayFt: 22,
  porosity: 0.17,
  swirr: 0.28,
  reservoirPressurePsi: 1240,
  history: [
    { month: "2024-01", oil: 21.4, water: 34.0 },
    { month: "2024-02", oil: 20.1, water: 34.8 },
    { month: "2024-03", oil: 19.2, water: 35.6 },
    { month: "2024-04", oil: 18.3, water: 36.9 },
    { month: "2024-05", oil: 17.6, water: 37.4 },
    { month: "2024-06", oil: 16.8, water: 38.2 },
    { month: "2024-07", oil: 16.2, water: 39.0 },
    { month: "2024-08", oil: 15.5, water: 39.8 },
    { month: "2024-09", oil: 15.0, water: 40.4 },
    { month: "2024-10", oil: 14.4, water: 41.1 },
    { month: "2024-11", oil: 13.9, water: 41.7 },
    { month: "2024-12", oil: 13.5, water: 42.2 },
    { month: "2025-01", oil: 13.0, water: 42.8 },
    { month: "2025-02", oil: 12.7, water: 43.3 },
    { month: "2025-03", oil: 12.3, water: 43.9 },
    { month: "2025-04", oil: 12.0, water: 44.4 },
    { month: "2025-05", oil: 11.7, water: 44.9 },
    { month: "2025-06", oil: 11.4, water: 45.3 },
  ],
};

export const SAMPLE_CSV = [
  "date,oil_bbl_d,water_bbl_d",
  ...SAMPLE_WELL.history.map((p) => `${p.month},${p.oil},${p.water}`),
].join("\n");
