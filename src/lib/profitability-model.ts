/**
 * SGOM + Maxxwell Production — combined profitability model.
 *
 * Two cases:
 *  - "upside"  : the original workbook logic (flat 30 bbl/d, no royalty/severance,
 *                tax on EBITDA, no churn, no D&A).
 *  - "base"    : corrected logic — Arps exponential decline, royalty + severance,
 *                SaaS churn, straight-line D&A, tax on EBT with NOL carry-forward.
 *
 * Source of assumptions: SGOM_Maxwell_Combined_Profitability_Model.xlsx (Assumptions sheet).
 */

export type ModelInputs = {
  years: number[];
  /** SaaS */
  clients: number[];          // cumulative commercial clients
  acv: number[];              // average annual contract value, $
  saasCogsPct: number[];      // share of SaaS revenue
  churn: number;              // annual logo churn, 0..1 (base case only)
  /** SPT production */
  wells: number[];            // cumulative wells in production
  bblPerDay: number;          // initial rate per well
  oilPrice: number;           // $/bbl
  daysPerYear: number;
  opexPct: number;            // well maintenance/opex, share of gross oil revenue
  declineDi: number;          // Arps nominal annual decline (base case only)
  royaltyPct: number;         // base case only
  severancePct: number;       // state severance / production tax, base case only
  /** OpEx */
  headcount: number[];
  salary: number[];
  ga: number[];
  sales: number[];
  mvpBuild: number[];
  /** Capex & other */
  sptCapexPerWell: number;
  platformCapex: number[];
  daYears: number;            // straight-line depreciation life (base case)
  taxRate: number[];
  raise: number[];
  nwcPct: number;             // NWC as % of revenue growth
};

export type YearRow = {
  year: number;
  saasRevenue: number;
  oilRevenueGross: number;
  royalty: number;
  severance: number;
  oilRevenueNet: number;
  revenue: number;
  saasCogs: number;
  wellOpex: number;
  grossProfit: number;
  payroll: number;
  ga: number;
  sales: number;
  mvp: number;
  opexTotal: number;
  ebitda: number;
  da: number;
  ebt: number;
  tax: number;
  netIncome: number;
  capex: number;
  nwcChange: number;
  freeCashFlow: number;
  cashEnd: number;
  wellsProducing: number;
  avgRatePerWell: number;
  payingClients: number;
};

export const DEFAULT_INPUTS: ModelInputs = {
  years: [2026, 2027, 2028, 2029, 2030],
  clients: [1, 3, 8, 15, 25],
  acv: [50000, 150000, 200000, 250000, 300000],
  saasCogsPct: [0.35, 0.3, 0.25, 0.22, 0.2],
  churn: 0.15,
  wells: [4, 8, 13, 19, 25],
  bblPerDay: 30,
  oilPrice: 68.47,
  daysPerYear: 365,
  opexPct: 0.3,
  declineDi: 0.12,
  royaltyPct: 0.1875,
  severancePct: 0.07,
  headcount: [4, 6, 10, 15, 20],
  salary: [140000, 145000, 150000, 155000, 160000],
  ga: [60000, 80000, 120000, 160000, 200000],
  sales: [30000, 60000, 150000, 300000, 450000],
  mvpBuild: [118000, 0, 0, 0, 0],
  sptCapexPerWell: 289460,
  platformCapex: [2000000, 0, 0, 0, 0],
  daYears: 7,
  taxRate: [0, 0, 0.21, 0.21, 0.21],
  raise: [4000000, 0, 0, 0, 0],
  nwcPct: 0.1,
};

export type CaseKey = "upside" | "base";

export function runModel(inp: ModelInputs, mode: CaseKey): YearRow[] {
  const n = inp.years.length;
  const rows: YearRow[] = [];

  const decline = mode === "base" ? inp.declineDi : 0;
  const royaltyPct = mode === "base" ? inp.royaltyPct : 0;
  const severancePct = mode === "base" ? inp.severancePct : 0;
  const churn = mode === "base" ? inp.churn : 0;

  // Well vintages: how many wells came online in each year
  const additions = inp.wells.map((w, i) => Math.max(0, w - (i ? inp.wells[i - 1] : 0)));

  // SaaS logo retention (base case): retained = prior * (1 - churn) + new logos
  const newLogos = inp.clients.map((c, i) => Math.max(0, c - (i ? inp.clients[i - 1] : 0)));

  let payingPrev = 0;
  let cash = 0;
  let prevRevenue = 0;
  let nolPool = 0;
  const daSchedule = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    // ── SaaS ───────────────────────────────────────────────────────────────
    const paying = mode === "base"
      ? payingPrev * (1 - churn) + newLogos[i]
      : inp.clients[i];
    payingPrev = paying;
    const saasRevenue = paying * inp.acv[i];
    const saasCogs = saasRevenue * inp.saasCogsPct[i];

    // ── Oil (Arps exponential decline per vintage, half-year convention) ───
    let bblYear = 0;
    for (let v = 0; v <= i; v++) {
      const age = i - v + 0.5;                       // years since first oil
      const rate = inp.bblPerDay * Math.exp(-decline * age);
      const onlineFraction = v === i ? 0.5 : 1;      // new wells produce half a year
      bblYear += additions[v] * rate * inp.daysPerYear * onlineFraction;
    }
    const oilRevenueGross = bblYear * inp.oilPrice;
    const royalty = oilRevenueGross * royaltyPct;
    const severance = (oilRevenueGross - royalty) * severancePct;
    const oilRevenueNet = oilRevenueGross - royalty - severance;
    const wellOpex = oilRevenueGross * inp.opexPct;

    const revenue = saasRevenue + oilRevenueNet;
    const grossProfit = revenue - saasCogs - wellOpex;

    // ── OpEx ───────────────────────────────────────────────────────────────
    const payroll = inp.headcount[i] * inp.salary[i];
    const opexTotal = payroll + inp.ga[i] + inp.sales[i] + inp.mvpBuild[i];
    const ebitda = grossProfit - opexTotal;

    // ── Capex & D&A ────────────────────────────────────────────────────────
    const capex = additions[i] * inp.sptCapexPerWell + inp.platformCapex[i];
    if (mode === "base") {
      const life = Math.max(1, Math.round(inp.daYears));
      const annual = capex / life;
      for (let k = i; k < Math.min(n, i + life); k++) daSchedule[k] += annual;
    }
    const da = daSchedule[i];

    // ── Taxes ──────────────────────────────────────────────────────────────
    const ebt = mode === "base" ? ebitda - da : ebitda;
    let tax = 0;
    if (mode === "base") {
      const taxable = Math.max(0, ebt - nolPool);
      nolPool = ebt < 0 ? nolPool - ebt : Math.max(0, nolPool - ebt);
      tax = taxable * inp.taxRate[i];
    } else {
      tax = ebt > 0 ? ebt * inp.taxRate[i] : 0;
    }
    const netIncome = ebt - tax;

    // ── Cash ───────────────────────────────────────────────────────────────
    const nwcChange = Math.max(0, revenue - prevRevenue) * inp.nwcPct;
    prevRevenue = revenue;
    const freeCashFlow = netIncome + da - capex - nwcChange;
    cash += freeCashFlow + inp.raise[i];

    const wellsProducing = inp.wells[i];
    rows.push({
      year: inp.years[i],
      saasRevenue, oilRevenueGross, royalty, severance, oilRevenueNet, revenue,
      saasCogs, wellOpex, grossProfit,
      payroll, ga: inp.ga[i], sales: inp.sales[i], mvp: inp.mvpBuild[i], opexTotal,
      ebitda, da, ebt, tax, netIncome,
      capex, nwcChange, freeCashFlow, cashEnd: cash,
      wellsProducing,
      avgRatePerWell: wellsProducing ? bblYear / inp.daysPerYear / wellsProducing : 0,
      payingClients: paying,
    });
  }
  return rows;
}

export function fmtUsd(v: number, digits = 1): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

export function fmtFullUsd(v: number): string {
  const sign = v < 0 ? "(" : "";
  const end = v < 0 ? ")" : "";
  return `${sign}$${Math.round(Math.abs(v)).toLocaleString("en-US")}${end}`;
}
