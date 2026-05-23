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
  CheckCircle2, AlertTriangle, TrendingDown, Globe, Gauge, Activity, FileText, Download,
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Funnel 500→4</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="data">Data Inputs</TabsTrigger>
          <TabsTrigger value="tech">Tech & Security</TabsTrigger>
          
        </TabsList>

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

      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        AI Smart Well · SGOM Platform © 2026 · Pilot Brief for Saudi Aramco · Confidential
      </p>
    </div>
  );
}
