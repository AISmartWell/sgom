import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Copy,
  FileText,
  Video,
  Monitor,
  Brain,
  Eye,
  Target,
  TrendingUp,
  BarChart3,
  Cpu,
  Database,
  Globe,
  CheckCircle2,
  Users,
  Zap,
  Play,
  Clock,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import nvidiaLogoBw from "@/assets/nvidia-logo-bw.png";
import nvidiaInceptionBadge from "@/assets/nvidia-inception-badge.jpg";

const NvidiaShowcase = () => {
  const navigate = useNavigate();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const productProfile = `AI Smart Well (SGOM Platform)

Industry: Oil & Gas / Energy Technology
Product Type: SaaS Platform (B2B)
Stage: MVP Development (Phase 1)

DESCRIPTION:
AI Smart Well is an AI-powered SaaS platform for optimizing Enhanced Oil Recovery (EOR) using patented Slot Perforation Technology (SPT, US Patent 8,863,823). The platform combines computer vision, machine learning, and geological analysis to automate well selection, production forecasting, and treatment optimization.

PROBLEM:
Oil & gas operators spend weeks manually analyzing well data, geological reports, and production histories to identify candidates for production enhancement. This process is error-prone, expensive, and often results in suboptimal well selection.

SOLUTION:
Our 10-module pipeline automates the entire workflow — from satellite field scanning and data classification to AI-powered well ranking, economic analysis, and EOR optimization. We reduce decision time from weeks to minutes with 94% accuracy in well candidate selection.

KEY METRICS:
• 10+ functional AI modules in production
• 15,000+ wells analyzed across Oklahoma & Texas
• 94% accuracy in AI well ranking
• 5-20x production increase potential with SPT
• 312% projected ROI, 7-8 month payback

NVIDIA TECHNOLOGIES USED:
• NVIDIA API Catalog — Computer vision for geological core sample analysis (rock classification, porosity estimation, fracture detection)
• DGX Cloud (planned) — Custom model training for well log interpretation
• RAPIDS (planned) — GPU-accelerated processing of seismic datasets
• NGC Containers (planned) — Pre-trained models for geological image segmentation
• DLI — Team certification in CUDA, TensorRT, LLM fine-tuning

TEAM:
• Anatoliy Nikouline — CEO & SPT Engineer, Maxxwell Production (10+ years field experience, patent inventor)
• Alexander Alishoev — Lead Developer, Full-Stack & AI/ML Architecture
• Edward Rubinstein — Business Strategy
• Maxxwell Production — Technology Partner (since 2012, worked with Chevron, Baker Hughes, Halliburton)

WEBSITE: https://www.aismartwellsgom.com
NVIDIA INCEPTION: Official Member`;

  const videoScript = [
    {
      time: "0:00–0:15",
      scene: "Opening",
      action: "Landing page (/) — Logo animation, hero section with 'AI-Powered Well Optimization'",
      narration: "AI Smart Well is an NVIDIA Inception member company developing an AI-powered SaaS platform for the oil and gas industry.",
      route: "/",
    },
    {
      time: "0:15–0:30",
      scene: "Dashboard Overview",
      action: "Navigate to /dashboard — Show stats cards (15,847 wells, 847 high potential, 312% ROI), module grid",
      narration: "Our platform features 10 core modules that automate the entire well analysis and optimization pipeline.",
      route: "/dashboard",
    },
    {
      time: "0:30–0:50",
      scene: "Field Scanning (Stage 1)",
      action: "Open /dashboard/field-scanning — Run scan demo, show satellite imagery with GIS grid, well detection",
      narration: "Stage 1: Automated field scanning uses satellite imagery to identify and catalog wells across the Permian and Anadarko basins.",
      route: "/dashboard/field-scanning",
    },
    {
      time: "0:50–1:10",
      scene: "Core Analysis — Computer Vision",
      action: "Open /dashboard/core-analysis — Upload core sample image, show CV pipeline stages (preprocessing → edge detection → segmentation → classification)",
      narration: "Our Computer Vision module, powered by NVIDIA technology, analyzes geological core samples — classifying rock types, estimating porosity, and detecting fractures in under 5 seconds.",
      route: "/dashboard/core-analysis",
    },
    {
      time: "1:10–1:30",
      scene: "AI Well Selection",
      action: "Open /dashboard/well-selection — Click 'Run AI Selection', show ranking table with scores, map visualization",
      narration: "The AI Well Selection engine ranks treatment candidates using multi-factor analysis with 94% accuracy, processing thousands of wells in seconds.",
      route: "/dashboard/well-selection",
    },
    {
      time: "1:30–1:50",
      scene: "Economic Analysis",
      action: "Open /dashboard/economic-analysis — Show ROI calculations, NPV/IRR metrics, cumulative profit chart",
      narration: "Every candidate receives a complete economic evaluation — NPV, IRR, payback period, and sensitivity analysis with real-time oil price integration.",
      route: "/dashboard/economic-analysis",
    },
    {
      time: "1:50–2:10",
      scene: "EOR Optimization Hub",
      action: "Open /dashboard/eor-optimization — Show 7-stage pipeline, prospect wells, SPT Parameters tab",
      narration: "The EOR Optimization hub aggregates all modules into a unified decision-making dashboard with treatment recommendations.",
      route: "/dashboard/eor-optimization",
    },
    {
      time: "2:10–2:30",
      scene: "NVIDIA Integration & Closing",
      action: "Open /nvidia-inception — Show AI components, NVIDIA resources, roadmap",
      narration: "As an NVIDIA Inception member, we're building on DGX Cloud, TensorRT, and RAPIDS to scale our AI infrastructure for enterprise deployment.",
      route: "/nvidia-inception",
    },
  ];

  const showcaseModules = [
    { name: "Field Scanning", emoji: "🛰️", stage: "Stage 1", route: "/dashboard/field-scanning", nvidia: false, description: "Satellite imagery + GIS grid well detection" },
    { name: "Data Classification", emoji: "📂", stage: "Stage 2", route: "/dashboard/data-classification", nvidia: false, description: "Automated well data categorization" },
    { name: "Cumulative Analysis", emoji: "📈", stage: "Stage 3", route: "/dashboard/cumulative-analysis", nvidia: false, description: "Decline curve analysis & reserve estimation" },
    { name: "AI Well Selection", emoji: "🎯", stage: "Stage 4", route: "/dashboard/well-selection", nvidia: true, description: "ML-driven candidate ranking" },
    { name: "Economic Analysis", emoji: "💵", stage: "Stage 5", route: "/dashboard/economic-analysis", nvidia: false, description: "NPV, IRR, ROI calculations" },
    { name: "Geophysical Expertise", emoji: "🔬", stage: "Stage 6", route: "/dashboard/geophysical", nvidia: true, description: "AI well log interpretation" },
    { name: "Core Analysis (CV)", emoji: "🔬", stage: "Stage 10", route: "/dashboard/core-analysis", nvidia: true, description: "NVIDIA Computer Vision for rock analysis" },
    { name: "EOR Optimization", emoji: "🧠", stage: "Stage 8", route: "/dashboard/eor-optimization", nvidia: true, description: "Central hub — all modules aggregated" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/nvidia-inception")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NVIDIA Inception
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={nvidiaLogoBw} alt="NVIDIA" className="h-12 w-12 rounded-xl object-contain" />
              <div>
                <h1 className="text-2xl font-bold">NVIDIA Inception — Upload Kit</h1>
                <p className="text-muted-foreground">Product Profile, Video Script & Visual Showcase</p>
              </div>
            </div>
            <img src={nvidiaInceptionBadge} alt="NVIDIA Inception" className="h-10 object-contain" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <FileText className="h-4 w-4" />
              Product Profile
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="h-4 w-4" />
              Video Script
            </TabsTrigger>
            <TabsTrigger value="showcase" className="gap-2">
              <Monitor className="h-4 w-4" />
              Showcase
            </TabsTrigger>
          </TabsList>

          {/* Product Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-[#76B900]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#76B900]" />
                      Product Profile — Ready to Copy
                    </CardTitle>
                    <CardDescription>Copy this text directly into your NVIDIA Inception profile</CardDescription>
                  </div>
                  <Button onClick={() => copyToClipboard(productProfile, "Product Profile")} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground bg-muted/30 rounded-lg p-6 font-mono">
                  {productProfile}
                </pre>
              </CardContent>
            </Card>

            {/* Quick Facts Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Brain, label: "AI Modules", value: "10+", color: "text-[#76B900]" },
                { icon: Database, label: "Wells Analyzed", value: "15,000+", color: "text-primary" },
                { icon: Target, label: "AI Accuracy", value: "94%", color: "text-success" },
                { icon: TrendingUp, label: "Production Uplift", value: "5-20×", color: "text-accent" },
              ].map((stat) => (
                <Card key={stat.label} className="text-center">
                  <CardContent className="pt-6">
                    <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Video Script Tab */}
          <TabsContent value="video" className="space-y-6">
            <Card className="border-[#76B900]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-[#76B900]" />
                  Demo Video Script — 2:30 Screencast
                </CardTitle>
                <CardDescription>
                  Record your screen navigating through these pages. Each scene has timing, what to show, and narration text.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {videoScript.map((scene, index) => (
                  <div key={index} className="group">
                    <div className="flex gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
                      {/* Timeline */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-[#76B900]/20 flex items-center justify-center">
                          <Play className="h-4 w-4 text-[#76B900]" />
                        </div>
                        {index < videoScript.length - 1 && (
                          <div className="w-0.5 flex-1 mt-2 bg-border" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            {scene.time}
                          </Badge>
                          <span className="font-semibold">{scene.scene}</span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Monitor className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{scene.action}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-[#76B900] mt-0.5 flex-shrink-0">🎙️</span>
                            <span className="italic text-foreground/80">"{scene.narration}"</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs text-muted-foreground"
                          onClick={() => navigate(scene.route)}
                        >
                          <MapPin className="mr-1 h-3 w-3" />
                          Open {scene.route}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Video Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📹 Recording Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    Use OBS Studio or Loom for screen recording (1920×1080)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    Open the platform in Chrome, dark mode, fullscreen (F11)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    Click through each module slowly — pause 2-3 seconds on key visualizations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    Mention "NVIDIA" when showing Core Analysis and NVIDIA Integration page
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    Keep total duration under 3 minutes for NVIDIA Inception profile
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Showcase Tab */}
          <TabsContent value="showcase" className="space-y-6">
            {/* Platform Stats Banner */}
            <Card className="bg-gradient-to-r from-[#76B900]/10 via-primary/5 to-accent/10 border-[#76B900]/30">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <img src={nvidiaInceptionBadge} alt="NVIDIA Inception" className="h-16 mx-auto object-contain" />
                  <h2 className="text-3xl font-bold">AI Smart Well — SGOM Platform</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    AI-powered SaaS platform for Enhanced Oil Recovery optimization.
                    NVIDIA Inception member leveraging GPU-accelerated computer vision and ML.
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap pt-2">
                    {["NVIDIA Inception", "Computer Vision", "Machine Learning", "SaaS B2B", "Oil & Gas"].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Showcase Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#76B900]" />
                Core Modules — Click to Demo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {showcaseModules.map((mod) => (
                  <Card
                    key={mod.name}
                    className={`cursor-pointer hover:border-[#76B900]/50 transition-all hover:shadow-lg hover:shadow-[#76B900]/5 ${mod.nvidia ? "border-[#76B900]/30" : ""}`}
                    onClick={() => navigate(mod.route)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{mod.emoji}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[10px]">{mod.stage}</Badge>
                          {mod.nvidia && (
                            <Badge className="bg-[#76B900] text-[10px]">NVIDIA</Badge>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{mod.name}</h4>
                      <p className="text-xs text-muted-foreground">{mod.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Team Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team — Add to NVIDIA Inception
                </CardTitle>
                <CardDescription>Add these team members to your NVIDIA Inception account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Anatoliy Nikouline",
                      role: "CEO & SPT Engineer",
                      company: "Maxxwell Production",
                      detail: "Patent inventor (US 8,863,823), 10+ years field experience. Add as Founder/CEO.",
                    },
                    {
                      name: "Alexander Alishoev",
                      role: "Lead Developer",
                      company: "AI Smart Well",
                      detail: "Full-stack & AI/ML architecture. Add as CTO/Technical Lead.",
                    },
                    {
                      name: "Edward Rubinstein",
                      role: "Business Strategy",
                      company: "AI Smart Well",
                      detail: "Business development & investor relations. Add as Business Advisor.",
                    },
                  ].map((member) => (
                    <div key={member.name} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-sm text-[#76B900]">{member.role}</div>
                      <div className="text-xs text-muted-foreground mb-2">{member.company}</div>
                      <Separator className="my-2" />
                      <div className="text-xs text-muted-foreground">{member.detail}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card className="border-[#76B900]/30">
              <CardHeader>
                <CardTitle className="text-base">✅ Upload Checklist for NVIDIA Inception</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Update Product Profile — copy text from 'Product Profile' tab",
                    "Add team members — Anatoliy (CEO), Alexander (CTO), Edward (Business)",
                    "Upload demo video (2:30 screencast following the script)",
                    "Add platform URL: https://www.aismartwellsgom.com",
                    "Update Technology Usage: NVIDIA API Catalog, DGX Cloud (planned), RAPIDS (planned)",
                    "Set workloads: Data Science, Developer Tools, Edge Computing, Agentic/Generative AI",
                    "Add logo and screenshots of key modules (Core Analysis, Well Selection, EOR)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <div className="h-5 w-5 rounded border border-border flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NvidiaShowcase;
