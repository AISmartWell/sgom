import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Target, Database, Layers, Cpu, ShieldCheck, FileSpreadsheet,
  CheckCircle2, AlertTriangle, TrendingDown, Globe, Gauge, Activity, FileText, Download, Waves,
  DollarSign, Users, Server, Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

// ─── Funnel 500 → 4 ────────────────────────────────────────────────────────────
const FUNNEL = [
  { stage: "Initial Set",          n: 500, kept: 500, drop: 0,   reason: "Client-provided well list (Ghawar / Khurais / Khuff)",                color: "#1A9FFF" },
  { stage: "Stage 1 — Geology",    n: 500, kept: 312, drop: 188, reason: "Formation outside Arab-D / Hanifa / Khuff scope",                     color: "#3b82f6" },
  { stage: "Stage 2 — History",    n: 312, kept: 184, drop: 128, reason: "<24 mo production history or gaps >6 mo",                             color: "#22d3ee" },
  { stage: "Stage 3 — Reserves",   n: 184, kept:  96, drop:  88, reason: "Remaining IOIP <1.2 MMbbl or Arps EUR uncertainty >40%",              color: "#34d399" },
  { stage: "Stage 4 — Technical",  n:  96, kept:  42, drop:  54, reason: "Depth, Water Cut 20–60%, last stim ≥3y, casing integrity",            color: "#facc15" },
  { stage: "Stage 5 — Economics",  n:  42, kept:  14, drop:  28, reason: "IRR <25% or Payback >18 mo @ $70/bbl Brent",                          color: "#fb923c" },
  { stage: "Final SPT-Ready",      n:  14, kept:   4, drop:  10, reason: "MCDA ≥75, full evidence pack, reconciliation Δ <15%",                 color: "#22c55e" },
];

// ─── Candidate wells (illustrative Saudi context) ──────────────────────────────
const CANDIDATES = [
  { id: "GHW-A-184", field: "Ghawar (Ain Dar)",  formation: "Arab-D",   depth: 7250, wc: 38, gor: 612, ip: 312, mcda: 88, irr: 41, payback: 11, score: "PROCEED",     delta: 6.2 },
  { id: "GHW-S-072", field: "Ghawar (Shedgum)",  formation: "Arab-D",   depth: 6980, wc: 44, gor: 705, ip: 245, mcda: 82, irr: 34, payback: 13, score: "PROCEED",     delta: 8.4 },
  { id: "KHR-N-031", field: "Khurais",           formation: "Arab-D",   depth: 7510, wc: 29, gor: 540, ip: 388, mcda: 79, irr: 31, payback: 14, score: "PROCEED",     delta: 11.0 },
  { id: "BRR-K-118", field: "Berri",             formation: "Hanifa",   depth: 8120, wc: 51, gor: 820, ip: 198, mcda: 76, irr: 27, payback: 16, score: "CONDITIONAL", delta: 14.7 },
];

// ─── Data Reconciliation (AI vs Client) ────────────────────────────────────────
const RECONCILIATION = [
  { metric: "Porosity (avg)",      ai: "18.2 %",   client: "17.6 %",   delta: "+3.4 %",  status: "match" },
  { metric: "Permeability (Timur)",ai: "142 mD",   client: "128 mD",   delta: "+10.9 %", status: "match" },
  { metric: "Sw (Archie)",         ai: "0.29",     client: "0.32",     delta: "−9.4 %",  status: "match" },
  { metric: "Net Pay",             ai: "84 ft",    client: "79 ft",    delta: "+6.3 %",  status: "match" },
  { metric: "OOIP (per well)",     ai: "4.8 MMbbl",client: "5.1 MMbbl",delta: "−5.9 %",  status: "match" },
  { metric: "EUR (Arps b=0.5)",    ai: "1.92 MMbbl",client: "1.74 MMbbl",delta: "+10.3 %",status: "review" },
];

// ─── Formations to extend in FORMATION_DB ──────────────────────────────────────
const FORMATIONS = [
  { name: "Arab-D",  lith: "Carbonate (Grainstone)", depthFt: "6,500–7,800",  porAvg: "18–22 %", permMd: "50–500", notes: "Super-K channels, anisotropy kv/kh ≈ 0.05" },
  { name: "Hanifa",  lith: "Carbonate (Mudstone-Wkst)", depthFt: "8,000–8,800", porAvg: "10–14 %", permMd: "5–60",   notes: "Source + reservoir, fractured intervals" },
  { name: "Khuff-B", lith: "Dolomite",               depthFt: "10,500–11,500", porAvg: "8–12 %",  permMd: "1–30",   notes: "Gas/condensate, H₂S risk" },
  { name: "Marrat",  lith: "Limestone",              depthFt: "9,200–10,000",  porAvg: "9–13 %",  permMd: "2–40",   notes: "Tight, requires re-fracturing" },
];

// ─── Deliverables ──────────────────────────────────────────────────────────────
const DELIVERABLES = [
  { name: "Per-Well Passport (×500)",     fmt: "PDF",   size: "~12 pp each", desc: "9-stage analysis, evidence, confidence, recommendation" },
  { name: "Master Funnel Report",         fmt: "PDF",   size: "~40 pp",      desc: "500 → 4 breakdown, field maps, MCDA matrix" },
  { name: "Full Dataset",                 fmt: "XLSX",  size: "≈8 MB",       desc: "All 500 wells: inputs, outputs, scores, deltas" },
  { name: "Reconciliation Workbook",      fmt: "XLSX",  size: "≈3 MB",       desc: "AI vs Aramco data, per-parameter Δ, traffic-light" },
  { name: "Final 4 SPT-Ready Dossiers",   fmt: "PDF+CSV", size: "~25 pp each", desc: "EUR + economics + risk + audit trail" },
  { name: "Methodology & Audit Log",      fmt: "PDF",   size: "~30 pp",      desc: "Prompts, models, parameters, version hashes" },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AramcoPilot() {
  const [tab, setTab] = useState("overview");
  const totalDays = 28;
  const elapsed = 0;

  const funnelChart = useMemo(
    () => FUNNEL.map((f) => ({ name: f.stage.replace(/Stage \d+ — /, ""), kept: f.kept, color: f.color })),
    []
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Pilot Brief</Badge>
              <Badge className="bg-primary/20 text-primary border-primary/40">Saudi Aramco</Badge>
              <Badge variant="outline" className="text-xs">Analysis-Only Engagement</Badge>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Aramco Pilot — 500 → 4 SPT-Ready
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              End-to-end screening of 500 client wells across Ghawar / Khurais / Berri using the 9-Stage AI Pipeline.
              Deliverable: ranked shortlist of 4 SPT-ready candidates with reconciled evidence, NPV/IRR/payback and
              audit-grade reports. <span className="text-foreground font-medium">Operational execution remains with the operator.</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 min-w-[220px]">
            <Button size="sm" className="gap-2"><Download className="h-4 w-4" /> Download Pilot Brief (PDF)</Button>
            <Button size="sm" variant="outline" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Sample Funnel (XLSX)</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[
            { l: "Wells In",        v: "500",          c: "text-primary" },
            { l: "SPT-Ready Out",   v: "4",            c: "text-success" },
            { l: "Timeline",        v: "3–4 weeks",    c: "text-cyan-400" },
            { l: "Price / Well",    v: "$50–150",      c: "text-amber-400" },
            { l: "Engagement",      v: "Fee-for-Analysis", c: "text-violet-400" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-border/50 bg-background/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{k.l}</p>
              <p className={`text-lg font-bold ${k.c}`}>{k.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 flex gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-amber-300">Analysis-only scope.</span>{" "}
            AI Smart Well delivers screening, ranking and economic forecasts. Field operations, perforation design and
            stimulation are the responsibility of the operator. All results reconciled against client data and labeled
            <Badge variant="outline" className="text-[10px] mx-1">REAL</Badge> /
            <Badge variant="outline" className="text-[10px] mx-1">DERIVED</Badge> /
            <Badge variant="outline" className="text-[10px] mx-1">FORMATION-BASED</Badge>.
          </p>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stages">9 Stages</TabsTrigger>
          <TabsTrigger value="funnel">Funnel 500→4</TabsTrigger>
          <TabsTrigger value="bypassed">Bypassed</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="economics">Economics</TabsTrigger>
          <TabsTrigger value="data">Data Inputs</TabsTrigger>
          <TabsTrigger value="tech">Tech & Security</TabsTrigger>
        </TabsList>

        {/* ── 9 STAGES ── */}
        <TabsContent value="stages" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                9-Stage AI Pipeline — applied per well to all 500 Aramco assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  n: 1, name: "Field Scanning", icon: "🛰️",
                  inp: "Aramco well master list (500 wells: Ghawar / Khurais / Berri), lat/long, operator metadata",
                  proc: "Geocode + plot on map, regional KPI rollup, formation auto-tag against FORMATION_DB (Arab-D, Hanifa, Khuff-B, Marrat)",
                  out: "Interactive field map, 500-well registry with formation tags",
                  cut: "Formations outside Arab-D / Hanifa / Khuff scope → drop",
                  kept: "500 → 500", color: "border-blue-500/40",
                },
                {
                  n: 2, name: "Data Classification", icon: "📂",
                  inp: "CSV passports + monthly production history (≥24 mo)",
                  proc: "Data Quality Score per category (Identity / Location / Geology / Production / Operations), AI auto-fill from neighbour wells",
                  out: "DQ-tagged dataset, missing-field heatmap, auto-fill suggestions with confidence",
                  cut: "<24 mo history or gaps >6 mo → drop",
                  kept: "500 → 312", color: "border-emerald-500/40",
                },
                {
                  n: 3, name: "Core Analysis (CV)", icon: "🔬",
                  inp: "Core photos (optional, where Aramco provides) + formation defaults",
                  proc: "Gemini Vision: lithology, porosity, fractures, mineralogy, reservoir quality; reconciled vs petrophysics",
                  out: "Per-well core report (6 sections) + Deviation Report vs FORMATION_DB",
                  cut: "Quality flag only — does not drop wells",
                  kept: "312 → 312", color: "border-purple-500/40",
                },
                {
                  n: 4, name: "Cumulative Analysis", icon: "📈",
                  inp: "Production history + reservoir properties",
                  proc: "Arps DCA (b=0.5 for carbonate), IOIP / Remaining IOIP, Economic Limit, EUR uncertainty",
                  out: "Decline curves, EUR estimate, remaining-reserves map",
                  cut: "Remaining IOIP <1.2 MMbbl or EUR uncertainty >40% → drop",
                  kept: "312 → 184", color: "border-cyan-500/40",
                },
                {
                  n: 5, name: "Seismic Interpretation", icon: "🌊",
                  inp: "2D/3D seismic snapshots (where available), horizon picks",
                  proc: "CV horizon tracking, fault detection, anomaly map, bypassed-reserves overlay",
                  out: "Seismic QC overlay, structural confidence per well",
                  cut: "Confidence flag — feeds MCDA, no hard drop",
                  kept: "184 → 184", color: "border-sky-500/40",
                },
                {
                  n: 6, name: "SPT Projection", icon: "🎯",
                  inp: "Reservoir + production + completion state",
                  proc: "MCDA (6 criteria): WC, GOR, depth, formation match, last stim age, casing integrity; SPT candidacy 0–100",
                  out: "SPT score per well, radar profile, projected Δ-rate (+bbl/d)",
                  cut: "WC 20–60%, last stim ≥3y, MCDA ≥75 → keep",
                  kept: "184 → 96 → 42", color: "border-amber-500/40",
                },
                {
                  n: 7, name: "Economic Analysis", icon: "💰",
                  inp: "Δ-rate forecast, OPEX, SPT job cost, Brent strip",
                  proc: "Monte Carlo NPV/IRR/payback @ $70/bbl, QAE sensitivity, tornado",
                  out: "Per-well economic dossier with P10/P50/P90",
                  cut: "IRR <25% or Payback >18 mo → drop",
                  kept: "42 → 14", color: "border-orange-500/40",
                },
                {
                  n: 8, name: "Geophysical Expertise", icon: "📊",
                  inp: "LAS curves (GR, RES, NPHI, RHOB, PEF, DT) where provided",
                  proc: "Schlumberger workflow: Vsh (Larionov), φ (D/N), Sw (Archie), k (Timur); pay-zone cutoffs per formation",
                  out: "Net-pay tracks, φ/Sw/k logs, evidence pack with LAS line refs",
                  cut: "|Δ| vs Aramco petrophysicist >15% → manual review, not auto-drop",
                  kept: "14 → 14 (validated)", color: "border-violet-500/40",
                },
                {
                  n: 9, name: "EOR Optimization", icon: "⚙️",
                  inp: "All prior stage outputs + SPT patent (US 8,863,823) constraints",
                  proc: "Final EOR recommendation: SPT prioritised; alternatives (acid, refrac, water-shutoff) ranked",
                  out: "Final 4 SPT-Ready dossiers + audit trail + reconciliation Δ <15%",
                  cut: "Full evidence pack required → final shortlist",
                  kept: "14 → 4 SPT-Ready", color: "border-green-500/40",
                },
              ].map((s) => (
                <div key={s.n} className={`rounded-lg border ${s.color} bg-background/40 p-4`}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.icon}</span>
                      <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">Stage {s.n}</Badge>
                      <h3 className="font-semibold text-sm">{s.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Wells: {s.kept}</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Input:</span> {s.inp}</div>
                    <div><span className="text-muted-foreground">Process:</span> {s.proc}</div>
                    <div><span className="text-muted-foreground">Output:</span> {s.out}</div>
                    <div><span className="text-muted-foreground">Cutoff:</span> <span className="text-amber-300">{s.cut}</span></div>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-success/40 bg-success/5 p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <p className="text-xs">
                  <span className="font-semibold text-success">Final: 500 → 4 SPT-Ready</span> — every well carries a full
                  9-stage audit trail (REAL / DERIVED / FORMATION-BASED tags), reconciled against Aramco reference data with
                  |Δ| &lt; 15% threshold.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary"/>Objective</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Identify the top 4 candidates out of 500 with the highest probability of incremental recovery via SPT (US 8,863,823).</p>
                <p>Validate methodology on Saudi carbonate reservoirs before scale-out.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-primary"/>Scope</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>9-Stage AI pipeline per well, MCDA ranking, NPV/IRR/payback, EUR (Arps b=0.5), reconciliation vs Aramco data.</p>
                <p>Formations: Arab-D, Hanifa, Khuff-B, Marrat.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/>Out of Scope</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Field operations, perforation execution, equipment procurement, downhole interventions.</p>
                <p>HSE and regulatory clearance remain with operator.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Timeline (28 days)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { w: "Week 1", t: "Data ingest, formation DB extension (Arab-D, Hanifa, Khuff-B, Marrat), unit converter (SI/Imperial)", d: 7 },
                { w: "Week 2", t: "Batch run 500 wells (Stages 1–4): geology, history, reserves, MCDA pre-rank", d: 7 },
                { w: "Week 3", t: "Deep analysis on top 50 (Stages 5–9): seismic, geophysics, economics, EOR", d: 7 },
                { w: "Week 4", t: "Reconciliation, final 4 dossiers, master report, workshop with Aramco team", d: 7 },
              ].map((x, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="font-semibold">{x.w}</span><span className="text-muted-foreground">{x.t}</span></div>
                  <Progress value={(elapsed >= (i + 1) * 7 ? 100 : elapsed > i * 7 ? ((elapsed - i * 7) / 7) * 100 : 0)} className="h-1.5" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Total: {totalDays} days · Elapsed: {elapsed} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary"/>Deliverables</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Artifact</TableHead><TableHead>Format</TableHead><TableHead>Size</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                <TableBody>
                  {DELIVERABLES.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{d.fmt}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.size}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── FUNNEL ── */}
        <TabsContent value="funnel" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-primary"/>Selection Funnel — 500 wells → 4 SPT-Ready</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={funnelChart} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Bar dataKey="kept" radius={[6, 6, 0, 0]}>
                      {funnelChart.map((d, i) => (<Cell key={i} fill={d.color} />))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <Separator className="my-4" />
              <Table>
                <TableHeader><TableRow><TableHead>Stage</TableHead><TableHead>In</TableHead><TableHead>Kept</TableHead><TableHead>Rejected</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
                <TableBody>
                  {FUNNEL.map((f) => (
                    <TableRow key={f.stage}>
                      <TableCell className="font-medium text-sm">{f.stage}</TableCell>
                      <TableCell>{f.n}</TableCell>
                      <TableCell className="text-success font-semibold">{f.kept}</TableCell>
                      <TableCell className="text-muted-foreground">−{f.drop}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{f.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BYPASSED RESERVES ── */}
        <TabsContent value="bypassed" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Bypassed Reserves Recovery — Low-Productivity Wells (Stage 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Every well with Water Cut &gt;70% or oil rate &lt;10 BPD is auto-routed through Stage 5
                (Seismic Reinterpretation). CV detects bright spots, AVO Class III, flat spots at OWC and
                re-classifies lithology to surface pay zones missed by the original completion.
              </p>

              <div className="grid md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-2xl font-bold text-primary">~180</p>
                  <p className="text-[10px] text-muted-foreground">Low-productivity wells<br/>(of 500 screened)</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                  <p className="text-2xl font-bold text-success">~450</p>
                  <p className="text-[10px] text-muted-foreground">Bypassed zones detected<br/>(avg 2.5 per well)</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                  <p className="text-2xl font-bold text-warning">+2.5–4.2</p>
                  <p className="text-[10px] text-muted-foreground">MMBOE additional<br/>recovery potential</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                  <p className="text-2xl font-bold text-destructive">20–40%</p>
                  <p className="text-[10px] text-muted-foreground">Original reserves<br/>missed (industry avg)</p>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Detection Pipeline (per low-productivity well)
                </p>
                <div className="grid md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 rounded border border-border/30">
                    <p className="font-semibold text-primary mb-1">1. CV Anomaly Scan</p>
                    <p className="text-muted-foreground text-[11px]">
                      Bright Spot, AVO Class III, Flat Spot at OWC — auto-detected on seismic snapshots.
                    </p>
                  </div>
                  <div className="p-2 rounded border border-border/30">
                    <p className="font-semibold text-primary mb-1">2. Lithology Re-classification</p>
                    <p className="text-muted-foreground text-[11px]">
                      Sand / Silt / Shale / Carbonate split, cross-checked with LAS Vsh (Larionov).
                    </p>
                  </div>
                  <div className="p-2 rounded border border-border/30">
                    <p className="font-semibold text-primary mb-1">3. Zone Prioritization</p>
                    <p className="text-muted-foreground text-[11px]">
                      HIGH / MEDIUM / LOW potential with MBOE estimate &amp; confidence; feeds Stage 6 (SPT).
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-background/40 p-4 space-y-2">
                <p className="text-xs font-semibold">Example output per well</p>
                <div className="space-y-1.5 text-[11px]">
                  {[
                    { f: "Arab-D upper", d: "6,800–7,050 ft", lith: "Tight Carbonate", pot: "HIGH",   mboe: "14–22", conf: 86, ind: "Bright Spot + AVO III" },
                    { f: "Hanifa",       d: "8,120–8,340 ft", lith: "Carbonate",       pot: "MEDIUM", mboe: "7–11",  conf: 71, ind: "Dim Spot anomaly" },
                    { f: "Khuff-B",      d: "9,450–9,610 ft", lith: "Dolomite",        pot: "LOW",    mboe: "3–6",   conf: 58, ind: "Flat Spot @ OWC" },
                  ].map((z, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-1.5 rounded bg-muted/20 border border-border/20">
                      <span className="font-medium w-24">{z.f}</span>
                      <span className="text-muted-foreground w-32">{z.d}</span>
                      <span className="text-muted-foreground w-28">{z.lith}</span>
                      <Badge className={`text-[9px] ${z.pot==="HIGH"?"bg-success/15 text-success border-success/30":z.pot==="MEDIUM"?"bg-warning/15 text-warning border-warning/30":"bg-muted text-muted-foreground border-border"}`}>{z.pot}</Badge>
                      <span className="text-primary font-semibold w-20 text-right">{z.mboe} MBOE</span>
                      <span className="text-muted-foreground text-[10px] w-32 text-right">{z.ind}</span>
                      <span className="text-muted-foreground w-10 text-right">{z.conf}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-success/40 bg-success/5 p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <p className="text-xs">
                  <span className="font-semibold text-success">Outcome:</span> bypassed zones are ranked
                  and fed directly into Stage 6 (SPT Projection) — the patented Slot Perforation Technology
                  (US&nbsp;8,863,823) targets missed pay without re-drilling, converting dead wells into
                  revenue with payback typically &lt;9&nbsp;months.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CANDIDATES ── */}
        <TabsContent value="candidates" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success"/>Final SPT-Ready Shortlist (illustrative)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Well ID</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Depth, ft</TableHead>
                    <TableHead>WC, %</TableHead>
                    <TableHead>GOR, scf/bbl</TableHead>
                    <TableHead>IP, bbl/d</TableHead>
                    <TableHead>MCDA</TableHead>
                    <TableHead>IRR, %</TableHead>
                    <TableHead>Payback, mo</TableHead>
                    <TableHead>Δ vs Aramco</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CANDIDATES.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="text-xs">{c.field}</TableCell>
                      <TableCell className="text-xs">{c.formation}</TableCell>
                      <TableCell>{c.depth.toLocaleString()}</TableCell>
                      <TableCell>{c.wc}</TableCell>
                      <TableCell>{c.gor}</TableCell>
                      <TableCell>{c.ip}</TableCell>
                      <TableCell className="font-semibold text-primary">{c.mcda}</TableCell>
                      <TableCell className="text-success">{c.irr}</TableCell>
                      <TableCell>{c.payback}</TableCell>
                      <TableCell className="text-xs">{c.delta}%</TableCell>
                      <TableCell>
                        <Badge className={c.score === "PROCEED" ? "bg-success/20 text-success border-success/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40"}>
                          {c.score}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                Note: figures are projected from the 500-well screening with FORMATION-BASED defaults until live LAS / production data from Aramco is loaded.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RECONCILIATION ── */}
        <TabsContent value="reconciliation" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4 text-primary"/>Data Reconciliation — AI vs Aramco</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>AI Smart Well</TableHead><TableHead>Aramco Reference</TableHead><TableHead>Δ</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {RECONCILIATION.map((r) => (
                    <TableRow key={r.metric}>
                      <TableCell className="font-medium text-sm">{r.metric}</TableCell>
                      <TableCell className="text-primary">{r.ai}</TableCell>
                      <TableCell>{r.client}</TableCell>
                      <TableCell className={Math.abs(parseFloat(r.delta)) < 10 ? "text-success" : "text-amber-400"}>{r.delta}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.status === "match" ? "border-success/40 text-success" : "border-amber-500/40 text-amber-300"}>
                          {r.status === "match" ? "✓ Match (<15%)" : "⚠ Review"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                Reconciliation threshold: |Δ| &lt; 15% → match. Wells exceeding the threshold are flagged for manual review by petrophysicist before inclusion in the final shortlist.
              </p>
            </CardContent>
          </Card>
        </TabsContent>




        {/* ── DATA INPUTS ── */}
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4 text-primary"/>Required Data Package (from Aramco)</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Mandatory</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                  <li>CSV header: <code className="bg-muted px-1 rounded">api_number, well_name, lat, long, depth_ft, formation, spud_date, current_oil_bpd, water_cut, gas_mcf</code></li>
                  <li>Monthly production history ≥ 24 months (oil/water/gas, days_on)</li>
                  <li>Field / reservoir identifier (Ghawar zone, Khurais block, Berri segment)</li>
                </ul>
              </div>
              <Separator />
              <div>
                <p className="font-semibold mb-1">Optional (improves confidence)</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                  <li>LAS logs: GR, RES (deep/shallow), NPHI, RHOB, PEF, DT</li>
                  <li>Perforation intervals + last stimulation date</li>
                  <li>Core photographs (high-res, with depth tag) — feeds CV pipeline</li>
                  <li>Seismic 2D/3D snapshots (PNG/JPEG) for horizon QC</li>
                  <li>PVT report (Bo, Rs, μo)</li>
                </ul>
              </div>
              <Separator />
              <div>
                <p className="font-semibold mb-1">Formation DB Extension (delivered Week 1)</p>
                <Table>
                  <TableHeader><TableRow><TableHead>Formation</TableHead><TableHead>Lithology</TableHead><TableHead>Depth, ft</TableHead><TableHead>φ avg</TableHead><TableHead>k, mD</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {FORMATIONS.map((f) => (
                      <TableRow key={f.name}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell className="text-xs">{f.lith}</TableCell>
                        <TableCell className="text-xs">{f.depthFt}</TableCell>
                        <TableCell className="text-xs">{f.porAvg}</TableCell>
                        <TableCell className="text-xs">{f.permMd}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TECH & SECURITY ── */}
        <TabsContent value="tech" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4 text-primary"/>Compute Architecture</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><span className="text-foreground font-semibold">Light orchestration:</span> Lovable Cloud edge functions (Deno) — 9-stage pipeline coordinator.</p>
                <p><span className="text-foreground font-semibold">Heavy ML / batch 500:</span> AWS GPU workers (NVIDIA NIM, Gemini 2.5 Pro) — batched 10 wells per job.</p>
                <p><span className="text-foreground font-semibold">CV (core / seismic):</span> NVIDIA Cosmos — Predict, Transfer, Reason tools.</p>
                <p><span className="text-foreground font-semibold">Petrophysics:</span> Schlumberger workflow (Archie, Timur k = 0.136·φ⁴·⁴/Swirr²) with carbonate calibration for Arab-D super-K.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/>Security & Compliance</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p><span className="text-foreground font-semibold">Deployment:</span> on-prem / Aramco VPC option available (AWS PrivateLink).</p>
                <p><span className="text-foreground font-semibold">Isolation:</span> multi-tenant RLS on every table via <code className="bg-muted px-1 rounded">company_id</code>.</p>
                <p><span className="text-foreground font-semibold">Audit:</span> every AI call logged with prompt hash + model version.</p>
                <p><span className="text-foreground font-semibold">NDA:</span> state-level NDA + data residency in KSA region.</p>
                <p><span className="text-foreground font-semibold">Export:</span> reports signed (SHA-256) for chain-of-custody.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-primary"/>Units & Localization</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Native: Imperial (ft, bbl, psi, °F) — platform standard.</p>
                <p>Export: SI toggle (m, m³, MPa, °C) — per Aramco preference.</p>
                <p>UI strictly English; reports bilingual EN/AR on request.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary"/>9-Stage Pipeline (per well)</CardTitle></CardHeader>
              <CardContent>
                <ol className="text-xs space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>Field Scan</li><li>Data Classification</li><li>Core Analysis (CV)</li>
                  <li>Cumulative / EUR (Arps b=0.5)</li><li>Seismic Reinterpretation</li>
                  <li>SPT Projection (MCDA)</li><li>Economic (NPV / IRR / Payback, Monte Carlo)</li>
                  <li>Geophysical (Timur, Archie)</li><li>EOR Optimization</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ECONOMICS — FULL TCO ── */}
        <TabsContent value="economics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Full TCO — what one well analysis actually costs us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground text-xs">
                Honest cost model. Includes US-level fully-loaded salaries (1.3× base for benefits/taxes),
                AWS GPU batch, data licenses, security/compliance, and 30% G&A overhead.
                Per-well cost depends entirely on annual volume — the same fixed cost base amortizes very differently at 500 vs 5,000 wells/yr.
              </p>

              {/* FTE TABLE */}
              <div>
                <p className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Annual FTE cost (fully loaded, US market)
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Headcount</TableHead>
                      <TableHead className="text-right">Base / yr</TableHead>
                      <TableHead className="text-right">Loaded (×1.3) / yr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { r: "Senior ML / AI Engineer",       h: 2, b: 220, l: 572 },
                      { r: "Full-stack Engineer",           h: 2, b: 180, l: 468 },
                      { r: "DevOps / MLOps",                h: 1, b: 200, l: 260 },
                      { r: "Senior Petrophysicist",         h: 1, b: 250, l: 325 },
                      { r: "Reservoir Engineer",            h: 1, b: 230, l: 299 },
                      { r: "Geologist",                     h: 1, b: 180, l: 234 },
                      { r: "QA Engineer",                   h: 1, b: 140, l: 182 },
                      { r: "Product Manager",               h: 1, b: 190, l: 247 },
                      { r: "Sales / Solutions Engineer",    h: 1, b: 200, l: 260 },
                    ].map((row) => (
                      <TableRow key={row.r}>
                        <TableCell className="text-xs">{row.r}</TableCell>
                        <TableCell className="text-right text-xs">{row.h}</TableCell>
                        <TableCell className="text-right text-xs">${row.b}k</TableCell>
                        <TableCell className="text-right text-xs font-semibold">${row.l}k</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-semibold text-xs">TOTAL FTE</TableCell>
                      <TableCell className="text-right font-semibold text-xs">11</TableCell>
                      <TableCell className="text-right text-xs">$1,890k</TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">$2,847k / yr</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* INFRA TABLE */}
              <div>
                <p className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Server className="h-3.5 w-3.5" /> Annual infrastructure, data & compliance
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">$ / yr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { i: "AWS GPU batch",        d: "H100/A100 on-demand + reserved for ML training & CV inference", c: 180 },
                      { i: "AWS storage & DB",     d: "S3, RDS Postgres, CloudWatch, backups, egress",                  c:  40 },
                      { i: "AI API gateway",       d: "NVIDIA NIM endpoints + Gemini 2.5 (LLM + Vision tokens)",        c:  60 },
                      { i: "Data licenses",        d: "IHS / Enverus / Drillinginfo, USGS premium, seismic cubes",      c: 250 },
                      { i: "SOC2 + security tools",d: "Datadog, Sentry, Vanta, pen-tests, audits",                       c:  80 },
                      { i: "Patents & legal",      d: "US 8,863,823 maintenance, NDAs, contracts, IP counsel",          c:  60 },
                      { i: "Office, insurance, marketing", d: "G&A baseline excluding overhead multiplier",             c: 120 },
                    ].map((row) => (
                      <TableRow key={row.i}>
                        <TableCell className="text-xs font-medium">{row.i}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.d}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">${row.c}k</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-semibold text-xs" colSpan={2}>TOTAL INFRA + G&A</TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">$790k / yr</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Fixed cost base = $2,847k FTE + $790k infra = <span className="text-foreground font-semibold">$3,637k / yr</span>.
                  Marginal per-well cost (GPU hours + LLM tokens + storage growth) ≈ <span className="text-foreground font-semibold">$20 / well</span>.
                </p>
              </div>

              <Separator />

              {/* MARGINAL BREAKDOWN — honest line items */}
              <div>
                <p className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5" /> True marginal cost per well — line-item breakdown
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line item</TableHead>
                      <TableHead>What it covers</TableHead>
                      <TableHead className="text-right">$ / well</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { i: "GPU compute",            d: "Stage 3 CV core photos + Stage 5 seismic CV + Stage 8 petrophysics ML — ~3.5 GPU-h H100 @ $4/h", c: "$14" },
                      { i: "LLM tokens (Gemini 2.5 + GPT-5)", d: "Stages 1, 2, 6, 7, 9 reasoning + QA double-check — ~1.2M tokens combined in+out", c: "$22" },
                      { i: "NVIDIA NIM inference",   d: "Cosmos Predict / Transfer / Reason endpoints for seismic and reservoir simulation", c: "$12" },
                      { i: "Metered data lookups",   d: "IHS / Enverus per-well API calls (formation tops, offset production, completions)", c: "$15" },
                      { i: "Monte Carlo simulation", d: "Stage 7 economics — 10k iterations on NPV / IRR / payback", c: "$2" },
                      { i: "Storage & egress",       d: "S3 delta ~15 GB/well (LAS, core, seismic slices, dossier PDF) + CloudFront delivery", c: "$3" },
                      { i: "Vector DB queries",      d: "pgvector lookups for analog wells, formation embeddings, SPT case library", c: "$2" },
                      { i: "Manual QC reserve",      d: "15% of wells trigger |Δ|>15% review — 2h petrophysicist @ $250/h, prorated", c: "$4" },
                    ].map((row) => (
                      <TableRow key={row.i}>
                        <TableCell className="text-xs font-medium">{row.i}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.d}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{row.c}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-bold text-xs" colSpan={2}>TRUE MARGINAL per well</TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">~$74</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Range in practice: <span className="text-foreground font-semibold">$50 – $120 / well</span> depending on core-photo count,
                  seismic cube size, and whether Monte Carlo runs at 1k vs 10k iterations.
                </p>
              </div>

              <Separator />

              {/* SCENARIOS */}
              <div>
                <p className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Per-well cost — three scenarios
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost component</TableHead>
                      <TableHead className="text-right">Marginal only (post-payback)</TableHead>
                      <TableHead className="text-right">Aramco Pilot — 500 wells / yr</TableHead>
                      <TableHead className="text-right">SaaS scale — 5,000 wells / yr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { c: "FTE amortization",         a: "—",   b: "$5,694", d: "$569" },
                      { c: "Infra + G&A amortization", a: "—",   b: "$1,580", d: "$158" },
                      { c: "Marginal compute + API + data + QC", a: "$74", b: "$74", d: "$74" },
                      { c: "Risk / contingency 15%",   a: "$11", b: "$1,102", d: "$120" },
                    ].map((row) => (
                      <TableRow key={row.c}>
                        <TableCell className="text-xs">{row.c}</TableCell>
                        <TableCell className="text-right text-xs">{row.a}</TableCell>
                        <TableCell className="text-right text-xs">{row.b}</TableCell>
                        <TableCell className="text-right text-xs">{row.d}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-bold text-xs">TOTAL per well (our cost)</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">~$85</TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">~$8,450</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">~$921</TableCell>
                    </TableRow>
                    <TableRow className="bg-success/5">
                      <TableCell className="font-semibold text-xs">SLB / Halliburton equivalent</TableCell>
                      <TableCell className="text-right text-xs">$50k – $150k</TableCell>
                      <TableCell className="text-right text-xs">$50k – $150k</TableCell>
                      <TableCell className="text-right text-xs">$50k – $150k</TableCell>
                    </TableRow>
                    <TableRow className="bg-success/10">
                      <TableCell className="font-bold text-xs">Cost advantage</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">590× – 1,800×</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">6× – 17×</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">54× – 163×</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold text-amber-300 mb-1">Marginal only (~$85/well)</p>
                  <p className="text-[11px] text-muted-foreground">
                    True variable cost of processing one extra well once the team and infra are already paid for.
                    Use for incremental pricing, never for full P&L.
                  </p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs font-semibold text-primary mb-1">Aramco Pilot (~$8.5k/well)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Realistic year-1 unit economics — entire $3.6M fixed base spread over the pilot's 500 wells.
                    Still 6–17× cheaper than SLB/Halliburton's traditional engagement.
                  </p>
                </div>
                <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                  <p className="text-xs font-semibold text-success mb-1">SaaS scale (~$0.9k/well)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Steady-state cost at 5,000 wells/yr across multiple operators.
                    Enables $5–10k list price per well with 80%+ gross margin.
                  </p>
                </div>
              </div>


              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-xs font-semibold mb-1">Assumptions & sensitivities</p>
                <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1">
                  <li>Salaries: US-market 2026 medians + 30% benefits/payroll tax/equity load.</li>
                  <li>Data licenses dominate infra ($250k/yr) — can be offset if customer brings their own data (BYOD model).</li>
                  <li>GPU spend assumes batch H100 at $3–4/GPU-hour; spot pricing can cut this by 40%.</li>
                  <li>15% contingency covers re-runs, manual petrophysicist review on |Δ|&gt;15% wells, and customer support escalations.</li>
                  <li>Numbers exclude one-time R&D capex (SPT patent, initial ML model training) — already amortized.</li>
                </ul>
              </div>

              <Separator />

              {/* PILOT PRICING @ $2,000/well — 28-day sprint */}
              <div className="rounded-lg border-2 border-success/40 bg-success/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-success" />
                  <p className="text-sm font-bold text-success">Aramco Pilot — 500 wells × $2,000 / well · 28-day sprint</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed-scope 28-day engagement. Team is loaded pro-rata (28/365 = 7.67%), not annualized.
                  BYOD data, lean 6-FTE squad, AWS H100 batch. Result: <span className="text-success font-semibold">profitable pilot</span>,
                  not loss-leader.
                </p>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="text-right">$ total</TableHead>
                      <TableHead className="text-right">$ / well</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-success/5">
                      <TableCell className="text-xs font-semibold text-success">REVENUE</TableCell>
                      <TableCell className="text-xs">500 wells × $2,000 (50% upfront / 50% on delivery)</TableCell>
                      <TableCell className="text-right text-xs font-bold text-success">$1,000,000</TableCell>
                      <TableCell className="text-right text-xs font-bold text-success">$2,000</TableCell>
                    </TableRow>

                    <TableRow><TableCell colSpan={4} className="text-[11px] uppercase tracking-wider text-muted-foreground pt-3">Cost structure — 28 days, pro-rata FTE (7.67% of annual)</TableCell></TableRow>
                    {[
                      { l: "2 × Senior ML Engineer",    d: "Pipeline tuning, SPT model calibration (28d)",            t: 43.9, w:  88 },
                      { l: "1 × Senior Petrophysicist", d: "QC, |Δ|>15% review, formation calibration (28d)",         t: 24.9, w:  50 },
                      { l: "1 × Full-stack Engineer",   d: "Dossiers, Aramco SSO, dashboards (28d)",                  t: 17.9, w:  36 },
                      { l: "0.5 × DevOps / MLOps",      d: "AWS H100 batch orchestration, monitoring (28d)",          t: 10.0, w:  20 },
                      { l: "0.5 × PM / Solutions",      d: "Aramco liaison, daily standups, delivery (28d)",          t:  9.5, w:  19 },
                      { l: "GPU + storage (28d)",       d: "H100 batch ~2,000 GPU-h @ $3.5 + S3",                     t: 10.0, w:  20 },
                      { l: "SOC2 + MSA + legal",        d: "One-time Aramco compliance + contract setup",             t: 35.0, w:  70 },
                      { l: "Data licenses",             d: "BYOD — Aramco provides LAS / seismic / production",       t:  0,   w:   0 },
                      { l: "Marginal compute + QC",     d: "500 wells × $85 (LLM, NIM, vector DB, contingency)",      t: 42.5, w:  85 },
                    ].map((r) => (
                      <TableRow key={r.l}>
                        <TableCell className="text-xs font-medium">{r.l}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.d}</TableCell>
                        <TableCell className="text-right text-xs">${r.t}k</TableCell>
                        <TableCell className="text-right text-xs">${r.w.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-amber-500/5">
                      <TableCell className="font-semibold text-xs">TOTAL pilot cost (28 days)</TableCell>
                      <TableCell className="text-xs text-muted-foreground">6 FTE pro-rata + lean infra + BYOD</TableCell>
                      <TableCell className="text-right font-bold text-sm">$193.7k</TableCell>
                      <TableCell className="text-right font-bold text-sm">$387</TableCell>
                    </TableRow>
                    <TableRow className="bg-success/10">
                      <TableCell className="font-bold text-xs text-success">PROFIT (28 days)</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Revenue − Cost · gross margin 81%</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">+$806.3k</TableCell>
                      <TableCell className="text-right font-bold text-sm text-success">+$1,613</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                    <p className="text-xs font-semibold text-success mb-1">Customer pays 24–74× less</p>
                    <p className="text-[11px] text-muted-foreground">
                      $1.0M in 28 days vs SLB/Halliburton $25M–$75M in 6–12 months. Aramco saves $24M–$74M and 5–11 months.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-primary mb-1">Profitable from day 1</p>
                    <p className="text-[11px] text-muted-foreground">
                      +$806k cash profit on the pilot itself. No CAC subsidy required — Aramco reference comes for free.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs font-semibold text-amber-300 mb-1">Y2 expansion option</p>
                    <p className="text-[11px] text-muted-foreground">
                      5,000 wells × $5,000 = $25M ARR at $921/well cost → 81% gross margin. Pilot is the wedge.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="text-xs font-semibold mb-1">28-day delivery plan & feasibility</p>
                  <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1">
                    <li><span className="text-foreground font-semibold">Days 1–3:</span> BYOD data ingest (LAS, seismic, production CSV) + Aramco SSO + MSA execution.</li>
                    <li><span className="text-foreground font-semibold">Days 4–14:</span> Stages 1–7 + 9 on 500 wells (AI pipeline, ~10–14 days end-to-end).</li>
                    <li><span className="text-foreground font-semibold">Stage 8:</span> petrophysics on 500 wells = single AWS H100 batch in ~6 hours (~$7k GPU).</li>
                    <li><span className="text-foreground font-semibold">Days 15–28:</span> QC by petrophysicist on |Δ|&gt;15% wells, dossier export, Aramco review.</li>
                    <li><span className="text-foreground font-semibold">Risks:</span> BYOD delay → schedule slips; H100 spot capacity → fallback to on-demand (+30% GPU).</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="text-xs font-semibold mb-1">Conditions required to make 28-day pilot work</p>
                  <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1">
                    <li><span className="text-foreground font-semibold">BYOD mandatory</span> — Aramco provides LAS, seismic, production by day 3. Saves $250k/yr in IHS/Enverus licenses.</li>
                    <li><span className="text-foreground font-semibold">Lean team of 6 FTE</span> dedicated to pilot — full company team ($2.85M FTE) is NOT loaded onto this contract.</li>
                    <li><span className="text-foreground font-semibold">Y2 expansion clause</span> in MSA — right of first refusal on follow-on 5,000+ well program at $5–10k/well.</li>
                    <li><span className="text-foreground font-semibold">Reference + case study rights</span> — Aramco logo, public testimonial, joint white paper on SPT EOR uplift.</li>
                    <li><span className="text-foreground font-semibold">Milestone payments</span> — 50% upfront ($500k), 50% on delivery ($500k) to fund 28-day payroll.</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        AI Smart Well · SGOM Platform © 2026 · Pilot Brief for Saudi Aramco · Confidential
      </p>
    </div>
  );
}
