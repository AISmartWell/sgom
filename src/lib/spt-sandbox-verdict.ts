// Mirror of sptScreening() in supabase/functions/upstrima-sandbox/index.ts.
// Keep both in sync so the SGOM UI shows exactly what the sandbox API returns.
export type SptVerdict = "candidate" | "conditional" | "not_recommended";

export interface WellLike {
  total_depth?: number | null;
  well_type?: string | null;
  water_cut?: number | null;
  production_oil?: number | null;
  production_gas?: number | null;
}

export function sptScreening(well: WellLike) {
  const depth = Number(well.total_depth) || 0;
  const fluid = String(well.well_type || "").toLowerCase().includes("gas") ? "gas" : "oil";
  const libraryDepthFt = 5400;
  const swCutoff = 60;
  const factorsFor: string[] = [];
  const risks: string[] = [];
  const missing: string[] = [];
  if (depth > 0 && depth <= libraryDepthFt) factorsFor.push(`Depth ${depth} ft is within the SPT case library (<= ${libraryDepthFt} ft)`);
  if (depth > libraryDepthFt) risks.push(`Depth ${depth} ft is outside the SPT case library (~${libraryDepthFt} ft) — extrapolation`);
  if (fluid === "gas") factorsFor.push("Gas well — low-permeability cutoff relaxed to 0.1 mD");
  const wc = well.water_cut == null ? null : Number(well.water_cut);
  if (wc != null && wc >= swCutoff) risks.push(`Water cut ${wc}% >= ${swCutoff}% threshold`);
  if (wc == null) missing.push("water_cut");
  if (well.production_oil == null && well.production_gas == null) missing.push("production rates");
  let verdict: SptVerdict = "candidate";
  if (depth > libraryDepthFt) verdict = "conditional";
  if (risks.length >= 2) verdict = "conditional";
  // Disqualifying: water cut at or above the cutoff (water already breaks through the pay).
  if (wc != null && wc >= swCutoff) verdict = "not_recommended";
  const confidence = missing.length === 0 ? "medium" : "low";
  return { verdict, confidence, fluid, factors_for: factorsFor, risks, missing_data: missing };
}

export const wellVerdictLabel = (v: SptVerdict) =>
  v === "candidate" ? "SPT candidate" : v === "conditional" ? "Conditional SPT candidate" : "Not recommended";
