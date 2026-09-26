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
  const missed = payZones.filter(
    (z) => !perfsInLog.some((p) => p.depth_from < z.bottom && p.depth_to > z.top),
  );
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
