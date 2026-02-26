import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Rocket, Layers, Shield, Brain, Radio, Microscope, BarChart3, Target, DollarSign, Settings, FolderSearch, TrendingDown, Radar, Activity, GraduationCap, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const mvpModules = [
  {
    stage: "Stage 1",
    title: "Field Scanning",
    icon: Radar,
    description: "Satellite imagery + well location mapping for field overview",
    emoji: "🛰️",
  },
  {
    stage: "Stage 2",
    title: "Data Classification",
    icon: FolderSearch,
    description: "Automated categorization and quality scoring of well data",
    emoji: "📂",
  },
  {
    stage: "Stage 3",
    title: "Cumulative Analysis",
    icon: TrendingDown,
    description: "Production decline curves and cumulative output analysis",
    emoji: "📈",
  },
  {
    stage: "Stage 4",
    title: "AI Well Selection & Ranking",
    icon: Target,
    description: "ML-driven candidate ranking for SPT treatment",
    emoji: "🎯",
  },
  {
    stage: "Stage 5",
    title: "Economic Analysis",
    icon: DollarSign,
    description: "ROI modeling, NPV/IRR calculations per well candidate",
    emoji: "💵",
  },
  {
    stage: "Stage 7",
    title: "SPT Parameters",
    icon: Settings,
    description: "Treatment slot configuration and chemical dosage optimization",
    emoji: "⚙️",
  },
  {
    stage: "Stage 6",
    title: "Geophysical Expertise",
    icon: Activity,
    description: "Well log analysis with AI interpretation and formation evaluation",
    emoji: "📊",
  },
  {
    stage: "Core",
    title: "Core Analysis (CV)",
    icon: Microscope,
    description: "Computer vision for core sample classification and geological interpretation",
    emoji: "🔬",
  },
  {
    stage: "Core",
    title: "EOR Optimization",
    icon: Brain,
    description: "AI-driven Enhanced Oil Recovery optimization through automated geological analysis and SPT well selection",
    emoji: "🧠",
  },
  {
    stage: "Core",
    title: "Multi-Tenant Auth",
    icon: Building2,
    description: "Company-based access control, user management, RLS policies",
    emoji: "🏢",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Rocket className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-primary">10</p>
              <p className="text-sm text-muted-foreground">MVP Modules</p>
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

        {/* MVP Core */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Essential MVP</h2>
              <p className="text-sm text-muted-foreground">Data-to-Recommendation Pipeline — must ship</p>
            </div>
            <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">$125K scope</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mvpModules.map((mod) => (
              <Card key={mod.title} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <mod.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-[10px] mb-1">{mod.stage}</Badge>
                      <CardTitle className="text-sm">{mod.emoji} {mod.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                </CardContent>
              </Card>
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

        {/* Comparison Table */}
        <section>
          <h2 className="text-2xl font-bold mb-2">📋 Сравнительный анализ модулей</h2>
          <p className="text-sm text-muted-foreground mb-6">Все модули платформы SGOM vs статус включения в MVP</p>

          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Модуль</TableHead>
                  <TableHead className="font-bold">Описание</TableHead>
                  <TableHead className="font-bold text-center">Статус в MVP</TableHead>
                  <TableHead className="font-bold text-center">Фаза</TableHead>
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
                        <Badge className="bg-primary/20 text-primary border-primary/30">✅ Включён</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">❌ Нет</Badge>
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
            <span>✅ В MVP: <strong className="text-primary">{allModulesComparison.filter(m => m.inMVP).length}</strong></span>
            <span>❌ Отложено: <strong>{allModulesComparison.filter(m => !m.inMVP).length}</strong></span>
            <span>Всего модулей: <strong>{allModulesComparison.length}</strong></span>
          </div>
        </section>

        {/* Pipeline flow */}
        <section>
          <h2 className="text-xl font-bold mb-4">MVP Pipeline Flow</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {mvpModules.slice(0, 6).map((mod, i) => (
              <div key={mod.title} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium text-xs">
                  {mod.emoji} {mod.title}
                </span>
                {i < 5 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MVPScope;
