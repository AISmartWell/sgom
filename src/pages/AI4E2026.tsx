import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle,
  Microscope,
  Bot,
  FileText,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Cpu,
  Quote,
} from "lucide-react";

const stages = [
  {
    icon: FileText,
    title: "Paper → data",
    desc: "OCR of legacy logs and scanned completion reports via NVIDIA Vision VLM.",
  },
  {
    icon: Microscope,
    title: "Petrophysics",
    desc: "Archie, Timur, Larionov — published equations with DOI citations.",
  },
  {
    icon: TrendingUp,
    title: "Forecast & twin",
    desc: "Arps decline, IOIP, Digital Twin with SCADA feedback and EKF calibration.",
  },
  {
    icon: Bot,
    title: "SPT Advisor",
    desc: "Autonomous agent ranks candidates, explains its reasoning, cites analogs.",
  },
  {
    icon: DollarSign,
    title: "Economics",
    desc: "NPV, IRR, Monte Carlo P10/P90, Base vs Upside scenario export.",
  },
];

const verifiableClaims = [
  {
    label: "SPT Advisor agent",
    proof: "Tool-calling loop: rank_wells → inspect_well → forecast_well → enrich_well_metadata. Chain-of-Thought trace is stored and auditable.",
  },
  {
    label: "Petrophysical formulas",
    proof: "Archie (1942), Timur (1968), Larionov (1969) — every output references the exact equation and source DOI.",
  },
  {
    label: "Vision OCR",
    proof: "NVIDIA NIM VLM (Nemotron VL) digitizes paper curves page-by-page with confidence scores and evidence trail.",
  },
  {
    label: "Reservoir simulation",
    proof: "SGOM Physics Simulator runs on NVIDIA NIM with deterministic physics: pressure, saturation, and rate evolution.",
  },
  {
    label: "Auto-calibration",
    proof: "Extended Kalman Filter + Bayesian update adjusts Twin parameters against SCADA measurements, not hand-tuned fudge factors.",
  },
];

const AI4E2026 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "AI Smart Well — AI4E2026 Networking Theses";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/innovation")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Innovation
          </Button>
        </div>

        <header className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            AI4E2026 · Houston, TX · November 3–4, 2026
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            AI Smart Well
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Verifiable AI for Mature-Well Restoration
          </p>
        </header>

        <Card className="mb-8 border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Quote className="w-8 h-8 text-primary shrink-0 mt-1" />
              <div>
                <p className="text-lg md:text-xl leading-relaxed">
                  We do not sell black-box predictions. We ship <strong>AI whose every recommendation can be traced back to physics, reservoir data, and published equations</strong>. The SPT Advisor ranks candidates, explains why, and links each step to formulas you can inspect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            1. The problem we address
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Mature fields hold large volumes of bypassed pay, but most historical data is still on paper or fragmented across state registries. Operators need a way to digitize, interpret, and rank candidates without trusting a black box.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>AI Smart Well</strong> turns legacy logs, completion reports, and production histories into ranked restoration candidates with an auditable evidence trail.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            2. Our AI is real — and verifiable
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            The platform is not a dashboard of static charts. It is an autonomous agent pipeline that actively diagnoses, scores, and justifies decisions. What makes it different from generic "AI oil & gas" tools is that the AI's reasoning is exposed, not hidden.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {verifiableClaims.map((claim) => (
              <Card key={claim.label} className="bg-card/60 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-primary">{claim.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{claim.proof}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            3. The SPT-first cycle
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Our default execution path is <strong>Slot Perforation Technology (SPT, US 8,863,823)</strong>, but the diagnostic engine itself works on any well with adequate data. If SPT is not the best fit, the platform still identifies the bypassed pay and explains why another method may be preferable.
          </p>

          <div className="grid gap-4 md:grid-cols-5">
            {stages.map((stage, idx) => (
              <div key={stage.title} className="relative group">
                <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20">
                    <stage.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Step {idx + 1}</div>
                  <div className="font-semibold text-sm mb-1">{stage.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</div>
                </div>
                {idx < stages.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            4. Why this matters for operators and investors
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
              <span><strong>Trust:</strong> Every AI score is paired with the underlying physics, formulas, and data lineage.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
              <span><strong>Regulatory readiness:</strong> Auditable reasoning supports NSF/SBIR, field approvals, and investor due diligence.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
              <span><strong>Speed:</strong> Paper logs → ranked candidate in hours, not weeks.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
              <span><strong>Flexibility:</strong> Diagnose any well; SPT is the default execution path, not the only diagnostic path.</span>
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. Current status</h2>
          <p className="text-muted-foreground leading-relaxed">
            Functional prototype in production use for demos and pilot data. We are seeking field partners to validate the ranking methodology against historical SPT and restoration outcomes. We are not claiming 100% accuracy or 4 ms inference — we are claiming <strong>transparent, formula-backed AI</strong> that gets better with every new well you feed it.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate("/innovation")} className="gap-2">
            Explore Innovation
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/spt-demo")} className="gap-2">
            Run live SPT demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AI4E2026;
