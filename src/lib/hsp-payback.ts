/**
 * HSP (SPT) re-completion payback scenarios.
 * Cost and inflow figures come from the Maxxwell Production price list
 * (slides 44–49, 2011–2016, "by minimum"). They are indicative, not quotes.
 */
export type WellKind = "oil" | "injector";
export type AddOn = "cement" | "acid" | "pulse" | "frac";

export const BASE_COST: Record<WellKind, { purchase: number; noPurchase: number }> = {
  oil: { purchase: 207_975, noPurchase: 142_475 },
  injector: { purchase: 180_602, noPurchase: 136_102 },
};
export const ADDON_COST: Record<AddOn, number> = { cement: 11_250, acid: 3_570, pulse: 20_730, frac: 40_095 };
export const ADDON_LABEL: Record<AddOn, string> = {
  cement: "Repair of cement sheath",
  acid: "Acid chemical treatment",
  pulse: "Pulsed hydraulic shocks",
  frac: "Subsequent hydraulic fracturing",
};

/** Midpoints of the "minimum" before/after ranges, bbl/day. */
export function defaultRates(kind: WellKind, addOns: AddOn[]): { before: number; after: number } {
  if (kind === "injector") return { before: 0.5, after: 7.5 };
  let after = 35; // HSP 30–40
  if (addOns.includes("acid")) after = 42.5;
  if (addOns.includes("pulse")) after = 55;
  if (addOns.includes("frac")) after = 77.5;
  return { before: 7.5, after };
}

export interface PaybackInput {
  kind: WellKind; purchase: boolean; wells: number; addOns: AddOn[];
  beforeBpd: number; afterBpd: number; oilPrice: number;
  royaltyPct: number; opexPerBbl: number; annualDeclinePct: number;
}

export interface PaybackResult {
  capex: number; costPerWell: number; paybackMonths: number | null;
  horizons: { years: number; incrementalBbl: number; netCash: number; profit: number }[];
  monthly: { month: number; cumulative: number }[];
}

export function computePayback(i: PaybackInput): PaybackResult {
  const costPerWell = (i.purchase ? BASE_COST[i.kind].purchase : BASE_COST[i.kind].noPurchase)
    + i.addOns.reduce((s, a) => s + ADDON_COST[a], 0);
  const capex = costPerWell * i.wells;
  const dq = Math.max(i.afterBpd - i.beforeBpd, 0);
  const dMonthly = -Math.log(1 - Math.min(i.annualDeclinePct, 99) / 100) / 12;
  const netPerBbl = i.oilPrice * (1 - i.royaltyPct / 100) - i.opexPerBbl;
  let cum = -capex, bbl = 0, payback: number | null = null;
  const monthly: PaybackResult["monthly"] = [{ month: 0, cumulative: cum }];
  const horizons: PaybackResult["horizons"] = [];
  for (let m = 1; m <= 180; m++) {
    const q = dq * Math.exp(-dMonthly * (m - 0.5)) * 30.4 * i.wells;
    bbl += q; cum += q * netPerBbl;
    if (payback == null && cum >= 0) payback = m;
    monthly.push({ month: m, cumulative: Math.round(cum) });
    if ([12, 60, 120, 180].includes(m)) horizons.push({ years: m / 12, incrementalBbl: bbl, netCash: cum + capex, profit: cum });
  }
  return { capex, costPerWell, paybackMonths: payback, horizons, monthly };
}
