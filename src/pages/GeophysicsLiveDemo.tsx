import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ScanLine, Layers, Droplets, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { interpretWellLog, type PetroPoint, type IntervalResult } from "@/lib/petrophysics";

/* ── Deterministic Brawner 10-15 demo log (no Math.random) ── */
const TOP = 3400, BOT = 3700, STEP = 2;
const rng = (seed: number) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 0xffffffff); };
// sand bodies: [top, bottom, oil?]
const SANDS: [number, number, "oil" | "wet" | "missed"][] = [
  [3452, 3474, "oil"], [3512, 3522, "missed"], [3560, 3590, "oil"], [3636, 3650, "wet"],
];
const buildLog = (): PetroPoint[] => {
  const r = rng(1015); const pts: PetroPoint[] = [];
  for (let d = TOP; d <= BOT; d += STEP) {
    const n = () => r() - 0.5;
    const sand = SANDS.find(([a, b]) => d >= a && d <= b);
    let gr = 95 + n() * 14, res = 3 + n() * 1.2, por = 4 + n() * 2, sw = 90;
    if (sand) {
      gr = 30 + n() * 10; por = 16 + n() * 4;
      if (sand[2] === "oil") { res = 45 + n() * 15; sw = 32 + n() * 6; }
      else if (sand[2] === "missed") { res = 9 + n() * 2; sw = 68 + n() * 4; por = 12 + n() * 2; }
      else { res = 2.5 + n(); sw = 92; }
    }
    pts.push({ depth: d, gr: +gr.toFixed(1), sp: sand ? -70 : -15, res: +Math.max(0.5, res).toFixed(1),
      por: +por.toFixed(1), sw: +sw.toFixed(1), rhob: +(2.65 - por / 100 * 1.65).toFixed(3), nphi: +(por / 100 + 0.02).toFixed(3) });
  }
  return pts;
};

const DURATION = 36; // seconds
const PHASES = [
  { at: 0.00, icon: ScanLine, title: "Digitizing paper log", text: "The 1982 paper log is scanned. AI reads the curves and converts them into numbers, foot by foot." },
  { at: 0.30, icon: Layers, title: "Reading the rock", text: "Each depth is classified: clean sand (can hold oil) or shale (seal)." },
  { at: 0.50, icon: Droplets, title: "Finding oil vs water", text: "High resistivity in porous sand means oil. Low resistivity means water." },
  { at: 0.70, icon: Target, title: "Marking pay zones", text: "Intervals that pass all cutoffs become pay. Borderline intervals are flagged as missed opportunity." },
  { at: 0.88, icon: CheckCircle2, title: "Verdict", text: "The platform summarises reserves and recommends next action." },
];

const W = 110, H = 560;
const yOf = (d: number) => ((d - TOP) / (BOT - TOP)) * H;

export default function GeophysicsLiveDemo() {
  const data = useMemo(buildLog, []);
  const result = useMemo(() => interpretWellLog(data), [data]);
  const [t, setT] = useState(() => (new URLSearchParams(window.location.search).get("end") ? 1 : 0));
  const [playing, setPlaying] = useState(true);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) { last.current = null; return; }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current != null) setT((p) => Math.min(1, p + (now - last.current!) / 1000 / DURATION));
      last.current = now; raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  useEffect(() => { if (t >= 1) setPlaying(false); }, [t]);

  const phaseIdx = PHASES.reduce((a, p, i) => (t >= p.at ? i : a), 0);
  const scan = Math.min(1, t / 0.3);               // digitizing cursor
  const cursorDepth = TOP + scan * (BOT - TOP);
  const lith = Math.min(1, Math.max(0, (t - 0.3) / 0.2));
  const fluid = Math.min(1, Math.max(0, (t - 0.5) / 0.2));
  const pay = Math.min(1, Math.max(0, (t - 0.7) / 0.18));
  const done = t >= 0.88;

  const visible = data.filter((p) => p.depth <= cursorDepth);
  const path = (key: "gr" | "res" | "por", lo: number, hi: number, log = false) =>
    visible.map((p, i) => {
      const v = log ? (Math.log10(p[key]) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) : (p[key] - lo) / (hi - lo);
      return `${i ? "L" : "M"}${(Math.max(0, Math.min(1, v)) * W).toFixed(1)},${yOf(p.depth).toFixed(1)}`;
    }).join(" ");

  const reservoirs = result.intervals.filter((i) => i.isReservoir);
  const shownPay = reservoirs.filter((i) => yOf(i.top) / H <= pay);
  const netPayLive = shownPay.filter((i) => i.isNetPay).reduce((s, i) => s + i.thickness, 0);
  const isWater = (i: IntervalResult) => !i.isNetPay && i.avgRes < 5;
  const missedLive = shownPay.filter((i) => !i.isNetPay && !isWater(i)).reduce((s, i) => s + i.thickness, 0);
  // Volumetric estimate, 40-acre spacing, Bo 1.2, RF 15%
  const missedTotal = Math.round(reservoirs.filter((i) => !i.isNetPay && !isWater(i)).reduce((s, i) => s + i.thickness, 0));
  const ooip = 7758 * 40 * result.netPay * (result.avgPorosity / 100) * (1 - result.avgSw / 100) / 1.2;
  const recoverable = ooip * 0.15;

  const lithColor = (iv: IntervalResult) => (iv.isReservoir ? "hsl(var(--warning) / 0.55)" : "hsl(var(--muted-foreground) / 0.35)");

  const Track = ({ title, unit, children }: { title: string; unit: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-center">
      <div className="text-[10px] font-mono text-muted-foreground mb-1">{title} <span className="opacity-60">{unit}</span></div>
      <svg width={W} height={H} className="border border-border/60 rounded bg-card/40">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={f * W} x2={f * W} y1={0} y2={H} stroke="hsl(var(--border))" strokeWidth={0.5} />)}
        {children}
        {scan < 1 && <line x1={0} x2={W} y1={yOf(cursorDepth)} y2={yOf(cursorDepth)} stroke="hsl(var(--primary))" strokeWidth={2} />}
      </svg>
    </div>
  );

  const Phase = PHASES[phaseIdx];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-primary tracking-widest">SGOM · STAGE 8 · LIVE GEOPHYSICAL ANALYSIS</div>
          <h1 className="text-2xl md:text-3xl font-light">Brawner 10-15 — watch the platform read a well</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPlaying((p) => !p)} disabled={t >= 1}>
            {playing ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}{playing ? "Pause" : "Play"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setT(0); setPlaying(true); }}><RotateCcw className="h-4 w-4 mr-1" />Restart</Button>
        </div>
      </header>

      <div className="h-1 bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${t * 100}%` }} /></div>

      <main className="max-w-7xl mx-auto p-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Log panel */}
        <section className="rounded-xl border border-border/60 bg-card/30 p-4 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {/* depth */}
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-mono text-muted-foreground mb-1">DEPTH ft</div>
              <svg width={44} height={H} style={{ overflow: "visible" }}>
                {Array.from({ length: 7 }, (_, i) => TOP + i * 50).map((d) => (
                  <text key={d} x={40} y={Math.min(H - 2, Math.max(10, yOf(d) + 4))} textAnchor="end" className="fill-muted-foreground" fontSize={10} fontFamily="monospace">{d}</text>
                ))}
              </svg>
            </div>
            <Track title="GR" unit="API">
              <path d={path("gr", 0, 150)} fill="none" stroke="hsl(var(--foreground) / 0.85)" strokeWidth={1.4} />
            </Track>
            <Track title="LITHOLOGY" unit="">
              {result.intervals.filter((iv) => yOf(iv.top) / H <= lith).map((iv, i) => (
                <rect key={i} x={0} width={W} y={yOf(iv.top)} height={Math.max(2, yOf(iv.bottom) - yOf(iv.top))} fill={lithColor(iv)} />
              ))}
            </Track>
            <Track title="RESISTIVITY" unit="Ω·m">
              <path d={path("res", 0.5, 200, true)} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.4} />
              {fluid > 0 && reservoirs.filter((iv) => yOf(iv.top) / H <= fluid).map((iv, i) => (
                <rect key={i} x={0} width={W} y={yOf(iv.top)} height={yOf(iv.bottom) - yOf(iv.top)}
                  fill={iv.avgRes > 15 ? "hsl(var(--success) / 0.2)" : "hsl(var(--muted-foreground) / 0.2)"} />
              ))}
            </Track>
            <Track title="POROSITY" unit="%">
              <path d={path("por", 0, 30)} fill="none" stroke="hsl(var(--accent))" strokeWidth={1.4} />
            </Track>
            <Track title="PAY" unit="">
              {shownPay.map((iv, i) => (
                <g key={i}>
                  <rect x={4} width={W - 8} y={yOf(iv.top)} height={yOf(iv.bottom) - yOf(iv.top)} rx={3}
                    fill={iv.isNetPay ? "hsl(var(--success) / 0.7)" : isWater(iv) ? "hsl(var(--muted-foreground) / 0.4)" : "hsl(var(--warning) / 0.7)"} />
                  <text x={W / 2} y={(yOf(iv.top) + yOf(iv.bottom)) / 2 + 4} textAnchor="middle" fontSize={10} className="fill-foreground font-mono">
                    {iv.isNetPay ? "PAY" : isWater(iv) ? "WATER" : "MISSED"} {Math.round(iv.thickness)}ft
                  </text>
                </g>
              ))}
            </Track>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-success/70" />Pay (oil)</span>
            <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-warning/70" />Missed opportunity</span>
            <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-muted-foreground/40" />Shale / water</span>
          </div>
        </section>

        {/* Narrative + live numbers */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary text-xs font-mono">STEP {phaseIdx + 1} / {PHASES.length}</div>
            <div className="flex items-center gap-2 mt-1 text-lg"><Phase.icon className="h-5 w-5 text-primary" />{Phase.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{Phase.text}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Depth read", `${Math.round(cursorDepth)} ft`],
              ["Data points", `${visible.length}`],
              ["Net pay", `${Math.round(netPayLive)} ft`],
              ["Missed pay", `${Math.round(missedLive)} ft`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                <div className="text-xl font-mono">{v}</div>
              </div>
            ))}
          </div>

          <ol className="space-y-1 text-sm">
            {PHASES.map((p, i) => (
              <li key={p.title} className={`flex items-center gap-2 ${i < phaseIdx || done ? "text-success" : i === phaseIdx ? "text-foreground" : "text-muted-foreground/50"}`}>
                <CheckCircle2 className="h-4 w-4" />{p.title}
              </li>
            ))}
          </ol>

          {done && (
            <div className="rounded-xl border border-success/50 bg-success/10 p-4 space-y-2 animate-fade-in">
              <div className="text-xs font-mono text-success">VERDICT</div>
              <div className="text-lg">Productive well — {result.netPay} ft of oil pay found</div>
              <div className="text-sm text-muted-foreground">
                Estimated recoverable oil ≈ <b className="text-foreground">{Math.round(recoverable / 1000)}K bbl</b> (40-acre estimate).
              </div>
              {missedTotal > 0 && (
                <div className="flex gap-2 text-sm text-warning"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {missedTotal} ft bypassed interval — candidate for SPT treatment.</div>
              )}
              <div className="text-sm">Analysis time: <b>{DURATION} s</b> vs ~2 days by manual interpretation.</div>
            </div>
          )}
        </aside>
      </main>
      <footer className="text-center text-xs text-muted-foreground pb-6">Demonstration based on illustrative log data · © AI Smart Well Inc.</footer>
    </div>
  );
}
