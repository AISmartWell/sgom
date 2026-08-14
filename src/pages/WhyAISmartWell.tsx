import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Check,
  Minus,
  X,
  Target,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ScanLine,
  Microscope,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Bot,
} from "lucide-react";

type Level = "full" | "partial" | "none";

interface Row {
  module: string;
  detail: string;
  cyclePhase?: string;
  aisw: Level;
  cognite: Level;
  petroai: Level;
  novi: Level;
}

const SPT_CYCLE = [
  {
    id: "ocr",
    label: "OCR & digitization",
    icon: ScanLine,
    desc: "Paper logs, core photos, scanned reports → structured LAS/CSV curves.",
  },
  {
    id: "petrophysics",
    label: "Petrophysics",
    icon: Microscope,
    desc: "Archie, Timur, Larionov: Vsh, φe, Sw, net pay, lithology.",
  },
  {
    id: "forecast",
    label: "Forecast & twin",
    icon: TrendingDown,
    desc: "Arps decline, IOIP, Digital Twin, SCADA feedback, GPU physics simulation.",
  },
  {
    id: "advisor",
    label: "SPT Advisor",
    icon: Bot,
    desc: "MCDA ranking, few-shot analogs, Restoration Potential Score.",
  },
  {
    id: "economics",
    label: "Economics",
    icon: DollarSign,
    desc: "NPV, IRR, payback, Monte Carlo P10/P90, Base vs Upside.",
  },
];

const VENDORS: { key: keyof Pick<Row, "aisw" | "cognite" | "petroai" | "novi">; label: string; accent?: boolean }[] = [
  { key: "aisw", label: "AI Smart Well", accent: true },
  { key: "cognite", label: "Cognite" },
  { key: "petroai", label: "Petro.ai" },
  { key: "novi", label: "Novi Labs / Enverus" },
];

const ROWS: Row[] = [
  // Candidate discovery
  {
    module: "Public registry scanning (TX, OK, KS, NM, CO, ND, WY)",
    detail: "Automated multi-state candidate discovery by oil rate, water cut, GOR, formation.",
    cyclePhase: "Discovery",
    aisw: "full",
    cognite: "none",
    petroai: "partial",
    novi: "full",
  },
  // 1. OCR & digitization
  {
    module: "OCR of paper well logs and scanned reports",
    detail: "NVIDIA Vision (NIM VLM) page-by-page queue, curve digitization, formation tops.",
    cyclePhase: "OCR →",
    aisw: "full",
    cognite: "partial",
    petroai: "none",
    novi: "none",
  },
  {
    module: "Core photo analysis (segmentation, fractures, mineralogy)",
    detail: "Vision model replaces first-pass petrographic screening.",
    cyclePhase: "OCR →",
    aisw: "full",
    cognite: "none",
    petroai: "none",
    novi: "none",
  },
  // 2. Petrophysics
  {
    module: "Open-formula petrophysics (Archie, Timur, Larionov)",
    detail: "LAS 2.0 workflow: Vsh, phi-e, Sw, net pay with published citations and DOIs.",
    cyclePhase: "Petrophysics →",
    aisw: "full",
    cognite: "partial",
    petroai: "partial",
    novi: "partial",
  },
  {
    module: "Seismic reinterpretation with auditable pattern match",
    detail: "Few-shot reference cases; output cites reference IDs for regulator review.",
    cyclePhase: "Petrophysics →",
    aisw: "full",
    cognite: "none",
    petroai: "partial",
    novi: "none",
  },
  // 3. Forecast & twin
  {
    module: "Decline and reserves (Arps, IOIP, economic limit)",
    detail: "Rate-vs-cumulative reconstruction on fragmented legacy histories.",
    cyclePhase: "Forecast →",
    aisw: "full",
    cognite: "partial",
    petroai: "full",
    novi: "full",
  },
  {
    module: "Digital Twin with SCADA feedback loop",
    detail: "Sensors to edge gateway to cloud to realtime UI, with EKF/Bayesian auto-calibration.",
    cyclePhase: "Forecast →",
    aisw: "full",
    cognite: "full",
    petroai: "partial",
    novi: "none",
  },
  {
    module: "Physics simulation on GPU inference",
    detail: "SGOM Physics Simulator on NVIDIA NIM — pressure, saturation and rate evolution.",
    cyclePhase: "Forecast →",
    aisw: "full",
    cognite: "partial",
    petroai: "partial",
    novi: "none",
  },
  // 4. SPT Advisor
  {
    module: "SPT candidate scoring (Slot Perforation Technology)",
    detail: "MCDA ranking anchored on real SPT field cases used as few-shot benchmarks.",
    cyclePhase: "SPT Advisor →",
    aisw: "full",
    cognite: "none",
    petroai: "none",
    novi: "none",
  },
  {
    module: "Restoration Potential Score (RPS)",
    detail: "Single 0-100 decision output: Restore / Monitor / P&A with full evidence trail.",
    cyclePhase: "SPT Advisor →",
    aisw: "full",
    cognite: "none",
    petroai: "none",
    novi: "none",
  },
  {
    module: "Explainable AI advisor over the whole pipeline",
    detail: "Chain-of-thought SPT Advisor citing log features, analogs and decline trends.",
    cyclePhase: "SPT Advisor →",
    aisw: "full",
    cognite: "partial",
    petroai: "partial",
    novi: "partial",
  },
  // 5. Economics
  {
    module: "Economics: NPV, IRR, payback, Monte Carlo P10/P90",
    detail: "50,000 multi-threaded trials with tornado sensitivity, Base vs Upside model.",
    cyclePhase: "Economics",
    aisw: "full",
    cognite: "none",
    petroai: "partial",
    novi: "partial",
  },
];

const LEVEL_META: Record<Level, { icon: typeof Check; label: string; className: string }> = {
  full: { icon: Check, label: "Yes", className: "text-success" },
  partial: { icon: Minus, label: "Partial", className: "text-warning" },
  none: { icon: X, label: "No", className: "text-muted-foreground/60" },
};

const LevelCell = ({ level }: { level: Level }) => {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${meta.className}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{meta.label}</span>
    </span>
  );
};

const OUTCOMES = [
  {
    title: "One closed SPT cycle",
    body: "Discovery, digitization, petrophysics, decline, simulation, scoring and economics run inside a single dataset — no export/import handoff between vendors.",
  },
  {
    title: "Legacy-data first",
    body: "Built for degraded pre-1980s paper logs and fragmented histories, not for fully instrumented modern assets.",
  },
  {
    title: "Decision, not dashboards",
    body: "Every module feeds one output: Restoration Potential Score with an auditable evidence trail behind Restore / Monitor / P&A.",
  },
  {
    title: "SPT-specific physics",
    body: "Slot Perforation Technology (US 8,863,823) parameters are first-class inputs, benchmarked against real field cases.",
  },
];

const WhyAISmartWell = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Why AI Smart Well vs. alternatives | Module comparison";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    meta?.setAttribute(
      "content",
      "Module-by-module comparison of AI Smart Well against Cognite, Petro.ai and Novi Labs for the end-to-end SPT restoration cycle.",
    );
    return () => {
      document.title = prevTitle;
      meta?.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <header className="mb-8">
          <Badge variant="outline" className="mb-3 border-primary text-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            Competitive positioning
          </Badge>
          <h1 className="text-4xl font-bold mb-3">Why AI Smart Well vs. alternatives</h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            AI Smart Well is built around one closed workflow:{

        <Card className="glass-card mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Module coverage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Comparison of platform modules across AI Smart Well and alternative vendors
                </caption>
                <thead>
                  <tr className="border-b border-border/60">
                    <th scope="col" className="text-left font-semibold px-4 py-3 min-w-[280px]">
                      Module
                    </th>
                    {VENDORS.map((v) => (
                      <th
                        key={v.key}
                        scope="col"
                        className={`text-left font-semibold px-4 py-3 whitespace-nowrap ${
                          v.accent ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {v.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.module} className="border-b border-border/40 align-top">
                      <th scope="row" className="text-left px-4 py-3 font-medium">
                        {r.module}
                        <span className="block text-xs font-normal text-muted-foreground mt-1">
                          {r.detail}
                        </span>
                      </th>
                      {VENDORS.map((v) => (
                        <td
                          key={v.key}
                          className={`px-4 py-3 ${v.accent ? "bg-primary/5" : ""}`}
                        >
                          <LevelCell level={r[v.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-muted-foreground border-t border-border/40">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> Native module
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Minus className="h-3.5 w-3.5 text-warning" /> Partial / via integration or services
              </span>
              <span className="inline-flex items-center gap-1.5">
                <X className="h-3.5 w-3.5" /> Not offered
              </span>
              <span>
                Assessment based on publicly documented product scope; vendor capabilities may change.
              </span>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="outcomes-heading" className="mb-8">
          <h2 id="outcomes-heading" className="text-2xl font-bold mb-4">
            What this means for the SPT cycle
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {OUTCOMES.map((o) => (
              <Card key={o.title} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-primary" />
                    {o.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{o.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Honest scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              Cognite is stronger for enterprise-wide Industrial DataOps across large instrumented
              assets. Enverus/Novi Labs are stronger for basin-scale unconventional analytics and
              market data. AI Smart Well does not replace those systems — it interoperates through
              open formats (LAS, DLIS, CSV, OSDU-aligned exports).
            </p>
            <p>
              The Restoration Potential Score is an active research target, not a calibrated
              production metric. Accuracy figures reported elsewhere on this site are Phase I
              objectives on held-out wells.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WhyAISmartWell;
