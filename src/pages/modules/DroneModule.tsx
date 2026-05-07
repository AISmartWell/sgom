import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plane,
  Satellite,
  Cpu,
  DollarSign,
  ShieldCheck,
  Layers,
  Target,
  Activity,
  CheckCircle2,
  XCircle,
  Wind,
  Camera,
  Map as MapIcon,
  FileText,
} from "lucide-react";

const STAGES = [
  { n: 1, existing: "Data Ingestion (well logs, production)", drone: "Drone data ingestion pipeline (GeoTIFF, LAS, thermal)" },
  { n: 2, existing: "Data Preprocessing & QC", drone: "Georeferencing QC, flight path validation, sensor calibration" },
  { n: 3, existing: "Feature Extraction", drone: "CV Core: surface condition & infrastructure damage detection" },
  { n: 4, existing: "Geological Object Model build", drone: "3D site model fusion: subsurface + surface point cloud" },
  { n: 5, existing: "SPT Candidate Scoring", drone: "Composite: subsurface potential + surface access + env. risk" },
  { n: 6, existing: "Economics Module", drone: "Drone survey cost offset vs. walkdown ($4,200 saved/well)" },
  { n: 7, existing: "Visualization", drone: "3D orthomosaic + thermal overlay in dashboard" },
  { n: 8, existing: "IoT / SCADA Monitor", drone: "Post-restoration drone monitoring & leak detection" },
  { n: 9, existing: "Reporting & API", drone: "Automated drone inspection + regulatory submission package" },
];

const TIERS = [
  { name: "Drone Survey Add-on", desc: "Autonomous flight plan + data processing", price: "$800/well", target: "Operators, regulators" },
  { name: "Environmental Compliance Pack", desc: "Methane plume report + EPA Subpart W data", price: "$1,500/well", target: "DOI, EPA programs" },
  { name: "Full Site Digital Twin", desc: "3D orthomosaic + AI Smart Well subsurface model + fusion score", price: "$3,200/well", target: "State agencies, PE firms" },
  { name: "Ongoing Monitoring (IoT)", desc: "Quarterly drone rescan + anomaly alert subscription", price: "$200/well/mo", target: "All segments" },
];

const COMPARE = [
  { cap: "Subsurface analysis", trad: "Manual / slow", base: "AI-automated", drone: "AI-automated" },
  { cap: "Surface condition assessment", trad: "Manual walkdown", base: "—", drone: "Autonomous drone" },
  { cap: "Methane emission mapping", trad: "Rarely done", base: "—", drone: "Gas sensor + AI" },
  { cap: "Cost per well assessment", trad: "$4,200+", base: "$500–800", drone: "$500–800" },
  { cap: "Time per well", trad: "3–5 days", base: "Minutes", drone: "Minutes + 1 hr flight" },
  { cap: "Regulatory report generation", trad: "Manual", base: "Partial", drone: "Automated package" },
];

const RESEARCH_QS = [
  "Can multimodal fusion (drone + downhole) reduce well-assessment false-positive rate by >30% vs. subsurface-only models?",
  "Which ML architecture (early fusion, late fusion, cross-modal attention) performs best for heterogeneous well-site data?",
  "Can autonomous drone waypoint planning be generated directly from the geological object model (Stage 4 output)?",
];

const DroneModule = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/15 text-primary border-primary/30">New Module</Badge>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                NSF SBIR Phase I
              </Badge>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                NVIDIA DGX Cloud
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Drone Inspection Integration Module
            </h1>
            <p className="text-sm text-muted-foreground">
              Above-ground + below-ground assessment pipeline for abandoned and low-producing wells
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              AI Smart Well currently delivers subsurface intelligence — well logs, production
              history, and geological formations to identify restoration candidates. The Drone
              Inspection Module extends our analytical depth to the surface, creating a complete
              above-ground + below-ground assessment pipeline.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { label: "Orphaned wells (US)", value: "3.2M" },
                { label: "Federal liability", value: "$117B" },
                { label: "IIJA allocation", value: "$4.7B" },
                { label: "Walkdown cost saved", value: "$4,200/well" },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-card/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground mt-1">{s.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Part 1: NSF Research */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Part 1
            </Badge>
            <h2 className="text-xl font-bold">NSF SBIR Phase I — Research Questions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {RESEARCH_QS.map((q, i) => (
              <Card key={i} className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="text-xs font-mono text-emerald-400">RQ-{i + 1}</div>
                  <p className="text-sm text-foreground leading-relaxed">{q}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" /> Proposed Methodology
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Data Collection
                </div>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>• DJI Matrice 300 RTK + Zenmuse H20T (RGB + thermal)</li>
                  <li>• Pergam Methane Mini (CH₂ / CH₄ plume)</li>
                  <li>• 3-altitude orbital scan: 49, 98, 197 ft</li>
                  <li>• 20 pilot wells (Oklahoma)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  AI Fusion (NVIDIA DGX Cloud)
                </div>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>• Subsurface encoder: well-log transformer</li>
                  <li>• Surface encoder: ResNet-50 / ViT (RGB + thermal)</li>
                  <li>• Cross-attention fusion (GPS-aligned)</li>
                  <li>• Output: candidate + env. risk score</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Validation
                </div>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>• Blinded vs. engineer assessment</li>
                  <li>• Primary metric: AUC for candidate ID</li>
                  <li>• Cost per correct identification</li>
                  <li>• Baseline: $4,200 / well walkdown</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Part 2: 9-stage integration */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/15 text-primary border-primary/30">Part 2</Badge>
            <h2 className="text-xl font-bold">Module Architecture — 9-Stage Integration</h2>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-card/40">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4 w-20">Stage</th>
                      <th className="py-3 px-4">Existing AI Smart Well Module</th>
                      <th className="py-3 px-4">Drone Module Integration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STAGES.map((s) => (
                      <tr key={s.n} className="border-b border-border/40 last:border-0">
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="border-primary/30 text-primary font-mono">
                            Stage {s.n}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground">{s.existing}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.drone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tech architecture */}
          <div className="grid md:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Satellite className="h-4 w-4 text-primary" /> Data Ingestion
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <div>• DJI SRT + GeoTIFF</div>
                <div>• FLIR radiometric JPEG</div>
                <div>• LiDAR .LAS point cloud</div>
                <div>• Pergam CSV gas readings</div>
                <div>• AWS S3 → DGX Cloud mirror</div>
                <div>• Kafka stream + batch ingestion</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" /> Computer Vision Core
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <div>• YOLOv8 — wellhead, tank, pipeline, spill</div>
                <div>• U-Net — thermal hot-spot segmentation</div>
                <div>• Gaussian dispersion — methane plume</div>
                <div>• NVIDIA DGX H100 cluster</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Fusion Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <div>• Cross-modal attention (GPS aligned)</div>
                <div className="font-mono text-[11px] text-foreground bg-card/60 rounded p-2 my-1">
                  Score = α·SPT + β·access − γ·env_risk
                </div>
                <div>• Coefficients per operator / state</div>
                <div>• Oklahoma · Texas · Federal presets</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-primary" /> Autonomous Flight Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3 text-xs">
              <div className="rounded-md border border-border bg-card/40 p-3">
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  Input
                </div>
                <div className="text-foreground mt-1">Geological object model (coords, depth, formation)</div>
              </div>
              <div className="rounded-md border border-border bg-card/40 p-3">
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  Output
                </div>
                <div className="text-foreground mt-1">MAVLink .plan with waypoints & sensor triggers</div>
              </div>
              <div className="rounded-md border border-border bg-card/40 p-3">
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  Algorithm
                </div>
                <div className="text-foreground mt-1">Boustrophedon coverage + orbital structure scan</div>
              </div>
              <div className="rounded-md border border-border bg-card/40 p-3">
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  Compliance
                </div>
                <div className="text-foreground mt-1">FAA Part 107 geofencing + LAANC auto-check</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Part 3: Pricing & competitive moat */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Part 3</Badge>
            <h2 className="text-xl font-bold">Revenue Tiers & Competitive Moat</h2>
          </div>

          {/* Tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {TIERS.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-5 pb-4 space-y-2">
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                  <div className="text-xl font-bold font-mono text-primary mt-2">{t.price}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.target}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* TAM callout */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">$400M+ TAM addition</span>{" "}
                — 500,000 priority orphaned wells × $800 average drone survey, before factoring
                Environmental Compliance and Digital Twin tiers.
              </p>
            </CardContent>
          </Card>

          {/* Comparison table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Competitive Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-card/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 text-left">Capability</th>
                      <th className="py-3 px-4 text-left">Traditional Consultants</th>
                      <th className="py-3 px-4 text-left">AI Smart Well (Pre-Drone)</th>
                      <th className="py-3 px-4 text-left">AI Smart Well + Drone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE.map((c) => (
                      <tr key={c.cap} className="border-b border-border/40 last:border-0">
                        <td className="py-3 px-4 font-medium text-foreground">{c.cap}</td>
                        <td className="py-3 px-4 text-muted-foreground">{c.trad}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {c.base === "—" ? (
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <XCircle className="h-3.5 w-3.5" /> Not included
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {c.base}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {c.drone}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Investor one-liners */}
          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                icon: Wind,
                text: "AI Smart Well is the only AI platform that tells you not just whether a well is worth restoring — but whether you can safely access it, and whether it's leaking methane right now.",
              },
              {
                icon: DollarSign,
                text: "Drone surveys cost $4,200 per well manually. AI Smart Well generates the same output automatically as part of the standard $800 well assessment.",
              },
              {
                icon: Activity,
                text: "With 500,000 orphaned wells and $4.7B in federal funding, AI Smart Well + Drone becomes the mandated workflow — not an optional upgrade.",
              },
            ].map((q, i) => {
              const Icon = q.icon;
              return (
                <Card key={i} className="bg-card/50">
                  <CardContent className="pt-5 pb-4 space-y-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed">"{q.text}"</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-5 pb-5 flex items-start gap-3">
            <FileText className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              Source spec: <span className="text-foreground font-medium">SGOM_Drone_Module.docx</span> —
              NSF SBIR Phase I justification, module architecture, and investor pitch (May 2026).
              Branding normalized to AI Smart Well per project standards.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DroneModule;
