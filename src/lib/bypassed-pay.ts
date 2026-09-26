// Single source of truth for "bypassed pay" (pay with no perforation overlap).
// Used by both the composite log (MISSED labels) and the recommendations text,
// so the two can never contradict each other.

export interface DepthInterval { top: number; bottom: number }
export interface PerfLike { depth_from: number; depth_to: number }

export type PerfStatus = "no_records" | "outside_log" | "ok";

export interface BypassedPayAssessment {
  status: PerfStatus;
  perfsInLog: PerfLike[];
  missed: DepthInterval[];
  missedFt: number;
}

export function assessBypassedPay(
  payZones: DepthInterval[],
  perforations: PerfLike[],
  logTop: number,
  logBottom: number,
): BypassedPayAssessment {
  if (!perforations.length) return { status: "no_records", perfsInLog: [], missed: [], missedFt: 0 };
  const perfsInLog = perforations.filter((p) => p.depth_from < logBottom && p.depth_to > logTop);
  if (!perfsInLog.length) return { status: "outside_log", perfsInLog, missed: [], missedFt: 0 };
  // Subtract perforated footage from each pay zone; leftover pieces >= 2 ft are bypassed pay
  // (e.g. pay 5024–5046 with perf 5024–5032 → missed 5032–5046).
  const sorted = [...perfsInLog].sort((a, b) => a.depth_from - b.depth_from);
  const missed: DepthInterval[] = [];
  for (const z of payZones) {
    let cur = z.top;
    for (const p of sorted) {
      if (p.depth_to <= cur || p.depth_from >= z.bottom) continue;
      if (p.depth_from > cur) missed.push({ top: cur, bottom: p.depth_from });
      cur = Math.max(cur, p.depth_to);
    }
    if (cur < z.bottom) missed.push({ top: cur, bottom: z.bottom });
  }
  for (let i = missed.length - 1; i >= 0; i--) if (missed[i].bottom - missed[i].top < 2) missed.splice(i, 1);
  const missedFt = Math.round(missed.reduce((s, z) => s + (z.bottom - z.top), 0));
  return { status: "ok", perfsInLog, missed, missedFt };
}

export function bypassedPayMessage(a: BypassedPayAssessment, logTop: number, logBottom: number): string {
  if (a.status === "no_records")
    return "No perforation records for this well — bypassed pay cannot be confirmed until completion data is loaded.";
  if (a.status === "outside_log")
    return `Recorded perforations lie outside the logged interval (${Math.round(logTop)}–${Math.round(logBottom)} ft) — verify depth reference before flagging bypassed pay.`;
  if (a.missedFt > 0)
    return `${a.missedFt} ft of bypassed pay identified outside existing perforations (${a.missed
      .map((z) => `${Math.round(z.top)}–${Math.round(z.bottom)} ft`)
      .join(", ")}).`;
  return "No bypassed pay detected against existing perforations.";
}
