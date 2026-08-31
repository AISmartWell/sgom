import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Satellite, FolderOpen, Microscope, TrendingUp, Waves, Rocket,
  DollarSign, BarChart3, Brain, Play, Pause, RotateCcw, CheckCircle2, ScanText, Lock, FileBarChart,
} from "lucide-react";
import satelliteView from "@/assets/satellite-field-view.jpg";
import paperLog from "@/assets/demo-paper-well-log.jpg";

type Stage = {
  num: number;
  title: string;
  icon: typeof Satellite;
  input: string;
  action: string;
  output: string[];
  color: string;
};

const STAGES: Stage[] = [
  {
    num: 1, title: "Field Scanning", icon: Satellite, color: "text-sky-400",
    input: "Satellite imagery of the lease area",
    action: "Pad, access road and tank battery detected; the well location is matched to the public registry record.",
    output: ["Location confirmed", "Field: Kansas shallow carbonate play", "Surface infrastructure: active"],
  },
  {
    num: 2, title: "Data Classification", icon: FolderOpen, color: "text-cyan-400",
    input: "Scanned paper well log (1982) + completion report",
    action: "Vision OCR reads the paper sheet: header block, depth scale, curve tracks and perforation notes are recognised and typed automatically.",
    output: ["Document type: paper well log", "Header, depth range and curve names extracted", "Records attached to the well card"],
  },
  {
    num: 3, title: "Core Analysis", icon: Microscope, color: "text-violet-400",
    input: "Core photographs and legacy core report",
    action: "Image analysis segments the sample and cross-checks the description text against the digitised report.",
    output: ["Lithology: carbonate with sandy interbeds", "Reservoir quality: moderate", "Report values reconciled with imagery"],
  },
  {
    num: 4, title: "Cumulative Analysis", icon: TrendingUp, color: "text-emerald-400",
    input: "Monthly production history",
    action: "Decline behaviour and remaining-life indicators are evaluated against the field benchmark.",
    output: ["Production trend classified", "Remaining life estimated", "Economic limit flagged"],
  },
  {
    num: 5, title: "Seismic Reinterpretation", icon: Waves, color: "text-blue-400",
    input: "Legacy seismic section over the block",
    action: "Horizons and discontinuities are re-picked and compared with the well tops from Stage 2.",
    output: ["Horizons re-aligned to well tops", "Structural setting: flank position", "Bypassed-pay zone highlighted"],
  },
  {
    num: 6, title: "SPT Projection", icon: Rocket, color: "text-green-400",
    input: "Interval candidates from Stages 3–5",
    action: "Slot Perforation Technology intervals are projected onto the reservoir section and screened against completion history.",
    output: ["Target intervals shortlisted", "Existing perforations avoided", "Treatment sequence proposed"],
  },
  {
    num: 7, title: "Economic Analysis", icon: DollarSign, color: "text-amber-400",
    input: "Projected response + operating assumptions",
    action: "Probabilistic economics are run over the candidate scenario range.",
    output: ["Payback window estimated", "Downside / base / upside range", "Ranking score assigned"],
  },
  {
    num: 8, title: "Geophysical Expertise", icon: BarChart3, color: "text-orange-400",
    input: "Digitised curves from the paper log",
    action: "The petrophysical solver builds a continuous interpretation of the logged interval and validates it against core and pressure data.",
    output: ["Clean vs. shaly intervals separated", "Pay flags produced", "Interpretation quality: validated"],
  },
  {
    num: 9, title: "EOR Optimization", icon: Brain, color: "text-pink-400",
    input: "All stage outputs",
    action: "The AI agent ranks restoration options for this well and writes a short, source-linked justification.",
    output: ["Recommended option: SPT restoration", "Confidence: high", "Full audit trail available to the operator"],
  },
];

const REPORT_STATS = [
  { label: "Net Pay",     value: "52",    unit: "ft", color: "text-emerald-400" },
  { label: "Gross Pay",   value: "52",    unit: "ft", color: "text-primary" },
  { label: "N/G Ratio",   value: "100",   unit: "%",  color: "text-emerald-400" },
  { label: "Missed Pay",  value: "42",    unit: "ft", color: "text-rose-400" },
  { label: "Shale (cap)", value: "117",   unit: "ft", color: "text-rose-400" },
  { label: "Clean Sand",  value: "42",    unit: "ft", color: "text-amber-400" },
  { label: "Total Depth", value: "5,225", unit: "ft", color: "text-sky-400" },
];

const REPORT_INTERVALS = [
  { name: "Clean Sand (MISSED — never perforated)", thickness: "42 ft",  dot: "bg-rose-400" },
  { name: "Silty Sand",  thickness: "10 ft",  dot: "bg-yellow-600" },
  { name: "Shale (seal)",thickness: "117 ft", dot: "bg-rose-400" },
  { name: "Logged interval", thickness: "12 zones", dot: "bg-sky-400" },
];

const REPORT_RECOMMENDATIONS = [
  "Net pay confirmed across the upper sand package — no reservoir quality downgrade required.",
  "42 ft of pay flagged as MISSED: the clean sand interval carries no perforations — bypassed oil confirmed.",
  "Overlying shale provides an effective seal for a staged treatment.",
  "Missed interval is the primary SPT target — slot perforation can access bypassed reserves without new drilling.",
  "Candidate promoted to Stage 9 (EOR Optimization) with high confidence.",
];

const STEP_MS = 2600;

export default function BrawnerExpertiseDemo() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<number | null>(null);
  const stage = STAGES[active];

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      setActive((a) => (a + 1 < STAGES.length ? a + 1 : (setPlaying(false), a)));
    }, STEP_MS);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [active, playing]);

  const progress = useMemo(() => ((active + 1) / STAGES.length) * 100, [active]);
  const Icon = stage.icon;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">Guided Demo</Badge>
            <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" /> No proprietary methods shown</Badge>
          </div>
          <h1 className="text-2xl font-bold">Geophysical Expertise — Brawner 10-15</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            End-to-end walkthrough: from a satellite view of the lease to a paper well log, and through all nine
            analysis stages of the SGOM pipeline. Illustrative demo dataset.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setActive(0); setPlaying(true); }}>
            <RotateCcw className="w-4 h-4 mr-2" /> Restart
          </Button>
        </div>
      </header>

      {/* Sources */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={active === 0 ? "border-primary/60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Satellite className="w-4 h-4 text-sky-400" /> Source A — Satellite view
            </CardTitle>
            <CardDescription>Lease surface, pad and access infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <img src={satelliteView} alt="Satellite view of the Brawner 10-15 lease area" loading="lazy"
              className="rounded-md border border-border w-full h-52 object-cover" />
          </CardContent>
        </Card>
        <Card className={active === 1 ? "border-primary/60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanText className="w-4 h-4 text-cyan-400" /> Source B — Paper well log
            </CardTitle>
            <CardDescription>Legacy 1982 sheet, digitised by Vision OCR</CardDescription>
          </CardHeader>
          <CardContent>
            <img src={paperLog} alt="Scanned paper well log for Brawner 10-15" loading="lazy"
              className="rounded-md border border-border w-full h-52 object-cover object-top" />
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Stage {stage.num} of 9 — {stage.title}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {STAGES.map((s, i) => {
              const S = s.icon;
              const done = i < active;
              const cur = i === active;
              return (
                <button
                  key={s.num}
                  onClick={() => { setActive(i); setPlaying(false); }}
                  className={`rounded-lg border p-2 text-left transition-colors ${
                    cur ? "border-primary bg-primary/10" : done ? "border-border bg-muted/40" : "border-border/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <S className={`w-3.5 h-3.5 ${s.color}`} />}
                    <span className="text-[10px] font-mono text-muted-foreground">ST {s.num}</span>
                  </div>
                  <div className="text-[11px] leading-tight font-medium">{s.title}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active stage detail */}
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={`w-5 h-5 ${stage.color}`} />
            Stage {stage.num} · {stage.title}
          </CardTitle>
          <CardDescription>{stage.action}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Input</p>
            <p className="text-sm">{stage.input}</p>
          </div>
          <div className="md:col-span-2 rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Output</p>
            <ul className="space-y-1">
              {stage.output.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Final report */}
      <Card className="border-emerald-500/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Stage 8 · Step 10</Badge>
            <Badge variant="outline" className="text-[10px]">Real Data</Badge>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-emerald-400" /> Final Report — BRAWNER 10-15
          </CardTitle>
          <CardDescription>
            Gross / Net Pay, N/G ratio, dominant fluid and recommendations, produced from 72 digitised log points across 12 intervals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {REPORT_STATS.map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold leading-tight ${s.color}`}>
                  {s.value}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Interval summary</p>
              <ul className="space-y-1.5 text-sm">
                {REPORT_INTERVALS.map((i) => (
                  <li key={i.name} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${i.dot}`} />
                      {i.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{i.thickness}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recommendations</p>
              <ul className="space-y-1.5">
                {REPORT_RECOMMENDATIONS.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-emerald-400">AI Verdict</p>
              <p className="text-base font-semibold">High-quality reservoir · SPT candidate</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground">Dominant fluid: oil · Interpretation quality: validated</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Demonstration view only. Calculation methods, model parameters and client datasets are not disclosed on this page.
      </p>
    </div>
  );
}
