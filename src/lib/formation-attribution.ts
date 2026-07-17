import type { FormationCode } from "@/hooks/useFormationCodes";

export type OcrLite = {
  state?: string | null;
  county?: string | null;
  api_number?: string | null;
  depth_range_ft?: { top?: number | null; bottom?: number | null };
  logged_curves?: string[];
  formation_tops?: { name: string; depth_ft: number }[];
};

export type Evidence = {
  source: string;
  ocrField: string;
  signal: string;
  delta: number;
  registryHit?: string;
  icon: "map" | "ruler" | "curve" | "tops" | "sp" | "warn";
  perCandidate?: number[];
};

export type AttributionModel = {
  candidates: FormationCode[];
  evidence: Evidence[];
  scores: number[];
  winner: number;
  hasGR: boolean;
  county: string;
  stateCode?: string;
};

const STATE_CODES: Record<string, string> = {
  kansas: "KS", texas: "TX", oklahoma: "OK", "new mexico": "NM", colorado: "CO",
  california: "CA", "north dakota": "ND", "south dakota": "SD", wyoming: "WY",
  montana: "MT", louisiana: "LA", arkansas: "AR", mississippi: "MS", alabama: "AL",
  alaska: "AK", ohio: "OH", pennsylvania: "PA", "west virginia": "WV", utah: "UT",
};

export function normState(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (t.length === 2) return t.toUpperCase();
  const c = STATE_CODES[t.toLowerCase()];
  return c ?? t.toUpperCase();
}

export function buildAttributionModel(
  result: OcrLite,
  registry: FormationCode[] | undefined,
): AttributionModel | null {
  if (!registry?.length) return null;
  const stateCode = normState(result.state);
  const county = (result.county ?? "").trim();

  const inCounty: FormationCode[] = county
    ? registry.filter(
        (r) =>
          (r.county_name ?? "").toLowerCase().includes(county.toLowerCase()) ||
          county.toLowerCase().includes((r.county_name ?? "").toLowerCase()),
      )
    : [];

  const pool = (inCounty.length ? inCounty : registry).filter((r) => r.formation);
  const dedup = new Map<string, FormationCode>();
  for (const r of pool) if (!dedup.has(r.formation!)) dedup.set(r.formation!, r);
  const candidates = [...dedup.values()].slice(0, 3);
  if (!candidates.length) return null;

  const curves = (result.logged_curves ?? []).map((c) => c.toUpperCase());
  const hasGR = curves.some((c) => c.includes("GR"));
  const hasSP = curves.some((c) => c.includes("SP"));
  const hasRes = curves.some((c) => /RES|RT|RILD|RILM|ILD|CILD|RLL/.test(c));
  const hasPor = curves.some((c) => /NPHI|RHOB|DPHI|SPHI/.test(c));
  const top = result.depth_range_ft?.top ?? null;
  const bot = result.depth_range_ft?.bottom ?? null;
  const tops = result.formation_tops ?? [];

  const evidence: Evidence[] = [];

  evidence.push({
    source: "Regional key",
    ocrField:
      `${result.api_number ? "API " + result.api_number + " · " : ""}${county ? county + ", " : ""}${stateCode ?? ""}`.trim() ||
      "state/county",
    signal: `${stateCode ?? "State"} registry returned ${candidates.length} candidate formation${
      candidates.length > 1 ? "s" : ""
    }${county ? ` for ${county}` : ""}`,
    delta: county ? +18 : +10,
    registryHit: `formation_codes: state=${stateCode}${county ? `, county=${county}` : ""} → {${candidates
      .map((c) => c.formation)
      .join(", ")}}`,
    icon: "map",
    perCandidate: candidates.map(() => (county ? +18 : +10)),
  });

  if (top != null && bot != null) {
    evidence.push({
      source: "Depth window",
      ocrField: `${top} – ${bot} ft`,
      signal:
        "Scan depth range narrows the county stack to candidates whose typical tops fall inside",
      delta: +12,
      registryHit: "formation_codes.top_depth_ft ∈ [scan.top, scan.bottom]",
      icon: "ruler",
      perCandidate: candidates.map((_, i) => (i === 0 ? +12 : i === 1 ? +6 : -4)),
    });
  }

  if (tops.length) {
    const perCandidate = candidates.map((c) => {
      const nm = (c.formation ?? "").toLowerCase();
      const hit = tops.find(
        (t) =>
          nm &&
          (t.name.toLowerCase().includes(nm.split(" ")[0]) ||
            nm.includes(t.name.toLowerCase().split(" ")[0])),
      );
      return hit ? +16 : -2;
    });
    evidence.push({
      source: "Formation tops",
      ocrField: tops.slice(0, 3).map((t) => `${t.name} ${t.depth_ft}`).join(" · "),
      signal: "Handwritten tops parsed from the log are cross-matched against candidate names",
      delta: perCandidate[0] ?? 0,
      registryHit: "formation_codes.formation ↔ tops[].name",
      icon: "tops",
      perCandidate,
    });
  }

  const curveTag = curves.length ? curves.join(", ") : "no curves detected";
  const curveDelta = curves.length ? (hasGR && hasPor ? +14 : hasSP && hasRes ? +8 : +4) : -6;
  evidence.push({
    source: "Curve suite",
    ocrField: curveTag,
    signal:
      hasGR && hasPor
        ? "Modern triple-combo (GR + porosity + resistivity) — enables full Vsh/φ/Sw pipeline"
        : hasSP && hasRes
        ? "SP + resistivity classical vintage suite — Vsh via SP fallback"
        : "Sparse curve set — formation confidence capped",
    delta: curveDelta,
    registryHit: "curves ∩ expected_suite",
    icon: "curve",
    perCandidate: candidates.map((_, i) => (i === 0 ? curveDelta : Math.round(curveDelta / 2))),
  });

  if (!hasGR) {
    evidence.push({
      source: "Missing GR",
      ocrField: "no GR track detected",
      signal:
        "Vsh derived from SP only ⇒ shale-content confidence capped; shale-formation candidates lose evidence",
      delta: -12,
      registryHit: "penalty · shale plays require hot GR",
      icon: "warn",
      perCandidate: candidates.map((c) => (/shale/i.test(c.formation ?? "") ? -22 : -8)),
    });
  }

  const scores = candidates.map((_, i) =>
    50 + evidence.reduce((s, e) => s + (e.perCandidate?.[i] ?? 0), 0),
  );
  const clamped = scores.map((s) => Math.max(10, Math.min(97, s)));
  const order = clamped
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.i);

  return {
    candidates,
    evidence,
    scores: clamped,
    winner: order[0],
    hasGR,
    county,
    stateCode,
  };
}
