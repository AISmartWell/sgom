import { parseLAS } from "@/lib/las-parser";

/**
 * Cement bond (CBL) screening for SPT intervals.
 * Bond index from CBL amplitude: BI = (log Afree − log A) / (log Afree − log Abonded).
 * Free-pipe and fully-bonded amplitudes are screening defaults that depend on casing size;
 * results are preliminary and must be confirmed by a log analyst (VDL review).
 */
export const CBL_MNEMONICS = ["CBL", "CBLF", "AMP", "CBLA", "AMP3FT", "E1", "CBL_AMP"];
export const VDL_MNEMONICS = ["VDL", "VDLF", "WF", "WAVE"];
export const BI_GOOD = 0.8;
export const BI_MODERATE = 0.6;
export const ISOLATION_FT = 10; // continuous good bond needed above and below an interval

export interface CblPoint { depth: number; amp: number; bi: number }
export interface CblLog { points: CblPoint[]; mnemonic: string; hasVdl: boolean; top: number; bottom: number }

export function parseCblFromLas(content: string, freePipeMv: number, bondedMv: number): CblLog {
  const las = parseLAS(content);
  const names = las.curves.map((c) => c.mnemonic);
  const di = names.findIndex((m) => ["DEPT", "DEPTH", "MD"].includes(m));
  if (di < 0) throw new Error("No depth curve (DEPT/DEPTH/MD) in LAS file.");
  const ai = names.findIndex((m) => CBL_MNEMONICS.includes(m));
  if (ai < 0) throw new Error(`No CBL amplitude curve found. Expected one of: ${CBL_MNEMONICS.join(", ")}.`);
  const nul = las.header.null_value;
  const lf = Math.log10(freePipeMv), lb = Math.log10(Math.max(bondedMv, 0.01));
  const points: CblPoint[] = [];
  for (const r of las.data) {
    const d = r[di], a = r[ai];
    if (d == null || a == null || d === nul || a === nul || !(a > 0)) continue;
    const bi = Math.max(0, Math.min(1, (lf - Math.log10(a)) / (lf - lb)));
    points.push({ depth: d, amp: a, bi });
  }
  if (points.length < 5) throw new Error("CBL curve has too few valid samples.");
  points.sort((x, y) => x.depth - y.depth);
  return { points, mnemonic: names[ai], hasVdl: names.some((m) => VDL_MNEMONICS.includes(m)), top: points[0].depth, bottom: points[points.length - 1].depth };
}

export type BondVerdict = "isolated" | "questionable" | "poor" | "no-data";
export interface IntervalBond { top: number; bottom: number; avgBi: number | null; goodPct: number | null; sealAbove: boolean; sealBelow: boolean; verdict: BondVerdict }

const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);

export function assessInterval(log: CblLog, top: number, bottom: number): IntervalBond {
  const inside = log.points.filter((p) => p.depth >= top && p.depth <= bottom);
  if (!inside.length) return { top, bottom, avgBi: null, goodPct: null, sealAbove: false, sealBelow: false, verdict: "no-data" };
  const above = log.points.filter((p) => p.depth >= top - ISOLATION_FT && p.depth < top);
  const below = log.points.filter((p) => p.depth > bottom && p.depth <= bottom + ISOLATION_FT);
  const sealed = (s: CblPoint[]) => s.length > 0 && s.every((p) => p.bi >= BI_GOOD);
  const avgBi = avg(inside.map((p) => p.bi));
  const goodPct = (inside.filter((p) => p.bi >= BI_GOOD).length / inside.length) * 100;
  const sealAbove = sealed(above), sealBelow = sealed(below);
  const verdict: BondVerdict = sealAbove && sealBelow && (avgBi ?? 0) >= BI_GOOD ? "isolated"
    : (avgBi ?? 0) < BI_MODERATE || (!sealAbove && !sealBelow) ? "poor" : "questionable";
  return { top, bottom, avgBi, goodPct, sealAbove, sealBelow, verdict };
}
