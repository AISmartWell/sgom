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
    body: "AI auto-fills missing parameters using a 3-tier transparency strategy — Tier 1: real LAS/CSV data; Tier 2: formation-specific defaults from FORMATION_DB (200+ formations); Tier 3: NVIDIA Cosmos Transfer synthetic generation. Log curve completeness improves from 42% to 94%; pay zone identification accuracy from 55% to 87%.",
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
    body: "MCDA ranking across 8+ weighted parameters including inverted Water Cut and GOR for SPT readiness scoring. Powered by NVIDIA Cosmos Reason — step-by-step explainable ranking citing specific log features, decline trends, and analog wells.",
  },
  {
    n: 7,
    icon: DollarSign,
    title: "Economic Analysis",
    body: "Full Schlumberger petrophysical workflow (9 steps) on LAS 2.0 files. Standard mnemonics: GR, RT, NPHI, RHOB, SP, CALI. Outputs: Vsh, φe, Sw, net pay, lithology. Cutoffs: Vsh<0.4, φe>0.08, Sw<0.6. NVIDIA Cosmos Predict runs physics-grounded fluid simulation — pressure, saturation, rate evolution under varying SPT parameters, calibrated against reference well Brawner 10-15 (API 42-467-30979).",
  },
  {
    n: 8,
    icon: Activity,
    title: "Geophysical Expertise",
    body: "NPV, IRR, Payback, 5-yr ROI computed via monthly Arps decline. Quantum Amplitude Estimation (QAE) accelerates Monte Carlo convergence from O(1/ε²) to O(1/ε) — 10,000 classical iterations reduced to ~100 at identical precision. Tornado sensitivity charts on price, OPEX, decline, water cut.",
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

        <div className="mb-10">
          <Badge variant="outline" className="mb-3 border-primary text-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            R&D Whitepaper
          </Badge>
          <h1 className="text-4xl font-bold mb-3">Innovation and Technical Merit</h1>
          <p className="text-muted-foreground leading-relaxed">
            AI Smart Well is a 9-stage, 32-module AI platform that transforms raw well data into a
            scientifically validated restoration decision — integrating geology, geophysics,
            computer vision, physics simulation, and quantum-enhanced economics into a single
            automated pipeline. Each stage addresses a distinct scientific challenge.
          </p>
        </div>

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

        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle>Core Scientific Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Abandoned wells have degraded borehole conditions, inconsistent pre-1980s logging
              tools, fragmented records, and missing modalities. Training a self-learning geological
              model on such data requires solving <strong className="text-foreground">domain shift
              adaptation</strong>, <strong className="text-foreground">missing modality inference
              via Cosmos Transfer</strong>, and <strong className="text-foreground">calibrated
              uncertainty quantification</strong> for regulatory-grade output. These are open ML
              research problems — not engineering tasks. Phase I will validate RPS against 200+
              wells with known production outcomes, establishing the scientific foundation for
              national-scale deployment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Innovation;
