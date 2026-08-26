import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Map as MapIcon,
  ScanLine,
  Microscope,
  Activity,
  Gauge,
  Bot,
  DollarSign,
  Radar,
  Waves,
  Database,
  Brain,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  problem: string;
  icon: typeof ScanLine;
};

const TASKS: Task[] = [
  {
    id: "digitize",
    title: "Digitize legacy data",
    problem: "Paper logs, completion reports and scanned files are unusable for analytics.",
    icon: ScanLine,
  },
  {
    id: "interpret",
    title: "Interpret petrophysics",
    problem: "Bypassed pay must be identified from noisy or low-resolution log data.",
    icon: Microscope,
  },
  {
    id: "pressure",
    title: "Reconstruct reservoir pressure",
    problem: "Depleted reservoirs lack recent pressure surveys and PVT data.",
    icon: Gauge,
  },
  {
    id: "forecast",
    title: "Forecast production & uncertainty",
    problem: "Decline curves alone hide the range of possible restoration outcomes.",
    icon: Activity,
  },
  {
    id: "rank",
    title: "Rank restoration candidates",
    problem: "Operators need a defensible order of wells, not a black-box score.",
    icon: Bot,
  },
  {
    id: "economics",
    title: "Prove economic effect",
    problem: "Every candidate needs NPV, IRR and payback before capital is committed.",
    icon: DollarSign,
  },
  {
    id: "monitor",
    title: "Monitor & auto-calibrate",
    problem: "Models drift away from SCADA reality unless they self-correct.",
    icon: Radar,
  },
  {
    id: "physics",
    title: "Physics-aware simulation",
    problem: "Pure ML extrapolates unphysically outside the training envelope.",
    icon: Waves,
  },
];

type ModuleIO = {
  stage: string;
  module: string;
  route: string;
  inputs: string[];
  outputs: string[];
  consumers: string;
  icon: typeof ScanLine;
};

const MODULES: ModuleIO[] = [
  {
    stage: "Stage 1",
    module: "Field Scanning / Autonomous Registry Scan",
    route: "/dashboard/autonomous-scan",
    inputs: ["State registries (KGS/GIS)", "Lat/long bounding box", "Operator filters"],
    outputs: ["Well shortlist", "API numbers, coordinates", "Formation codes"],
    consumers: "Stage 2 Data Classification",
    icon: Radar,
  },
  {
    stage: "Stage 2",
    module: "Data Ingestion & OCR (Paper Well Log Recognition)",
    route: "/dashboard/ocr-well-log",
    inputs: ["Scanned logs (PDF/JPG)", "Completion reports", "LAS files", "Production tables"],
    outputs: ["Digitized curves (GR, RES, NPHI, RHOB)", "Depth-indexed arrays", "Formation attribution"],
    consumers: "Document Vault, Stage 3, Stage 8",
    icon: ScanLine,
  },
  {
    stage: "Stage 3",
    module: "Core & Document Analysis",
    route: "/dashboard/core-analysis",
    inputs: ["Core photos", "Lab reports", "Unstructured documents"],
    outputs: ["Porosity/permeability points", "Mineralogy & fracture features", "Text interpretation"],
    consumers: "Stage 8 Petrophysics, Solver calibration",
    icon: Microscope,
  },
  {
    stage: "Stage 4",
    module: "Cumulative Production Analysis",
    route: "/dashboard/cumulative-analysis",
    inputs: ["Monthly oil/gas/water history", "Well events"],
    outputs: ["Arps decline fit (b = 0.5)", "EUR & remaining IOIP", "Economic limit date"],
    consumers: "Stage 7 Economics, RPS scoring",
    icon: Activity,
  },
  {
    stage: "Stage 5",
    module: "Seismic Interpretation",
    route: "/dashboard/seismic",
    inputs: ["Seismic sections/images", "Horizon picks"],
    outputs: ["Structural features", "Fault/pinch-out flags", "Confidence score"],
    consumers: "Stage 6 SPT screening",
    icon: Waves,
  },
  {
    stage: "Stage 6",
    module: "SPT Screening & SPT Advisor",
    route: "/dashboard/spt-advisor",
    inputs: ["Net pay, k, skin, water cut, pressure", "Completion & perforation data"],
    outputs: ["Restoration Potential Score (RPS 0-100)", "Ranked candidate list", "Chain-of-thought rationale"],
    consumers: "Stage 7 Economics, decision report",
    icon: Bot,
  },
  {
    stage: "Stage 7",
    module: "Economic Analysis",
    route: "/dashboard/economics",
    inputs: ["Forecast profiles", "CAPEX/OPEX, price deck", "Monte Carlo assumptions"],
    outputs: ["NPV, IRR, payback", "P10/P50/P90 distributions", "Profitability model export"],
    consumers: "Investor deck, Profitability Model",
    icon: DollarSign,
  },
  {
    stage: "Stage 8",
    module: "Geophysical Expertise / Petrophysical Solver Module",
    route: "/dashboard/geophysical-expertise",
    inputs: ["Digitized log curves", "Formation bounds", "Core calibration points"],
    outputs: ["Vshale, φ, Sw, net pay", "Timur permeability k = 0.136·φ⁴·⁴/Swirr²", "Diagnostics panel"],
    consumers: "Stage 6 SPT screening, Reserves Map",
    icon: Microscope,
  },
  {
    stage: "Stage 9",
    module: "EOR Optimization & Reservoir Pressure",
    route: "/dashboard/reservoir-pressure",
    inputs: ["RFT/DST points", "PVT samples", "Material balance inputs"],
    outputs: ["Pore pressure profile (Eaton)", "PVT correlations", "Recovery scenario ranking"],
    consumers: "Digital Twin, SPT Advisor",
    icon: Gauge,
  },
  {
    stage: "Cross-cutting",
    module: "Digital Twin & Feedback Loop",
    route: "/dashboard/digital-twin",
    inputs: ["SCADA/IoT telemetry", "Model forecast", "Field measurements"],
    outputs: ["Deviation alerts", "Kalman/Bayesian-updated parameters", "Auto-calibrated status"],
    consumers: "All forecasting modules",
    icon: Radar,
  },
  {
    stage: "Cross-cutting",
    module: "SGOM Physics Simulator (NVIDIA NIM)",
    route: "/sgom-physics-simulator",
    inputs: ["Well state vector", "Physical bounds", "Analog cases"],
    outputs: ["Predict / Transfer / Reason results", "Physics-constrained forecast", "Explanation trace"],
    consumers: "SPT Advisor, Digital Twin, Innovation demos",
    icon: Brain,
  },
  {
    stage: "Cross-cutting",
    module: "Document Vault & Data Layer",
    route: "/dashboard/document-vault",
    inputs: ["Any uploaded file", "Module outputs"],
    outputs: ["Versioned records per company_id", "Evidence links (REAL / FORMATION / SYNTHETIC)"],
    consumers: "Every module, audit trail",
    icon: Database,
  },
];

const FLOW = [
  "Registry & documents",
  "OCR / digitization",
  "Petrophysics & pressure",
  "Forecast & RPS ranking",
  "Economics & decision",
  "Digital Twin feedback",
];

const SGOMTaskMap = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "SGOM Task Map | Module inputs & outputs";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    meta?.setAttribute(
      "content",
      "Complete map of the tasks SGOM solves and the inputs, outputs and consumers of every AI Smart Well module.",
    );
    return () => {
      document.title = prevTitle;
      meta?.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <header className="mb-8">
          <Badge variant="outline" className="mb-3 border-primary text-primary">
            <MapIcon className="mr-1 h-3 w-3" />
            Platform overview
          </Badge>
          <h1 className="text-4xl font-bold mb-3">SGOM Task Map</h1>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            SGOM does not solve a single problem. It closes a full loop from legacy paper data to a
            capital decision, and then keeps the model honest against field reality. Below: the tasks
            the platform solves and the exact inputs and outputs of every module.
          </p>
        </header>

        {/* End-to-end flow */}
        <section aria-labelledby="flow-heading" className="mb-10">
          <h2 id="flow-heading" className="text-xl font-semibold mb-3">
            End-to-end data flow
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {FLOW.map((step, idx) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-medium">
                  {step}
                </span>
                {idx < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-primary" />}
              </div>
            ))}
          </div>
        </section>

        {/* Tasks */}
        <section aria-labelledby="tasks-heading" className="mb-10">
          <h2 id="tasks-heading" className="text-xl font-semibold mb-3">
            Tasks SGOM solves
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TASKS.map((task) => {
              const Icon = task.icon;
              return (
                <Card key={task.id} className="glass-card border-primary/20">
                  <CardContent className="p-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{task.problem}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Module I/O */}
        <section aria-labelledby="io-heading" className="mb-10">
          <h2 id="io-heading" className="text-xl font-semibold mb-3">
            Module inputs & outputs
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.module} className="glass-card border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {m.stage}
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{m.module}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                        Inputs
                      </p>
                      <ul className="text-xs space-y-1">
                        {m.inputs.map((i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary">→</span>
                            <span>{i}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                        Outputs
                      </p>
                      <ul className="text-xs space-y-1">
                        {m.outputs.map((o) => (
                          <li key={o} className="flex gap-2">
                            <span className="text-primary">✓</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-muted-foreground">
                        Feeds: <span className="text-foreground">{m.consumers}</span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(m.route)}
                      >
                        Open module
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SGOMTaskMap;
