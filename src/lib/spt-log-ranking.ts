import { interpretWellLog, type PetroPoint, type IntervalResult } from "@/lib/petrophysics";
import type { WellLogPoint } from "@/hooks/useWellLogs";

export interface WaterInputsLite { rw_formation: number | null; rw_injection: number | null; injection_share_pct: number | null }

export interface LogRankResult {
  netPay: number;
  missedPay: number;
  avgPor: number | null;   // % (pay-weighted)
  avgK: number | null;     // mD (pay-weighted, Timur)
  avgSw: number | null;    // % (pay-weighted, Archie)
  riskIntervals: IntervalResult[]; // high Sw and/or low k reservoir intervals
  score: number;           // 0–100
  waterfloodCorrected: boolean;
}

export const SW_HIGH = 60;  // %
export const K_LOW = 1;     // mD

/** Same solver as Stage 8, reduced to SPT ranking metrics. Weights are screening defaults. */
export function rankFromLogs(logs: WellLogPoint[], water?: WaterInputsLite | null): LogRankResult | null {
  const pts: PetroPoint[] = logs
    .filter((r) => r.gamma_ray != null && r.resistivity != null && r.porosity != null)
    .map((r) => ({ depth: r.measured_depth, gr: r.gamma_ray!, sp: r.sp ?? -20, res: r.resistivity!, por: r.porosity!, sw: r.water_saturation ?? 50, rhob: r.density, nphi: r.neutron_porosity }));
  if (pts.length < 10) return null;
  const s = interpretWellLog(pts, {
    rwFormation: water?.rw_formation ?? undefined,
    rwInjection: water?.rw_injection ?? undefined,
    injectionFraction: (water?.injection_share_pct ?? 0) / 100,
  });
  const res = s.intervals.filter((i) => i.isReservoir);
  const h = res.reduce((a, i) => a + i.thickness, 0);
  const w = (f: (i: IntervalResult) => number | null) => {
    const v = res.filter((i) => f(i) != null); const hh = v.reduce((a, i) => a + i.thickness, 0);
    return hh > 0 ? v.reduce((a, i) => a + (f(i) as number) * i.thickness, 0) / hh : null;
  };
  const avgPor = h ? w((i) => i.avgPor) : null;
  const avgK = h ? w((i) => i.timurPermMd) : null;
  const avgSw = h ? w((i) => i.archieSwCalc ?? i.avgSw) : null;
  const riskIntervals = res.filter((i) => (i.archieSwCalc ?? i.avgSw) >= SW_HIGH || (i.timurPermMd != null && i.timurPermMd < K_LOW));

  const pay = Math.min(1, (s.netPay + s.totalMissedPay) / 50) * 35;
  const por = avgPor != null ? Math.min(1, avgPor / 15) * 20 : 0;
  const k = avgK != null ? Math.min(1, Math.log10(avgK + 1) / 2) * 20 : 0;
  const sw = avgSw != null ? Math.max(0, 1 - avgSw / 100) * 25 : 0;
  return { netPay: s.netPay, missedPay: s.totalMissedPay, avgPor, avgK, avgSw, riskIntervals, score: Math.round(pay + por + k + sw), waterfloodCorrected: s.waterfloodCorrected };
}
