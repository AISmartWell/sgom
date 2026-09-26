import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import EnhancedWellLog from "@/components/well-log/EnhancedWellLog";
import IllustrativeCompositeLog from "@/components/geophysical/IllustrativeCompositeLog";
import {
  Satellite, FolderOpen, Microscope, TrendingUp, Waves, Rocket,
  DollarSign, BarChart3, Brain, Play, Pause, RotateCcw, CheckCircle2, ScanText, Lock, FileBarChart, ChevronLeft, ChevronRight, SkipForward,
} from "lucide-react";
import satelliteView from "@/assets/satellite-field-view.jpg";
import paperLog from "@/assets/demo-paper-well-log.jpg";
import stage1Img from "@/assets/stage-1-field-scanning.jpg.asset.json";
import stage2Img from "@/assets/stage-2-data-classification.jpg.asset.json";
import stage3Img from "@/assets/stage-3-core-analysis.jpg.asset.json";
import stage4Img from "@/assets/stage-4-cumulative.jpg.asset.json";
import stage5Img from "@/assets/stage-5-seismic.jpg.asset.json";
import stage6Img from "@/assets/stage-6-spt.jpg.asset.json";
import stage7Img from "@/assets/stage-7-economics.jpg.asset.json";
import stage8Img from "@/assets/stage-8-geophysics.jpg.asset.json";
import stage9Img from "@/assets/stage-9-eor.jpg.asset.json";

const STAGE_IMAGES = [
  { url: stage1Img.url, alt: "Aerial satellite view of an oil field with pumpjacks and lease pads" },
  { url: stage2Img.url, alt: "Aged 1982 paper well log sheet being digitised on a desk" },
  { url: stage3Img.url, alt: "Rock core samples in a laboratory core box" },
  { url: stage4Img.url, alt: "Oil pumpjack silhouette at sunset" },
  { url: stage5Img.url, alt: "Geologist interpreting a colourful seismic section on a large screen" },
  { url: stage6Img.url, alt: "Cutaway render of slot perforations in a wellbore casing" },
  { url: stage7Img.url, alt: "Economics desk with cash-flow charts and calculators" },
  { url: stage8Img.url, alt: "Petrophysicist analysing well log curves on dual monitors" },
  { url: stage9Img.url, alt: "Modern oil and gas control room with a large dashboard wall" },
];

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
    output: ["Location reviewed", "Field: Kansas shallow carbonate play", "Surface infrastructure identified"],
  },
  {
    num: 2, title: "Data Classification", icon: FolderOpen, color: "text-cyan-400",
    input: "Scanned paper well log (1982) + completion report",
    action: "Vision OCR reads the paper sheet: header block, depth scale, curve tracks and perforation notes are recognised and typed automatically.",
    output: ["Document type: paper well log", "Header, depth range and curve names identified", "Records attached to the well card"],
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
    output: ["Horizons compared with well tops", "Structural setting reviewed", "Potential bypassed-pay zone highlighted"],
  },
  {
    num: 6, title: "SPT Projection", icon: Rocket, color: "text-green-400",
    input: "Interval candidates from Stages 3–5",
    action: "Slot Perforation Technology intervals are projected onto the reservoir section and screened against completion history.",
    output: ["Target intervals shortlisted", "Perforation history checked", "Treatment sequence proposed"],
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
    output: ["Clean vs. shaly intervals separated", "Pay flags produced", "Interpretation reviewed against available evidence"],
  },
  {
    num: 9, title: "EOR Optimization", icon: Brain, color: "text-pink-400",
    input: "All stage outputs",
    action: "The AI agent ranks restoration options for this well and writes a short, source-linked justification.",
    output: ["Illustrative option: SPT restoration", "Data gaps flagged", "Operator review required"],
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

const STEP_MS = 6500;
const BRAWNER_WELL_ID = "e688229c-cb05-4ee8-be8b-d4953e55060b";
const DEMO_ACCESS_HASH = "ffd51ce638836a998b8b514a4ee47c339a607b347c97bd7ce86f397c5695dceb";
const DEMO_ACCESS_HASH_SIMPLE = "e61a740707f6f3420e12f2913c6ef15c508f465cf4f245aeffe571d6e5f3e9c4";
const DEMO_ACCESS_KEY = "sgom-brawner-expertise-unlocked";

const Signal = ({ points, progress, tone = "primary" }: { points: number[]; progress: number; tone?: "primary" | "warning" }) => (
  <svg viewBox="0 0 320 104" className="w-full h-28" role="img" aria-label="Illustrative curve revealed during this stage">
    {[26, 52, 78].map((y) => <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="hsl(var(--border))" />)}
    <polyline
      points={points.map((p, i) => `${(i * 320) / (points.length - 1)},${p}`).join(" ")}
      fill="none" stroke={`hsl(var(--${tone}))`} strokeWidth="2.5" strokeLinejoin="round"
      strokeDasharray="500" strokeDashoffset={500 * (1 - progress)}
    />
    <line x1={progress * 320} x2={progress * 320} y1="0" y2="104" stroke="hsl(var(--foreground) / 0.5)" strokeDasharray="3 4" />
  </svg>
);

function StageVisual({ stage, progress }: { stage: number; progress: number }) {
  const visible = (threshold: number) => progress >= threshold;
  const reveal = (label: string, value: string, threshold: number) => (
    <div className={`flex items-center justify-between gap-3 border-b border-border/60 py-2 text-xs transition-opacity ${visible(threshold) ? "opacity-100" : "opacity-25"}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground text-right">{visible(threshold) ? value : "—"}</span>
    </div>
  );

  return (
    <div className="border-y border-border/60 bg-muted/10 px-4 py-4 md:px-6" aria-live="off">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-mono uppercase text-primary">Analysis view · Stage {stage}</span>
        <span className="text-[11px] text-muted-foreground">Illustrative walkthrough</span>
      </div>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)] items-center">
        <div className="min-w-0">
          {stage === 1 && <><div className="relative h-28 overflow-hidden border border-border bg-card">
            <img src={satelliteView} alt="Illustrative field imagery" className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-y-0 left-0 border-r-2 border-primary bg-primary/10" style={{ width: `${progress * 100}%` }} />
            {visible(0.62) && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-primary bg-background/90 px-2 py-1 text-xs font-mono text-primary">WELL PAD</span>}
          </div><p className="mt-2 text-xs text-muted-foreground">Scanning the lease surface for infrastructure</p></>}
          {stage === 2 && <><div className="relative h-28 overflow-hidden border border-border bg-card">
            <img src={paperLog} alt="Illustrative paper log" className="h-full w-full object-cover object-top opacity-70" />
            <div className="absolute inset-x-0 top-0 border-b-2 border-primary bg-primary/10" style={{ height: `${progress * 100}%` }} />
          </div><p className="mt-2 text-xs text-muted-foreground">Reading headers, depth scale and curve tracks</p></>}
          {stage === 3 && <><div className="space-y-3 py-2">
            {["Sample image", "Rock texture", "Reservoir quality"].map((label, i) => <div key={label} className="flex items-center gap-3 text-xs"><span className="w-28 shrink-0 text-muted-foreground">{label}</span><div className="h-2 flex-1 bg-muted"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, progress * 220 - i * 55))}%` }} /></div></div>)}
          </div><p className="mt-3 text-xs text-muted-foreground">Image features are cross-checked with the core description</p></>}
          {stage === 4 && <><Signal points={[12, 22, 19, 37, 34, 47, 52, 50, 68, 73, 78, 92]} progress={progress} /><p className="text-xs text-muted-foreground">Illustrative production decline over time →</p></>}
          {stage === 5 && <><Signal points={[50, 46, 62, 42, 26, 36, 61, 69, 55, 30, 39, 59, 72]} progress={progress} tone="warning" /><p className="text-xs text-muted-foreground">Comparing interpreted horizon to well tops →</p></>}
          {stage === 6 && <><div className="space-y-2 py-1">{["Existing completion", "Candidate interval A", "Candidate interval B"].map((name, i) => <div key={name} className={`flex items-center gap-3 border-l-2 px-3 py-2 text-xs ${i === 1 && visible(0.56) ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><span className="flex-1">{name}</span><span className="font-mono text-muted-foreground">{visible(0.25 + i * 0.22) ? (i === 0 ? "REFERENCE" : i === 1 ? "REVIEW" : "SCREEN") : "PENDING"}</span></div>)}</div></>}
          {stage === 7 && <><div className="space-y-3 py-2">{["Low case", "Base case", "High case"].map((name, i) => <div key={name} className="flex items-center gap-3 text-xs"><span className="w-20 shrink-0 text-muted-foreground">{name}</span><div className="h-4 flex-1 bg-muted"><div className={`h-full ${i === 1 ? "bg-primary" : "bg-warning/70"}`} style={{ width: `${visible(0.2 + i * 0.22) ? [36, 60, 82][i] : 0}%` }} /></div></div>)}</div><p className="text-xs text-muted-foreground">Scenario comparison; values depend on operating assumptions</p></>}
          {stage === 8 && <><Signal points={[86, 72, 77, 45, 30, 43, 69, 82, 67, 34, 24, 40, 75, 88]} progress={progress} /><p className="text-xs text-muted-foreground">Interpreting log response along the depth track →</p></>}
          {stage === 9 && <><div className="space-y-2 py-1">{["SPT restoration", "Conventional workover", "Further data collection"].map((name, i) => <div key={name} className={`flex items-center justify-between border-l-2 px-3 py-2 text-xs ${i === 0 && visible(0.7) ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><span>{name}</span><span className="font-mono text-muted-foreground">{visible(0.3 + i * 0.2) ? (i === 0 ? "REVIEW" : "COMPARE") : "PENDING"}</span></div>)}</div></>}
        </div>
        <div className="min-w-0 border-t border-border/60 pt-2 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          {stage === 1 && <>{reveal("Surface image", "Loaded", 0.15)}{reveal("Pad candidate", "Located", 0.62)}{reveal("Registry match", "To verify", 0.9)}</>}
          {stage === 2 && <>{reveal("Document", "Paper well log", 0.18)}{reveal("Depth index", "Detected", 0.52)}{reveal("Curves", "Ready to review", 0.85)}</>}
          {stage === 3 && <>{reveal("Sample", "Core photograph", 0.2)}{reveal("Texture", "Carbonate / sand", 0.55)}{reveal("Validation", "Report comparison", 0.85)}</>}
          {stage === 4 && <>{reveal("Input", "Monthly history", 0.2)}{reveal("Trend", "Declining", 0.55)}{reveal("Next step", "Estimate remaining life", 0.85)}</>}
          {stage === 5 && <>{reveal("Input", "Seismic section", 0.2)}{reveal("Horizons", "Compared", 0.55)}{reveal("Uncertainty", "Interpretation-dependent", 0.85)}</>}
          {stage === 6 && <>{reveal("Intervals", "Screened", 0.2)}{reveal("Completions", "Cross-checked", 0.55)}{reveal("Target", "Operator review", 0.85)}</>}
          {stage === 7 && <>{reveal("Cost", "Scenario input", 0.2)}{reveal("Response", "Range modeled", 0.55)}{reveal("Decision", "Compare economics", 0.85)}</>}
          {stage === 8 && <>{reveal("Curves", "GR / resistivity", 0.2)}{reveal("Intervals", "Pay / water flags", 0.55)}{reveal("Detailed log", "Shown below", 0.85)}</>}
          {stage === 9 && <>{reveal("Options", "Compared", 0.2)}{reveal("Candidate", "SPT for review", 0.55)}{reveal("Conclusion", "Shown below", 0.85)}</>}
        </div>
      </div>
    </div>
  );
}

export default function BrawnerExpertiseDemo({ standalone = false }: { standalone?: boolean }) {
  const [unlocked, setUnlocked] = useState(() => !standalone || sessionStorage.getItem(DEMO_ACCESS_KEY) === "1");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState(false);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(() => !standalone && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [elapsed, setElapsed] = useState(0);
  const stage = STAGES[active];

  useEffect(() => {
    if (!playing || !unlocked) return;
    const timer = window.setInterval(() => setElapsed((ms) => Math.min(STEP_MS, ms + 80)), 80);
    return () => window.clearInterval(timer);
  }, [playing, unlocked]);
  useEffect(() => {
    if (!playing || elapsed < STEP_MS) return;
    if (active === STAGES.length - 1) { setPlaying(false); return; }
    setActive((a) => a + 1);
    setElapsed(0);
  }, [elapsed, active, playing]);

  const selectStage = (index: number) => { setActive(index); setElapsed(STEP_MS); setPlaying(false); };
  const stageProgress = elapsed / STEP_MS;
  const progress = ((active + stageProgress) / STAGES.length) * 100;
  const Icon = stage.icon;

  const unlockDemo = async () => {
    const normalizedCode = accessCode.trim().normalize("NFKC");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizedCode));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    if (hash === DEMO_ACCESS_HASH || hash === DEMO_ACCESS_HASH_SIMPLE) {
      sessionStorage.setItem(DEMO_ACCESS_KEY, "1");
      setUnlocked(true);
    } else {
      setAccessError(true);
      setAccessCode("");
    }
  };

  if (!unlocked) return <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
    <div className="w-full max-w-sm space-y-4 border border-border bg-card p-7 text-center">
      <Lock className="mx-auto h-6 w-6 text-primary" />
      <h1 className="text-xl font-semibold">Brawner 10-15 · Private demo</h1>
      <p className="text-sm text-muted-foreground">Enter your access code to view the nine-stage demonstration.</p>
      <form onSubmit={(event) => { event.preventDefault(); void unlockDemo(); }} className="space-y-3">
        <label className="block text-left text-xs text-muted-foreground" htmlFor="demo-access-code">Access code</label>
        <input id="demo-access-code" type="password" autoComplete="off" autoFocus maxLength={100} value={accessCode} onChange={(event) => { setAccessCode(event.target.value); setAccessError(false); }} className="w-full rounded border border-border bg-background px-3 py-2 text-foreground" />
        {accessError && <p role="alert" className="text-sm text-destructive">Wrong code — please try again.</p>}
        <Button type="submit" className="w-full">Unlock demo</Button>
      </form>
      <p className="text-xs text-muted-foreground">SGOM · AI Smart Well Inc.</p>
    </div>
  </main>;

  return (
    <main className={standalone ? "min-h-screen bg-background text-foreground" : undefined}>
    <div className={standalone ? "mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" : "space-y-6"}>
      {standalone && <div className="flex items-center justify-between border-b border-border pb-5">
        <span className="text-xl font-bold text-primary">SGOM</span>
        <span className="text-xs font-mono uppercase text-muted-foreground">Brawner 10-15 · Demonstration</span>
      </div>}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">Interactive Demo</Badge>
            <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" /> No proprietary methods shown</Badge>
          </div>
          <h1 className="text-2xl font-bold">Geophysical Expertise — Brawner 10-15</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            End-to-end walkthrough: from a satellite view of the lease to a paper well log, and through all nine
            analysis stages of the SGOM pipeline. Illustrative demo dataset.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={active === 0} onClick={() => selectStage(active - 1)} aria-label="Previous stage" title="Previous stage"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" size="sm" disabled={active === STAGES.length - 1} onClick={() => selectStage(active + 1)} aria-label="Next stage" title="Next stage"><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => selectStage(STAGES.length - 1)} title="Skip to conclusion"><SkipForward className="w-4 h-4 mr-2" />Result</Button>
          <Button variant="outline" size="sm" onClick={() => { setActive(0); setElapsed(0); setPlaying(true); }}>
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
             <CardDescription>Illustrative lease surface and access infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
             <img src={satelliteView} alt="Illustrative satellite-style view of a lease area" loading="lazy"
              className="rounded-md border border-border w-full h-52 object-cover" />
          </CardContent>
        </Card>
        <Card className={active === 1 ? "border-primary/60" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ScanText className="w-4 h-4 text-cyan-400" /> Source B — Paper well log
            </CardTitle>
             <CardDescription>Illustrative legacy paper well log</CardDescription>
          </CardHeader>
          <CardContent>
             <img src={paperLog} alt="Illustrative legacy paper well log" loading="lazy"
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
                 <Button
                  key={s.num}
                   variant="outline"
                   aria-label={`Stage ${s.num}: ${s.title}`}
                   aria-current={cur ? "step" : undefined}
                   onClick={() => selectStage(i)}
                   className={`h-auto min-h-20 min-w-0 flex-col items-start justify-start whitespace-normal rounded border p-2 text-left transition-colors ${
                    cur ? "border-primary bg-primary/10" : done ? "border-border bg-muted/40" : "border-border/60 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <S className={`w-3.5 h-3.5 ${s.color}`} />}
                    <span className="text-[10px] font-mono text-muted-foreground">ST {s.num}</span>
                  </div>
                  <div className="text-[11px] leading-tight font-medium">{s.title}</div>
                 </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active stage detail */}
      <Card className="border-primary/40 overflow-hidden">
        <div className="relative h-56 md:h-72">
          {STAGE_IMAGES.map((img, i) => (
            <img
              key={img.url}
              src={img.url}
              alt={img.alt}
              loading="lazy"
              width={1344}
              height={768}
              onError={(event) => {
                const fallback = i === 1 ? paperLog : satelliteView;
                if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <Icon className={`w-5 h-5 ${stage.color}`} />
            <span className="text-sm font-semibold drop-shadow">Stage {stage.num} · {stage.title}</span>
          </div>
        </div>
        <CardHeader>
          <CardDescription>{stage.action}</CardDescription>
        </CardHeader>
        <StageVisual stage={stage.num} progress={stageProgress} />
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Input</p>
            <p className="text-sm">{stage.input}</p>
          </div>
          <div className="md:col-span-2 rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Expected output</p>
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

      {/* Composite log with bypassed-pay interpretation (platform design; illustrative curves in standalone) */}
      <Card className="border-rose-500/40">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30">Stage 8 · Raw Curves</Badge>
            <Badge variant="outline" className="text-[10px]">{standalone ? "Illustrative curves" : "Data source shown in log"}</Badge>
            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30">Bypassed Pay Screening</Badge>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" /> BRAWNER 10-15 — Composite Well Log
          </CardTitle>
          <CardDescription>
            {standalone
              ? "Illustrative curve responses and interval flags show the interpretation workflow. This public demonstration does not access measured well data."
              : "Digitised paper-log curves with fluid, perforation and correlation tracks. Check the data-source badge in the log: fallback curves and perforations may be synthetic."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedWellLog
              wellId={BRAWNER_WELL_ID}
              wellName="BRAWNER 10-15"
              formation="ARBUCKLE"
              totalDepth={5225}
              defaultExpanded
            />
        </CardContent>
      </Card>}

      {/* Final report */}
      <Card className="border-emerald-500/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Stage 8 · Step 10</Badge>
            <Badge variant="outline" className="text-[10px]">Illustrative Summary</Badge>
          </div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-emerald-400" /> Final Report — BRAWNER 10-15
          </CardTitle>
          <CardDescription>
            {standalone ? "Illustrative scenario only. The figures below are not calculated from the schematic curves above or measured Brawner records." : "Illustrative summary for the walkthrough. Check the composite log above for its current data source and interpretation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
                {(standalone ? [
                  "Example: review potential net pay after validating the original log and completions.",
                  "Example: a 42 ft bypassed interval would require verification against measured perforation records.",
                  "Confirm shale continuity before planning any staged treatment.",
                  "Screen SPT only after measured reservoir and production data are available.",
                  "The operator must validate any candidate before an EOR decision.",
                ] : REPORT_RECOMMENDATIONS).map((r) => (
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
              <p className="text-base font-semibold">SPT candidate for operator review</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground">Illustrative conclusion · verify against measured data</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Demonstration view only. Stage animations and summary figures are illustrative, not the output of a live nine-stage run. {standalone ? "The schematic log does not use measured well records." : "The composite log indicates whether measured data is available."} Calculation methods and client datasets are not disclosed.
      </p>
    </div>
    </main>
  );
}
