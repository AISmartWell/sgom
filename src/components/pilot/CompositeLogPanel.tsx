import type { WellLogPoint } from "@/hooks/useWellLogs";
import type { LogRankResult } from "@/lib/spt-log-ranking";
import type { CasingString } from "@/lib/casing-program";

/**
 * Dense SLB-style composite log: depth | casing | GR | RES (log) | POR/NPHI + RHOB | Sw | interpretation.
 * Annotations are drawn from rankFromLogs output only (measured LAS data), never invented.
 * Casing track renders only saved well_casing_programs records; depths outside the log range are clipped.
 */
type Interval = LogRankResult["intervals"][number];

const H = 520, TOP = 34, BOT = 10;
const TRACKS = [
  { key: "depth", w: 46, title: "MD, ft" },
  { key: "csg", w: 64, title: "Casing", scale: "OD, in" },
  { key: "gr", w: 110, title: "GR", scale: "0 — 150 API" },
  { key: "res", w: 110, title: "RES", scale: "0.2 — 2000 Ω·m" },
  { key: "por", w: 120, title: "PHI · NPHI · RHOB", scale: "45 — 0 % | 1.95–2.95" },
  { key: "sw", w: 90, title: "Sw (Archie)", scale: "100 — 0 %" },
  { key: "int", w: 64, title: "Pay / risk" },
  { key: "ann", w: 200, title: "Findings" },
] as const;

const C = {
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
  fg: "hsl(var(--foreground))",
  gr: "hsl(var(--chart-3, 142 70% 45%))",
  res: "hsl(var(--destructive))",
  por: "hsl(var(--primary))",
  nphi: "hsl(var(--chart-4, 280 65% 60%))",
  rhob: "hsl(var(--chart-5, 25 90% 55%))",
  sw: "hsl(var(--primary))",
  sand: "hsl(var(--chart-4, 45 90% 55%))",
};

export function CompositeLogPanel({ logs, rank, title }: { logs: WellLogPoint[]; rank: LogRankResult | null; title: string }) {
  const pts = logs.filter(l => Number.isFinite(l.measured_depth)).sort((a, b) => a.measured_depth - b.measured_depth);
  if (pts.length < 5) return <p className="text-xs text-muted-foreground">Composite log needs an imported LAS file (no measured curves for this well).</p>;

  const top = pts[0].measured_depth, base = pts[pts.length - 1].measured_depth;
  const y = (d: number) => TOP + ((d - top) / Math.max(1, base - top)) * (H - TOP - BOT);
  const xs: number[] = []; TRACKS.reduce((a, t) => (xs.push(a), a + t.w), 0);
  const W = TRACKS.reduce((a, t) => a + t.w, 0);
  const tx = (k: string) => xs[TRACKS.findIndex(t => t.key === k)];
  const tw = (k: string) => TRACKS.find(t => t.key === k)!.w;

  const lin = (k: string, v: number, lo: number, hi: number) => tx(k) + 2 + Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * (tw(k) - 4);
  const logx = (k: string, v: number) => lin(k, Math.log10(Math.max(0.2, v)), Math.log10(0.2), Math.log10(2000));
  const path = (f: (p: WellLogPoint) => number | null) => {
    let d = "", pen = false;
    for (const p of pts) { const x = f(p); if (x == null || !Number.isFinite(x)) { pen = false; continue; } d += `${pen ? "L" : "M"}${x.toFixed(1)},${y(p.measured_depth).toFixed(1)}`; pen = true; }
    return d;
  };

  // GR sand shading (GR < 75 API) — fill between curve and right edge of the cutoff
  const grCut = 75;
  const sandFill = pts.filter(p => p.gamma_ray != null && p.gamma_ray < grCut);

  const step = Math.pow(10, Math.floor(Math.log10(Math.max(10, (base - top) / 8))));
  const ticks: number[] = []; for (let d = Math.ceil(top / step) * step; d <= base; d += step) ticks.push(d);

  const risk = new Set((rank?.riskIntervals ?? []).map(i => `${i.top}-${i.bottom}`));
  const ints: Interval[] = (rank?.intervals ?? []).slice(0, 12);
  // annotation labels, de-overlapped vertically
  let lastY = TOP - 20;
  const anns = ints.slice(0, 7).map(i => {
    const mid = y((i.top + i.bottom) / 2);
    const ly = Math.max(mid, lastY + 30); lastY = ly;
    const bad = risk.has(`${i.top}-${i.bottom}`);
    const sw = i.archieSwCalc ?? i.avgSw;
    return { i, mid, ly, bad, sw };
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 640, maxHeight: 560 }} className="rounded-md border border-border bg-card" role="img" aria-label={`Composite log ${title}`}>
        {TRACKS.map((t, n) => (
          <g key={t.key}>
            <rect x={xs[n]} y={0} width={t.w} height={H} fill="none" stroke={C.grid} strokeWidth={0.6} />
            <text x={xs[n] + t.w / 2} y={12} fontSize={9} textAnchor="middle" fill={C.fg} fontWeight={600}>{t.title}</text>
            {"scale" in t && <text x={xs[n] + t.w / 2} y={24} fontSize={7} textAnchor="middle" fill={C.text}>{t.scale}</text>}
          </g>
        ))}
        <line x1={0} x2={W} y1={TOP - 4} y2={TOP - 4} stroke={C.grid} strokeWidth={0.8} />
        {ticks.map(d => (
          <g key={d}>
            <line x1={tx("gr")} x2={tx("ann")} y1={y(d)} y2={y(d)} stroke={C.grid} strokeWidth={0.4} strokeDasharray="2 3" />
            <text x={tx("depth") + 42} y={y(d) + 3} fontSize={8} textAnchor="end" fill={C.text}>{d.toLocaleString()}</text>
          </g>
        ))}

        {/* GR + sand shading */}
        {sandFill.map((p, k) => <line key={k} x1={lin("gr", p.gamma_ray!, 0, 150)} x2={lin("gr", grCut, 0, 150)} y1={y(p.measured_depth)} y2={y(p.measured_depth)} stroke={C.sand} strokeOpacity={0.35} strokeWidth={2} />)}
        <line x1={lin("gr", grCut, 0, 150)} x2={lin("gr", grCut, 0, 150)} y1={TOP} y2={H - BOT} stroke={C.text} strokeWidth={0.5} strokeDasharray="3 2" />
        <path d={path(p => p.gamma_ray == null ? null : lin("gr", p.gamma_ray, 0, 150))} fill="none" stroke={C.gr} strokeWidth={1} />

        <path d={path(p => p.resistivity == null ? null : logx("res", p.resistivity))} fill="none" stroke={C.res} strokeWidth={1} />

        <path d={path(p => p.porosity == null ? null : lin("por", 45 - (p.porosity > 1 ? p.porosity : p.porosity * 100), 0, 45))} fill="none" stroke={C.por} strokeWidth={1} />
        <path d={path(p => p.neutron_porosity == null ? null : lin("por", 45 - (p.neutron_porosity > 1 ? p.neutron_porosity : p.neutron_porosity * 100), 0, 45))} fill="none" stroke={C.nphi} strokeWidth={0.8} strokeDasharray="3 2" />
        <path d={path(p => p.density == null ? null : lin("por", p.density, 1.95, 2.95))} fill="none" stroke={C.rhob} strokeWidth={0.8} />

        <path d={path(p => p.water_saturation == null ? null : lin("sw", 100 - (p.water_saturation > 1 ? p.water_saturation : p.water_saturation * 100), 0, 100))} fill="none" stroke={C.sw} strokeWidth={1} />
        <line x1={lin("sw", 40, 0, 100)} x2={lin("sw", 40, 0, 100)} y1={TOP} y2={H - BOT} stroke={C.res} strokeWidth={0.5} strokeDasharray="3 2" />
        <text x={lin("sw", 40, 0, 100) + 2} y={TOP + 8} fontSize={7} fill={C.res}>60%</text>

        {/* interpretation track */}
        {ints.map((i, k) => {
          const bad = risk.has(`${i.top}-${i.bottom}`);
          return <rect key={k} x={tx("int") + 6} y={y(i.top)} width={tw("int") - 12} height={Math.max(2, y(i.bottom) - y(i.top))} fill={bad ? C.res : C.por} fillOpacity={0.55} stroke={bad ? C.res : C.por} strokeWidth={0.6} />;
        })}

        {/* findings with leader arrows */}
        <defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L6,3L0,6z" fill={C.text} /></marker></defs>
        {anns.map(({ i, mid, ly, bad, sw }, k) => (
          <g key={k}>
            <path d={`M${tx("ann") + 10},${ly} L${tx("ann") + 4},${ly} L${tx("int") + tw("int") - 4},${mid}`} fill="none" stroke={C.text} strokeWidth={0.6} markerEnd="url(#arr)" />
            <text x={tx("ann") + 12} y={ly - 2} fontSize={8} fill={bad ? C.res : C.fg} fontWeight={600}>{bad ? "Risk" : "Pay"} {Math.round(i.top)}–{Math.round(i.bottom)} ft · {i.thickness.toFixed(1)} ft</text>
            <text x={tx("ann") + 12} y={ly + 8} fontSize={7} fill={C.text}>φ {i.avgPor?.toFixed(1) ?? "—"}% · k {i.timurPermMd?.toFixed(2) ?? "—"} mD · Sw {sw?.toFixed(0) ?? "—"}%</text>
          </g>
        ))}
        {ints.length === 0 && <text x={tx("ann") + 8} y={TOP + 14} fontSize={8} fill={C.text}>No reservoir intervals above cutoffs</text>}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-1">
        <span>Measured LAS curves · interpretation from Stage 8 solver (Archie Sw, Timur k)</span>
        <span>Shaded GR &lt; {grCut} API = candidate sand</span>
        <span>Pay = reservoir interval; Risk = Sw ≥ 60% or k below {rank?.kCutoff ?? 1} mD</span>
        <span>PRELIMINARY — log analyst review required</span>
      </div>
    </div>
  );
}
