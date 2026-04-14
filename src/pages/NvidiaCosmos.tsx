import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CosmosPredictDemo from "@/components/cosmos/CosmosPredictDemo";
import CosmosReasonDemo from "@/components/cosmos/CosmosReasonDemo";
import CosmosTransferDemo from "@/components/cosmos/CosmosTransferDemo";
import {
  ArrowLeft,
  Brain,
  Eye,
  Zap,
  Database,
  TrendingUp,
  Target,
  Layers,
  GitBranch,
  BarChart3,
  Cpu,
  Globe,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Activity,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const cosmosModules = [
  {
    id: "predict",
    title: "Cosmos Predict",
    subtitle: "Post-SPT Formation Behavior Prediction",
    icon: Eye,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    iconColor: "text-green-400",
    badgeColor: "bg-green-500/20 text-green-400",
    description:
      "Feed the model current well state (logs, production, formation properties) — predict formation behavior after SPT perforation before Maxxwell physically arrives on site.",
    capabilities: [
      "Predict post-SPT inflow increase based on formation physics",
      "Simulate fracture propagation and drainage area expansion",
      "Forecast water cut evolution after treatment",
      "Estimate production uplift timeline (30/90/180/365 days)",
    ],
    techDetails: [
      "Input: well logs (GR, RT, NPHI, RHOB) + production history",
      'Cosmos treats depth as "time axis" — physics-aware temporal model',
      "Output: predicted log curves + production forecast post-SPT",
      "Validated against 500+ historical SPT treatments",
    ],
    useCase:
      "Engineer uploads LAS file for Well #5 → Cosmos Predict generates expected post-SPT log response → Platform calculates ROI before treatment decision.",
  },
  {
    id: "transfer",
    title: "Cosmos Transfer",
    subtitle: "Synthetic Well Log Generation",
    icon: Database,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    badgeColor: "bg-blue-500/20 text-blue-400",
    description:
      "Limited data in a new region? The model generates physically plausible synthetic well logs — like adding 50 wells to the training set without drilling.",
    capabilities: [
      "Generate synthetic well logs for underexplored regions",
      "Augment training datasets for ML models (10× data multiplication)",
      "Preserve geological consistency across formations",
      "Cross-basin knowledge transfer (Anadarko → Permian → Mid-Continent)",
    ],
    techDetails: [
      "World Foundation Model trained on 20M hours of physical-world video",
      "Understands material properties, fluid dynamics, wave propagation",
      "Generates petrophysically consistent synthetic curves",
      "Validated via blind tests against withheld real well data",
    ],
    useCase:
      "Oklahoma Pilot has 12 wells → Cosmos Transfer generates 50 synthetic analogs → ML model trains on 62 wells → prediction accuracy increases from 72% to 91%.",
  },
  {
    id: "reason",
    title: "Cosmos Reason",
    subtitle: "Explainable AI Reasoning Chain",
    icon: MessageSquare,
    color: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
    badgeColor: "bg-purple-500/20 text-purple-400",
    description:
      'Chain-of-thought reasoning module. When an engineer or investor asks "Why is Well #5 the best candidate?" — they get a human-readable explanation, not just a number.',
    capabilities: [
      "Natural language explanations for every AI recommendation",
      "Step-by-step reasoning chain from data to conclusion",
      "Multi-factor attribution (geology + production + economics)",
      "Investor-grade reports with full decision audit trail",
    ],
    techDetails: [
      "Chain-of-thought reasoning over physics-grounded representations",
      "Integrates MCDA scores, geological context, and economic metrics",
      "Outputs structured explanations with confidence intervals",
      "Supports follow-up questions and drilling into specific factors",
    ],
    useCase:
      'Investor asks: "Why Well #5 over Well #3?" → Cosmos Reason: "Well #5 has 15% higher porosity in target zone (12.3% vs 10.7%), 40% lower water cut trajectory, and Mississippian Limestone responds 2.3× better to SPT historically."',
  },
];

const pipelineStages = [
  { stage: "1", name: "Field Scanning", cosmos: "Transfer", desc: "Generate synthetic data for sparse regions" },
  { stage: "2", name: "Data Classification", cosmos: "Reason", desc: "Explain classification decisions" },
  { stage: "3", name: "Cumulative Analysis", cosmos: "Predict", desc: "Forecast cumulative production curves" },
  { stage: "4", name: "SPT Projection", cosmos: "Predict", desc: "Simulate post-treatment behavior" },
  { stage: "5", name: "Economic Analysis", cosmos: "Reason", desc: "Justify ROI calculations" },
  { stage: "6", name: "Well Ranking", cosmos: "Reason", desc: "Explain ranking methodology" },
  { stage: "7", name: "Geophysical", cosmos: "Transfer", desc: "Augment well log training data" },
  { stage: "8", name: "Core Analysis", cosmos: "Predict", desc: "Predict core properties from logs" },
  { stage: "9", name: "EOR Optimization", cosmos: "Predict", desc: "Optimize treatment parameters" },
];

const NvidiaCosmos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">NVIDIA Cosmos Integration</h1>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">World Foundation Model</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Physics-aware AI for well analysis & SPT optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30">
              <Cpu className="h-3 w-3 mr-1" />
              NVIDIA Inception Member
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <Card className="glass-card border-primary/20 overflow-hidden">
          <div className="relative p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5" />
            <div className="relative grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Next-Generation AI
                </Badge>
                <h2 className="text-3xl font-bold">
                  World Foundation Model for Oil & Gas
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  NVIDIA trained Cosmos on <span className="text-foreground font-semibold">20 million hours</span> of
                  real-world physics video — robots, factories, object motion. The model learned to understand physics:
                  what happens next if you take this action.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Well logs are essentially <span className="text-foreground font-semibold">time series of formation properties along depth</span>.
                  Depth = time. Formation = physical medium. Cosmos is built for exactly this type of data.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Eye, label: "Predict", desc: "Post-SPT formation behavior", color: "text-green-400" },
                  { icon: Database, label: "Transfer", desc: "Synthetic well log generation", color: "text-blue-400" },
                  { icon: MessageSquare, label: "Reason", desc: "Explainable AI decisions", color: "text-purple-400" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${m.color}`}>
                      <m.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Cosmos {m.label}</div>
                      <div className="text-sm text-muted-foreground">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Three Module Cards */}
        <Tabs defaultValue="predict" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="predict" className="gap-2">
              <Eye className="h-4 w-4" /> Predict
            </TabsTrigger>
            <TabsTrigger value="transfer" className="gap-2">
              <Database className="h-4 w-4" /> Transfer
            </TabsTrigger>
            <TabsTrigger value="reason" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Reason
            </TabsTrigger>
          </TabsList>

          {cosmosModules.map((mod) => (
            <TabsContent key={mod.id} value={mod.id}>
              <Card className={`glass-card ${mod.borderColor}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center`}>
                      <mod.icon className={`h-7 w-7 ${mod.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{mod.title}</CardTitle>
                      <CardDescription>{mod.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">{mod.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" /> Capabilities
                      </h4>
                      <ul className="space-y-2">
                        {mod.capabilities.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ArrowRight className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-400" /> Technical Details
                      </h4>
                      <ul className="space-y-2">
                        {mod.techDetails.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Zap className="h-3 w-3 mt-1 text-yellow-400 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-400" /> Use Case
                    </h4>
                    <p className="text-sm text-muted-foreground italic">{mod.useCase}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Cosmos Predict Interactive Demo */}
        <div style={{ minHeight: 200 }}>
          <CosmosPredictDemo />
        </div>

        {/* Cosmos Transfer Interactive Demo */}
        <div style={{ minHeight: 200 }}>
          <CosmosTransferDemo />
        </div>

        {/* Cosmos Reason Interactive Demo */}
        <div style={{ minHeight: 200 }}>
          <CosmosReasonDemo />
        </div>

        {/* Pipeline Integration Map */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Cosmos × SGOM Pipeline Integration
            </CardTitle>
            <CardDescription>
              How each Cosmos module maps to the 9-stage well analysis pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {pipelineStages.map((s) => {
                const colorMap: Record<string, string> = {
                  Predict: "bg-green-500/20 text-green-400 border-green-500/30",
                  Transfer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  Reason: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                };
                return (
                  <div key={s.stage} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors">
                    <Badge variant="outline" className="w-12 justify-center font-mono">
                      S{s.stage}
                    </Badge>
                    <span className="font-medium w-40 flex-shrink-0">{s.name}</span>
                    <Badge className={`${colorMap[s.cosmos]} flex-shrink-0`}>
                      {s.cosmos}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{s.desc}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Architecture Overview */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Integration Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Data Layer */}
              <div className="space-y-3">
                <h4 className="font-semibold text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  Data Layer
                </h4>
                {["Well Logs (LAS/DLIS)", "Production History", "Core Images (CV)", "Seismic Data"].map((item) => (
                  <div key={item} className="text-sm text-center p-2 rounded bg-muted/30 border border-border/30">
                    {item}
                  </div>
                ))}
              </div>

              {/* Cosmos Layer */}
              <div className="space-y-3">
                <h4 className="font-semibold text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                  NVIDIA Cosmos Layer
                </h4>
                {[
                  { name: "Cosmos Predict", desc: "Physics simulation" },
                  { name: "Cosmos Transfer", desc: "Data augmentation" },
                  { name: "Cosmos Reason", desc: "Chain-of-thought" },
                ].map((item) => (
                  <div key={item.name} className="text-sm text-center p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Output Layer */}
              <div className="space-y-3">
                <h4 className="font-semibold text-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  Output Layer
                </h4>
                {["SPT Candidacy Score", "Production Forecast", "ROI Projection", "Explainable Reports"].map((item) => (
                  <div key={item} className="text-sm text-center p-2 rounded bg-muted/30 border border-border/30">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Training Data", value: "20M hrs", icon: Activity },
                { label: "Prediction Accuracy", value: "91%+", icon: Target },
                { label: "Data Augmentation", value: "10×", icon: TrendingUp },
                { label: "Inference Speed", value: "<2s", icon: Zap },
              ].map((m) => (
                <div key={m.label} className="text-center p-4 rounded-xl bg-muted/20 border border-border/30">
                  <m.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategic Value */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Strategic Value for NVIDIA Capital Connect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Why Cosmos × SGOM</h4>
                <ul className="space-y-3">
                  {[
                    "First oil & gas platform to integrate World Foundation Model",
                    "GPU-native pipeline: NIM → Triton → Cosmos → DGX Cloud",
                    "Demonstrates NVIDIA AI stack depth beyond basic inference",
                    "Aligns with NVIDIA's industrial digitization thesis",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Competitive Moat</h4>
                <ul className="space-y-3">
                  {[
                    "No competitor integrates physics-aware foundation models",
                    "Proprietary SPT treatment data for fine-tuning (500+ wells)",
                    "Patent US 8,863,823 ensures unique technology synergy",
                    "Cost advantage: $200–$500/report vs $50K+ enterprise solutions",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4 mt-0.5 text-yellow-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NvidiaCosmos;
