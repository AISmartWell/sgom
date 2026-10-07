/**
 * SPT suitability screening based on Maxxwell Production's documented operational
 * criteria ("In which wells can slotting perforation be used", HSP presentation p.20).
 * Presentational guidance only — PRELIMINARY. It does NOT change sptScreening()
 * verdict logic, which stays mirrored with the Upstrima sandbox API.
 */

export type SuitState = "met" | "not_met" | "caution" | "unknown";

export interface SuitabilityCheck {
  id: string;
  label: string;
  detail: string;
  state: SuitState;
}

export interface SuitabilityInput {
  completion_date?: string | null;
  spud_date?: string | null;
  water_cut?: number | null;
  status?: string | null;
  well_type?: string | null;
  total_depth?: number | null;
}

export interface SuitabilityResult {
  checks: SuitabilityCheck[];
  label: string;
  labelTone: "success" | "warning" | "destructive" | "muted";
  declineCauses: { cause: string; evidence: string }[];
}

const yearsSince = (date?: string | null) => {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (365.25 * 24 * 3600 * 1000);
};

export function sptSuitability(well: SuitabilityInput, latestRateBblDay?: number | null): SuitabilityResult {
  const years = yearsSince(well.completion_date ?? well.spud_date);
  const wc = well.water_cut == null ? null : Number(well.water_cut);
  const rate = latestRateBblDay == null ? null : Number(latestRateBblDay);
  const status = (well.status ?? "").toLowerCase();

  const checks: SuitabilityCheck[] = [
    {
      id: "operation_period",
      label: "Operation period ≤ 10–15 years",
      detail: years == null
        ? "Completion/spud date is not in the well record — data gap."
        : years <= 15
          ? `Completed ≈ ${years.toFixed(0)} years ago — within Maxxwell's documented preference.`
          : `Completed ≈ ${years.toFixed(0)} years ago — beyond the 10–15-year preference; screen cement and casing before treatment.`,
      state: years == null ? "unknown" : years <= 15 ? "met" : "caution",
    },
    {
      id: "no_water_problems",
      label: "No water problems during operation",
      detail: wc == null
        ? "Water cut is not in the well record — data gap."
        : wc < 60
          ? `Water cut ${wc.toFixed(0)}% — below the flooding threshold.`
          : `Water cut ${wc.toFixed(0)}% — flooded pay. Maxxwell: no method helps once water breaks through.`,
      state: wc == null ? "unknown" : wc < 60 ? "met" : "not_met",
    },
    {
      id: "opening_method",
      label: "Opened via gun / cumulative perforation",
      detail: "Perforation method is not captured in the well record — confirm from completion documents (data gap).",
      state: "unknown",
    },
    {
      id: "reservoirs",
      label: "1–2 productive reservoirs",
      detail: "Number of productive reservoirs is not derived automatically — confirm from geology (data gap).",
      state: "unknown",
    },
    {
      id: "current_inflow",
      label: "Current inflow 0–2 bbl/d",
      detail: rate == null
        ? "Latest production rate is not available — data gap."
        : rate <= 2
          ? `Latest rate ≈ ${rate.toFixed(1)} bbl/d — within Maxxwell's preferred range.`
          : rate <= 20
            ? `Latest rate ≈ ${rate.toFixed(1)} bbl/d — above the preferred range; SPT still applies but adds proportionally less.`
            : `Latest rate ≈ ${rate.toFixed(0)} bbl/d — high-rate well. Maxxwell: no method doubles a strong producer.`,
      state: rate == null ? "unknown" : rate <= 2 ? "met" : "caution",
    },
    {
      id: "well_status",
      label: "Idle / abandoned wells acceptable",
      detail: /idle|aban|plugg|shut/.test(status)
        ? `Status "${well.status}" — idle or abandoned wells are explicitly preferred by the Maxxwell criteria.`
        : `Status "${well.status || "unknown"}" — neutral; not part of the documented preference list.`,
      state: /idle|aban|plugg|shut/.test(status) ? "met" : "unknown",
    },
  ];

  let label: string;
  let labelTone: SuitabilityResult["labelTone"];
  if (checks.some((c) => c.state === "not_met")) {
    label = "Not suitable per Maxxwell criteria";
    labelTone = "destructive";
  } else if (checks.every((c) => c.state === "unknown")) {
    label = "Insufficient data";
    labelTone = "muted";
  } else if (checks.some((c) => c.state === "caution")) {
    label = "Acceptable with caution";
    labelTone = "warning";
  } else {
    label = "Preferred per Maxxwell criteria";
    labelTone = "success";
  }

  const declineCauses: { cause: string; evidence: string }[] = [];
  if (wc != null && wc >= 30) declineCauses.push({ cause: "Flooding of the producing layer", evidence: `Water cut ${wc.toFixed(0)}%` });
  if (years != null && years > 15) declineCauses.push({ cause: "Colmatation / near-wellbore damage typical for long-operated wells", evidence: `≈ ${years.toFixed(0)} years of operation` });
  if (rate != null && rate <= 2) declineCauses.push({ cause: "Poor hydrodynamic connection with the producing layer — the classic SPT target", evidence: `Latest rate ≈ ${rate.toFixed(1)} bbl/d` });

  return { checks, label, labelTone, declineCauses };
}

/** Maxxwell's full decline-cause checklist (HSP presentation, p.20) — shown as guidance. */
export const MAXXWELL_DECLINE_CAUSES = [
  "Oil or gas is over",
  "Falls in reservoir pressure",
  "Flooding of the producing layer",
  "Chemical damage of the productive formation",
  "Incorrect grid drilling",
  "Incorrect development or exploitation",
  "Colmatation",
  "Poor hydrodynamic connection of the well with the producing layer",
  "Low temperature, high viscosity",
] as const;
