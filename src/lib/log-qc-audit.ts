// Geologger data audit: automated QC of a contractor's well-log record.
// Screening checks only — a log analyst reviews any "Review"/"Fail" result.
import type { WellLogPoint } from "@/hooks/useWellLogs";

export type QcGrade = "pass" | "review" | "fail" | "no_data";
type CurveKey = "gamma_ray" | "resistivity" | "porosity" | "density" | "neutron_porosity";
export const QC_CURVES: { key: CurveKey; label: string; min: number; max: number }[] = [
  { key: "gamma_ray", label: "GR", min: 0, max: 300 },
  { key: "resistivity", label: "RES", min: 0.01, max: 2000 },
  { key: "porosity", label: "POR", min: 0, max: 50 },
  { key: "density", label: "RHOB", min: 1.5, max: 3.1 },
  { key: "neutron_porosity", label: "NPHI", min: -5, max: 60 },
];

export interface CurveQc { label: string; coveragePct: number; outOfRangePct: number; flatRuns: number }
export interface LogQc {
  grade: QcGrade; samples: number; top: number | null; base: number | null; stepFt: number | null;
  irregularStepPct: number; gaps: number; curves: CurveQc[]; issues: string[];
}

export function auditLog(rows: WellLogPoint[]): LogQc {
  const pts = [...rows].filter(r => Number.isFinite(r.measured_depth)).sort((a, b) => a.measured_depth - b.measured_depth);
  if (pts.length < 10) return { grade: "no_data", samples: pts.length, top: null, base: null, stepFt: null, irregularStepPct: 0, gaps: 0, curves: [], issues: ["No usable log record (< 10 samples)"] };
  const steps = pts.slice(1).map((p, i) => p.measured_depth - pts[i].measured_depth);
  const sorted = [...steps].sort((a, b) => a - b);
  const step = sorted[Math.floor(sorted.length / 2)] || 0;
  const irregular = steps.filter(s => step > 0 && Math.abs(s - step) > step * 0.25).length;
  const gaps = steps.filter(s => step > 0 && s > step * 5).length;
  const issues: string[] = [];
  const curves: CurveQc[] = QC_CURVES.map(c => {
    const vals = pts.map(p => p[c.key]);
    const present = vals.filter((v): v is number => v != null && Number.isFinite(v));
    const oor = present.filter(v => v < c.min || v > c.max).length;
    let flatRuns = 0, run = 1;
    for (let i = 1; i < vals.length; i++) {
      if (vals[i] != null && vals[i] === vals[i - 1]) { run++; if (run === 20) flatRuns++; } else run = 1;
    }
    const q = { label: c.label, coveragePct: Math.round(present.length / pts.length * 100), outOfRangePct: present.length ? +(oor / present.length * 100).toFixed(1) : 0, flatRuns };
    if (q.coveragePct > 0 && q.outOfRangePct > 2) issues.push(`${c.label}: ${q.outOfRangePct}% of samples outside ${c.min}–${c.max}`);
    if (flatRuns) issues.push(`${c.label}: ${flatRuns} flat-line run(s) ≥ 20 samples (possible tool stick / fill)`);
    return q;
  });
  const cov = (l: string) => curves.find(c => c.label === l)!.coveragePct;
  if (cov("GR") < 80) issues.push(`GR coverage ${cov("GR")}% (< 80%) — correlation limited`);
  if (cov("RES") < 80) issues.push(`Resistivity coverage ${cov("RES")}% (< 80%) — Sw unreliable`);
  if (cov("POR") < 80 && cov("RHOB") < 80 && cov("NPHI") < 80) issues.push("No porosity curve with ≥ 80% coverage");
  const irregularStepPct = +(irregular / steps.length * 100).toFixed(1);
  if (irregularStepPct > 5) issues.push(`Irregular sampling on ${irregularStepPct}% of steps`);
  if (gaps) issues.push(`${gaps} depth gap(s) > 5× sample step`);
  const fail = cov("GR") < 50 || cov("RES") < 50;
  const grade: QcGrade = fail ? "fail" : issues.length ? "review" : "pass";
  return { grade, samples: pts.length, top: pts[0].measured_depth, base: pts.at(-1)!.measured_depth, stepFt: +step.toFixed(2), irregularStepPct, gaps, curves, issues };
}

export const qcLabel: Record<QcGrade, string> = { pass: "Pass", review: "Review", fail: "Fail", no_data: "No data" };
