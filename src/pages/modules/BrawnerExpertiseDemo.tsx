import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Satellite, FolderOpen, Microscope, TrendingUp, Waves, Rocket,
  DollarSign, BarChart3, Brain, Play, Pause, RotateCcw, CheckCircle2, ScanText, Lock,
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

      <p className="text-xs text-muted-foreground">
        Demonstration view only. Calculation methods, model parameters and client datasets are not disclosed on this page.
      </p>
    </div>
  );
}
