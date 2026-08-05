import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Radar,
  FolderSearch,
  Microscope,
  TrendingDown,
  Waves,
  TrendingUp,
  DollarSign,
  Activity,
  Brain,
  Sparkles,
  Target,
  CheckCircle2,
  Gauge,
} from "lucide-react";

const STAGES = [
  {
    n: 1,
    icon: Radar,
    title: "Field Scanning",
    body: "Multi-state real-time registry integration (TX, OK, KS, NM, CO, ND, WY). Automated filtering by oil rate (<10 bbl/d), water cut, GOR, and formation. Timur (1968) permeability estimation k = 0.136·φ⁴·⁴/Swirr² combined with Archie (1942) Sw for petrophysical screening. Eliminates manual database trawling that currently takes weeks.",
  },
  {
    n: 2,
    icon: FolderSearch,
    title: "Data Classification",
    body: "AI attempts to fill missing parameters under a 3-tier transparency strategy — Tier 1: real LAS/CSV data; Tier 2: defaults from a curated geologic reference set; Tier 3: physics-guided synthetic generation (NVIDIA NIM). Open gap: formation attribution and synthetic infill are not yet validated against blind hold-out wells, and Tier 2/3 values carry unquantified bias. Phase I subcomponent target: ≥75% attribution accuracy on a blind set (the overall R1 target is <15% MAPE degradation on unseen regions); fallback — restrict inference to Tier 1 wells and report abstention rate.",
  },
  {
    n: 3,
    icon: Microscope,
    title: "Core Analysis",
    body: "NVIDIA NIM (Nemotron Nano 12B v2 VL) computer vision analyzes core photographs in 3 modes — Segmentation (grain/matrix boundaries), Fractures (orientation and density mapping), Mineralogy (composition estimation). Replaces costly laboratory petrographic analysis.",
  },
  {
    n: 4,
    icon: TrendingDown,
    title: "Cumulative Analysis",
    body: "Arps decline curve modeling (b=0.5, Di=0.025). IOIP calculation and recovery factor estimation. Economic limit projection. Rate-vs-cumulative charting for production history reconstruction.",
  },
  {
    n: 5,
    icon: Waves,
    title: "Seismic Reinterpretation",
    body: "CV pattern matching on uploaded seismic sections. Few-shot trained on 5 expert-annotated reference cases (Wolfcamp/Permian, Woodford/Anadarko, Bakken/Williston, Niobrara/DJ Basin, Mississippian/Anadarko). AI output includes mandatory Pattern Match section citing reference IDs — fully auditable by regulators.",
  },
  {
    n: 6,
    icon: TrendingUp,
    title: "SPT Projection",
    body: "MCDA ranking across 8+ weighted parameters including inverted Water Cut and GOR for SPT readiness scoring. Powered by SGOM Physics Simulator · Powered by NVIDIA NIM Reason — step-by-step explainable ranking citing specific log features, decline trends, and analog wells.",
  },
  {
    n: 7,
    icon: DollarSign,
    title: "Economic Analysis",
    body: "Full Schlumberger petrophysical workflow (9 steps) on LAS 2.0 files. Standard mnemonics: GR, RT, NPHI, RHOB, SP, CALI. Outputs: Vsh, φe, Sw, net pay, lithology. Cutoffs: Vsh<0.4, φe>0.08, Sw<0.6. SGOM Predict (NVIDIA NIM) runs physics-grounded fluid simulation — pressure, saturation, rate evolution under varying SPT parameters, calibrated against reference well Brawner 10-15 (API 42-467-30979).",
  },
  {
    n: 8,
    icon: Activity,
    title: "Geophysical Expertise",
    body: "NPV, IRR, Payback, 5-yr ROI computed via monthly Arps decline. GPU-accelerated Monte Carlo (50,000 trials in a multi-threaded worker) with importance-sampled tail estimation for P10/P90 risk — a research prototype, no quantum-hardware speedup is claimed. Tornado sensitivity charts on price, OPEX, decline, water cut.",
  },
  {
    n: 9,
    icon: Brain,
    title: "EOR Optimization",
    body: "Final AI aggregation of all 8 prior stages. SPT-priority recommendations with full justification trace. Output: Restoration Potential Score (RPS) — the Phase I R&D target — a validated, calibrated scoring algorithm requiring >75% predictive accuracy on held-out wells.",
  },
];

const Innovation = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <Badge variant="outline" className="mb-3 border-primary text-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            R&D Whitepaper
          </Badge>
          <h1 className="text-4xl font-bold mb-3">Innovation and Technical Merit</h1>
          <p className="text-muted-foreground leading-relaxed">
            AI Smart Well is a research platform organized as a 9-stage analysis pipeline for
            legacy well data. The engineering scaffolding — ingest, petrophysics, decline, scoring —
            exists to support experiments; the scientific core is <em>unsolved</em>. Predictive
            accuracy on degraded pre-1980s logs, cross-region generalization, and calibrated
            uncertainty remain open research questions with no validated solution today. Each stage
            below states what it does and where it currently fails.
          </p>

        </div>

        {/* Core Thesis — what the AI actually does */}
        <Card className="glass-card border-primary/40 mb-10 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-11 w-11 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <span className="flex-1">Our Core Thesis</span>
              <Badge className="bg-primary text-primary-foreground">What our AI does</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-relaxed">
              Our artificial intelligence determines the{" "}
              <strong className="text-primary">restoration potential of a well</strong> — whether
              an idle, low-rate, or abandoned wellbore can be brought back into productive
              service. Instead of plugging it (P&A), operators receive a quantitative,
              evidence-backed answer: <em>does this well still have economic life?</em>
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Restoration Potential Score</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A 0–100 calibrated score (RPS) per well, validated against held-out production
                  outcomes.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold">Decision, not just data</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Output is a clear recommendation — Restore / Monitor / P&A — with full
                  audit trail of evidence.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background/60 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Self-learning model</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Trained on degraded, fragmented legacy data — exactly the conditions of the
                  3.7M+ idle US wells.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
              Reference validation well: <strong className="text-foreground">Brawner 10-15</strong>{" "}
              (API 42-467-30979). The 9 stages below are not generic analytics — each one feeds a
              specific input into the final RPS computation.
            </p>
          </CardContent>
        </Card>


        <div className="space-y-4 mb-10">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.n} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1">
                      Stage {s.n} — {s.title}
                    </span>
                    <Badge variant="outline">Stage {s.n}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="glass-card border-primary/30 mb-6">
          <CardHeader>
            <CardTitle>Open Research Gaps and Fallback Paths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p className="text-xs text-muted-foreground/80 border border-border/50 rounded-md p-2">
              Two levels of targets are reported below. <strong className="text-foreground">Subcomponent
              target</strong> = accuracy of a single module (e.g. formation attribution) measured in
              isolation. <strong className="text-foreground">Overall target</strong> = end-to-end
              performance of the research hypothesis on blind data. They are not interchangeable.
            </p>
            <div>
              <p className="text-foreground font-semibold">R1 — Physics-informed few-shot generalization</p>
              <p>
                Open question: can differentiable physical constraints (Darcy, Archie) substitute
                for data volume when transferring a geological regressor to an unseen region?
                Unsolved today.
              </p>
              <p className="mt-1">
                <Badge variant="outline" className="mr-2">Subcomponent target</Badge>
                ≥75% formation-attribution accuracy on a blind well set.
              </p>
              <p className="mt-1">
                <Badge variant="outline" className="mr-2">Overall target</Badge>
                &lt;15% MAPE degradation when transferring to an unseen region, leave-one-case-out
                with bootstrap CI.
              </p>
              <p className="mt-1">
                Fallback: region-conditional models with explicit abstention below a confidence
                floor.
              </p>
            </div>
            <div>
              <p className="text-foreground font-semibold">R2 — Missing-modality inference on degraded logs</p>
              <p>
                Open question: can absent curves be reconstructed from pre-1980s partial suites
                without introducing systematic bias?
              </p>
              <p className="mt-1">
                <Badge variant="outline" className="mr-2">Subcomponent target</Badge>
                ≤30% curve-reconstruction error on ≥200 masked wells.
              </p>
              <p className="mt-1">
                <Badge variant="outline" className="mr-2">Overall target</Badge>
                ≥20% MAPE reduction against MICE and GAIN baselines on the same masked set.
              </p>
              <p className="mt-1">
                Fallback: report modality gaps as intervals rather than point estimates and exclude
                affected wells from scoring.
              </p>
            </div>
            <div>
              <p className="text-foreground font-semibold">R3 — Calibrated uncertainty for regulatory-grade output</p>
              <p>
                Open question: does conformal prediction hold nominal coverage under domain shift
                and heavy masking? Target: empirical coverage within <strong className="text-foreground">±3
                percentage points of the nominal 90% level</strong> across deciles, regions and
                masking levels — over-coverage counts as miscalibration, not as success. Brier and
                CRPS scored alongside. Fallback: Mondrian (region-conditional) conformal prediction
                with region-disjoint calibration folds.
              </p>
            </div>

            <p className="border-t border-border/50 pt-3">
              Aggregate criterion: R1 is required; at least one of R2/R3 must also meet target on
              blind sets, reproducible with published code and public/synthetic data. None of these
              targets has been met — the pipeline provides the experimental harness, not the answer.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle>Core Scientific Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Abandoned wells have degraded borehole conditions, inconsistent pre-1980s logging
              tools, fragmented records, and missing modalities. Training a self-learning geological
              model on such data requires solving <strong className="text-foreground">domain shift
              adaptation</strong>, <strong className="text-foreground">missing modality
              inference</strong>, and <strong className="text-foreground">calibrated
              uncertainty quantification</strong> for regulatory-grade output. These are open ML
              research problems, and the current implementation is an unvalidated prototype: the
              existing modules make the experiments runnable, but none of the R1–R3 hypotheses has
              been confirmed on blind data. Phase I is a test of whether the approach works at all.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Innovation;
