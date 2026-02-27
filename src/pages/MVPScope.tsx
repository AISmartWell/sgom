import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Rocket, Layers, Shield, Brain, Radio, Microscope, BarChart3, Target, DollarSign, Settings, FolderSearch, TrendingDown, Radar, Activity, GraduationCap, Building2, TrendingUp, ChevronDown, AlertTriangle, Server, Globe, Gauge, CreditCard, ShieldCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const mvpModules = [
  {
    stage: "Stage 1",
    title: "Field Scanning",
    icon: Radar,
    description: "Satellite imagery + well location mapping for field overview",
    emoji: "🛰️",
    inputs: ["Field coordinates (lat/lon)", "Satellite imagery source (Sentinel-2 / Mapbox)"],
    outputs: ["Field map with well markers", "License area boundaries"],
    acceptance: ["Display ≥100 wells on map without lag", "Zoom and marker clustering support", "Satellite tile loading < 3 sec"],
    budget: 8000,
    dependencies: [],
  },
  {
    stage: "Stage 2",
    title: "Data Classification",
    icon: FolderSearch,
    description: "Automated categorization and quality scoring of well data",
    emoji: "📂",
    inputs: ["Raw well data from Stage 1", "Public databases (Oklahoma/Texas OCC/RRC)"],
    outputs: ["Categorized records (active/inactive/plugged)", "Quality Score (0–100) per well"],
    acceptance: ["Automatic classification of ≥95% records", "AI Quality Score per well", "Filtering by status, formation, county"],
    budget: 15000,
    dependencies: ["Field Scanning"],
  },
  {
    stage: "Stage 3",
    title: "Cumulative Analysis",
    icon: TrendingDown,
    description: "Production decline curves and cumulative output analysis",
    emoji: "📈",
    inputs: ["Historical production data (oil/gas/water)", "Time series per well"],
    outputs: ["Production decline curves (Arps decline)", "Cumulative production and EUR forecast", "Water cut trend coefficient"],
    acceptance: ["Decline curve generation for selected well", "EUR (Estimated Ultimate Recovery) calculation", "Interactive charts with Recharts"],
    budget: 12000,
    dependencies: ["Data Classification"],
  },
  {
    stage: "Stage 4",
    title: "AI Well Selection & Ranking",
    icon: Target,
    description: "ML-driven candidate ranking for SPT treatment",
    emoji: "🎯",
    inputs: ["Classified well data", "Decline curves from Stage 3", "Geological parameters (formation, depth)"],
    outputs: ["Ranked list of SPT treatment candidates", "AI Score (0–100) with factor explanation", "Top-N recommendations"],
    acceptance: ["Ranking of ≥50 wells in < 5 sec", "Transparent scoring formula", "Filters by state, formation, minimum score"],
    budget: 18000,
    dependencies: ["Cumulative Analysis", "Data Classification"],
  },
  {
    stage: "Stage 5",
    title: "Economic Analysis",
    icon: DollarSign,
    description: "ROI modeling, NPV/IRR calculations per well candidate",
    emoji: "💵",
    inputs: ["Current well production", "Post-SPT production uplift forecast", "SPT treatment cost", "Oil price (API)"],
    outputs: ["NPV, IRR, Payback Period per candidate", "Sensitivity analysis (oil price ±20%)", "Comparative ROI table"],
    acceptance: ["NPV/IRR calculation in < 2 sec", "Dynamic update on oil price change", "Export results to PDF"],
    budget: 10000,
    dependencies: ["AI Well Selection & Ranking"],
  },
  {
    stage: "Stage 7",
    title: "SPT Parameters",
    icon: Settings,
    description: "Treatment slot configuration and chemical dosage optimization",
    emoji: "⚙️",
    inputs: ["Well data (depth, diameter, formation)", "Selected candidate from Stage 4"],
    outputs: ["Slot configuration (count, depth, interval)", "Chemical reagent dosage", "Estimated treatment pressure"],
    acceptance: ["Slot placement visualization on wellbore", "Automatic parameter selection by formation", "Parameter validation (min/max ranges)"],
    budget: 12000,
    dependencies: ["AI Well Selection & Ranking"],
  },
  {
    stage: "Stage 6",
    title: "Geophysical Expertise",
    icon: Activity,
    description: "Well log analysis with AI interpretation and formation evaluation",
    emoji: "📊",
    inputs: ["Well log data (GR, SP, Resistivity, Porosity)", "LAS files or tabular data"],
    outputs: ["AI interpretation of well log curves", "Reservoir zone identification", "Treatment interval recommendations"],
    acceptance: ["Multi-track well log visualization", "AI-annotated productive zones", "LAS file upload support"],
    budget: 15000,
    dependencies: ["Data Classification"],
  },
  {
    stage: "Core",
    title: "Core Analysis (CV)",
    icon: Microscope,
    description: "Computer vision for core sample classification and geological interpretation",
    emoji: "🔬",
    inputs: ["Core sample photos (JPEG/PNG)", "Metadata (sampling depth, well)"],
    outputs: ["Lithotype classification (limestone/sandstone/shale/dolomite)", "Confidence score and description", "Geological interpretation report"],
    acceptance: ["Image classification in < 5 sec", "Accuracy ≥ 85% on test dataset", "Drag & drop upload support"],
    budget: 10000,
    dependencies: [],
  },
  {
    stage: "Core",
    title: "EOR Optimization",
    icon: Brain,
    description: "AI-driven Enhanced Oil Recovery optimization — central MVP pipeline hub",
    emoji: "🧠",
    inputs: ["Results from all Stage 1–7 modules", "Core Analysis data"],
    outputs: ["EOR optimization summary report", "Final treatment recommendations", "Dashboard with key metrics"],
    acceptance: ["Data aggregation from all modules", "Unified KPI dashboard", "PDF report generation"],
    budget: 15000,
    dependencies: ["Field Scanning", "Data Classification", "Cumulative Analysis", "AI Well Selection & Ranking", "Economic Analysis", "SPT Parameters", "Geophysical Expertise", "Core Analysis (CV)"],
  },
  {
    stage: "Core",
    title: "Multi-Tenant Auth",
    icon: Building2,
    description: "Company-based access control, user management, RLS policies",
    emoji: "🏢",
    inputs: ["Email/password for registration", "Company name"],
    outputs: ["JWT authentication tokens", "Company-scoped data (RLS)", "Roles: admin / operator / viewer"],
    acceptance: ["User registration and login", "Data isolation between companies (RLS)", "Minimum 3 roles with different permissions"],
    budget: 10000,
    dependencies: [],
  },
];

const phase2Modules = [
  {
    title: "Reservoir Simulation",
    icon: BarChart3,
    description: "Physics-based or surrogate reservoir modeling",
    reason: "Requires physics engine / external solver",
    emoji: "📊",
  },
  {
    title: "ML Model Training",
    icon: GraduationCap,
    description: "Custom TensorFlow/PyTorch model training pipeline",
    reason: "GPU infrastructure + labeled dataset needed",
    emoji: "🎓",
  },
  {
    title: "IoT / Telemetry",
    icon: Radio,
    description: "Real-time SCADA data ingestion and monitoring",
    reason: "Requires hardware integration / simulators",
    emoji: "📡",
  },
];

const v11Modules = [
  {
    title: "SPT Projection",
    icon: TrendingUp,
    description: "Post-treatment production forecasting",
    emoji: "🚀",
  },
  {
    title: "Financial Forecast",
    icon: DollarSign,
    description: "Multi-year ROI projections and sensitivity analysis",
    emoji: "💰",
  },
];

const allModulesComparison = [
  ...mvpModules.map(m => ({ title: m.title, emoji: m.emoji, description: m.description, inMVP: true, phase: "MVP" as const })),
  ...phase2Modules.map(m => ({ title: m.title, emoji: m.emoji, description: m.description, inMVP: false, phase: "Phase 2" as const })),
  ...v11Modules.map(m => ({ title: m.title, emoji: m.emoji, description: m.description, inMVP: false, phase: "v1.1" as const })),
  { title: "Data Collection", emoji: "🗄️", description: "Well data ingestion from Oklahoma & Texas databases", inMVP: false, phase: "v1.1" as const },
  { title: "Geological Analysis", emoji: "🗺️", description: "AI seismic analysis, well logs, 3D geological modeling", inMVP: false, phase: "v1.1" as const },
  { title: "Real-Time Monitor", emoji: "📡", description: "Live SCADA data monitoring dashboard", inMVP: false, phase: "Phase 2" as const },
  { title: "Telemetry Architecture", emoji: "🔗", description: "IoT data pipeline architecture and design", inMVP: false, phase: "Phase 2" as const },
  { title: "SPT Treatment", emoji: "🔧", description: "Hydro-slotting technology configuration (Patent US8863823)", inMVP: false, phase: "v1.1" as const },
  { title: "Reports", emoji: "✅", description: "Automated report generation and export", inMVP: false, phase: "v1.1" as const },
  { title: "SaaS Business Model", emoji: "💼", description: "Subscription tiers, pricing, and go-to-market strategy", inMVP: false, phase: "v1.1" as const },
  { title: "Architecture", emoji: "🏗️", description: "System architecture overview and tech stack documentation", inMVP: false, phase: "v1.1" as const },
];

const MVPScope = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">MVP Scope & Roadmap</h1>
            <p className="text-sm text-muted-foreground">AI Smart Well SGOM — Module Priority Map</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-12 max-w-6xl">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Rocket className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-primary">10</p>
              <p className="text-sm text-muted-foreground">MVP Modules</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-primary">${(mvpModules.reduce((s, m) => s + m.budget, 0) / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">Total Budget</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-yellow-500">3</p>
              <p className="text-sm text-muted-foreground">Phase 2</p>
            </CardContent>
          </Card>
          <Card className="border-muted-foreground/30 bg-muted/30">
            <CardContent className="pt-6 text-center">
              <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-3xl font-bold text-muted-foreground">2</p>
              <p className="text-sm text-muted-foreground">v1.1 Secondary</p>
            </CardContent>
          </Card>
        </div>

        {/* MVP Core with detailed specs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Essential MVP</h2>
              <p className="text-sm text-muted-foreground">Data-to-Recommendation Pipeline — must ship</p>
            </div>
          </div>

          <div className="space-y-4">
            {mvpModules.map((mod) => (
              <Collapsible key={mod.title}>
                <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <mod.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{mod.stage}</Badge>
                            {mod.dependencies.length > 0 && (
                              <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                                {mod.dependencies.length} dep{mod.dependencies.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">
                          ${mod.budget.toLocaleString()}
                        </Badge>
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 pb-5 space-y-4 border-t border-border/40 pt-4">
                      {/* Inputs */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📥 Inputs</p>
                        <ul className="space-y-1">
                          {mod.inputs.map((inp, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">•</span> {inp}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Outputs */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📤 Outputs</p>
                        <ul className="space-y-1">
                          {mod.outputs.map((out, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <span className="text-primary mt-0.5">→</span> {out}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Acceptance Criteria */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">✅ Acceptance Criteria</p>
                        <ul className="space-y-1">
                          {mod.acceptance.map((acc, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {acc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dependencies */}
                      {mod.dependencies.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">🔗 Dependencies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {mod.dependencies.map((dep) => (
                              <Badge key={dep} variant="outline" className="text-[10px] border-primary/30 text-primary/80">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* Phase 2 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Phase 2 — Post-MVP</h2>
              <p className="text-sm text-muted-foreground">Requires external infrastructure or hardware</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phase2Modules.map((mod) => (
              <Card key={mod.title} className="border-yellow-500/20 opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <mod.icon className="h-5 w-5 text-yellow-500" />
                    </div>
                    <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                  <p className="text-[11px] text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {mod.reason}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* v1.1 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">v1.1 — Secondary</h2>
              <p className="text-sm text-muted-foreground">Nice-to-have, not blocking launch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {v11Modules.map((mod) => (
              <Card key={mod.title} className="border-muted opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <mod.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Clarifications */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🔧 Technical Clarifications</h2>
              <p className="text-sm text-muted-foreground">Agreed architecture decisions for MVP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                   <CardTitle className="text-sm">Python ML Service (Modules 4, 5)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Dedicated FastAPI inference service instead of Deno Edge Functions for ML models.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Hosted on AWS/GCP</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Edge Functions call ML API</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Gemini retained for text analysis</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Agreed</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                   <CardTitle className="text-sm">Texas API Integration (Module 2)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Texas RRC has no REST API — custom ETL pipeline required.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" /> Additional 2–3 weeks</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Within $125K budget</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Normalized to Oklahoma schema</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-600 dark:text-yellow-400">⚠️ +2-3 weeks</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" />
                   <CardTitle className="text-sm">Reservoir Simulation (Module 9)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">MVP: analytical models. Physics simulator — post-MVP.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Material balance, decline analysis</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Recovery factors</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Physics solver — Phase 2</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Agreed</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                   <CardTitle className="text-sm">IoT / Telemetry (Modules 11–12)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">MVP: API + MQTT + software simulator. SCADA — post-MVP.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Ingestion API + MQTT endpoint</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Device structure + simulator</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> SCADA — Phase 2</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Agreed</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                   <CardTitle className="text-sm">Billing / Payments (Module 13)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Admin UI + subscription structure. Stripe — optional.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> Admin panel + pricing tiers</div>
                  <div className="flex items-start gap-2 text-xs"><AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" /> Stripe automation: +2-3 weeks</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Recommendation: manual billing</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-600 dark:text-yellow-400">⚠️ Decision required</Badge>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Security Audit (Milestone 6)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">MVP: internal audit. Full pentest — post-launch.</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> RLS policies audit</div>
                  <div className="flex items-start gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /> API protection + access control</div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3 w-3 mt-0.5 shrink-0" /> Third-party pentest — post-launch</div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">✅ Agreed</Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 border-muted">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">📎 Additional Commitments</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> API документация (OpenAPI/Swagger)</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Full mobile responsiveness</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Investor Deck & Budget pages</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> Technical documentation for handover</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Comparison Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2">📋 Module Comparison Analysis</h2>
          <p className="text-sm text-muted-foreground mb-6">All SGOM platform modules vs MVP inclusion status</p>

          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Module</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold text-center">MVP Status</TableHead>
                  <TableHead className="font-bold text-center">Phase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allModulesComparison.map((mod) => (
                  <TableRow key={mod.title}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <span className="mr-1.5">{mod.emoji}</span>{mod.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">{mod.description}</TableCell>
                    <TableCell className="text-center">
                      {mod.inMVP ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">✅ Included</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">❌ Deferred</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        mod.phase === "MVP" && "border-primary/40 text-primary",
                        mod.phase === "Phase 2" && "border-yellow-500/40 text-yellow-600 dark:text-yellow-400",
                        mod.phase === "v1.1" && "border-muted-foreground/40 text-muted-foreground",
                      )}>{mod.phase}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <span>✅ In MVP: <strong className="text-primary">{allModulesComparison.filter(m => m.inMVP).length}</strong></span>
            <span>❌ Deferred: <strong>{allModulesComparison.filter(m => !m.inMVP).length}</strong></span>
            <span>Total modules: <strong>{allModulesComparison.length}</strong></span>
          </div>
        </section>

        {/* Pipeline flow */}
        <section>
          <h2 className="text-xl font-bold mb-4">MVP Pipeline Flow</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {mvpModules.slice(0, 7).map((mod, i) => (
              <div key={mod.title} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium text-xs">
                  {mod.emoji} {mod.title}
                </span>
                {i < 6 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MVPScope;
