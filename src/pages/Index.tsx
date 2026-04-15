import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Droplets, ArrowRight, BarChart3, Target, Cpu, FileText, Zap, TrendingUp, Shield, Lightbulb, Play } from "lucide-react";
import nvidiaInceptionBadgeBw from "@/assets/nvidia-inception-badge-bw.png";
import horizontalWellVideoAsset from "@/assets/horizontal-well-video.mp4.asset.json";

const pipelineStages = [
  { emoji: "🛰️", stage: 1, title: "Field Scanning", desc: "Automated satellite imagery analysis & well detection across oil fields with weekly scan cycles", path: "/dashboard/field-scanning" },
  { emoji: "📂", stage: 2, title: "Data Classification", desc: "AI-driven well data categorization, filtering & quality scoring from 5+ state databases", path: "/dashboard/data-classification" },
  { emoji: "📈", stage: 3, title: "Cumulative Analysis", desc: "Production decline curve modeling, reserve estimation & depletion trend analysis", path: "/dashboard/cumulative-analysis" },
  { emoji: "🚀", stage: 4, title: "SPT Projection", desc: "AI well ranking & inflow performance projection for SPT treatment candidates", path: "/dashboard/spt-projection" },
  { emoji: "💵", stage: 5, title: "Economic Analysis", desc: "ROI calculation, payback period modeling & profit projection per well candidate", path: "/dashboard/economic-analysis" },
  { emoji: "📊", stage: 6, title: "Geophysical Expertise", desc: "Well log interpretation, formation evaluation & pay zone detection with petrophysics", path: "/dashboard/geophysical" },
  { emoji: "🔬", stage: 7, title: "Core Analysis", desc: "Computer vision rock analysis powered by NVIDIA — porosity, permeability, fractures", path: "/dashboard/core-analysis" },
  { emoji: "🧠", stage: 8, title: "EOR Optimization", desc: "Final treatment recommendations combining all stages into actionable field reports", path: "/dashboard/eor-optimization" },
];

const additionalModules = [
  { emoji: "📡", title: "Data Collection & Import", desc: "Integration with OCC, Texas RRC & KGS databases. CSV/Excel upload, manual entry & ArcGIS API", path: "/dashboard/data-collection" },
  { emoji: "🗺️", title: "Seismic Reinterpretation", desc: "AI reinterprets seismic data to detect bypassed reserves — 20-40% of missed hydrocarbons in mature fields. Auto rock classification, anomaly detection & DHI mapping", path: "/dashboard/geological-analysis" },
  { emoji: "🎯", title: "AI Well Selection", desc: "ML-based well ranking by production potential with 94% accuracy", path: "/dashboard/well-selection" },
  { emoji: "💰", title: "Financial Forecast", desc: "Investment ROI calculator, scenario modeling & project-level financial analysis", path: "/dashboard/financial" },
  { emoji: "🔧", title: "SPT Treatment", desc: "Patented hydro-slotting technology (US 8,863,823) for marginal well revival — 5-10x production boost", path: "/dashboard/spt-treatment" },
  { emoji: "⚙️", title: "Automation Center", desc: "Alert monitoring, auto-linking triggers & full pipeline automation with real-time status", path: "/dashboard/automation" },
];

const advantages = [
  {
    icon: TrendingUp,
    title: "Maximize Production",
    desc: "AI algorithms identify highest-potential well locations and optimal treatment parameters, turning marginal wells into profitable assets.",
    color: "primary" as const,
  },
  {
    icon: Zap,
    title: "Reduce Costs & Risk",
    desc: "Data-driven decisions eliminate guesswork. Predict ROI before investing, reducing dry hole risk and operational expenses.",
    color: "accent" as const,
  },
  {
    icon: Shield,
    title: "Patented SPT Technology",
    desc: "US Patent 8,863,823 — Slot Perforating Technology with decades of verified field results. Proven to revive declining wells.",
    color: "success" as const,
  },
  {
    icon: Lightbulb,
    title: "NVIDIA-Powered AI",
    desc: "As an NVIDIA Inception member, we plan to leverage GPU-accelerated ML for seismic analysis and real-time forecasting.",
    color: "primary" as const,
  },
];

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    bgHover: "group-hover:bg-primary/20",
    border: "hover:border-primary/30",
    text: "text-primary",
    glow: "glow-primary",
  },
  accent: {
    bg: "bg-accent/10",
    bgHover: "group-hover:bg-accent/20",
    border: "hover:border-accent/30",
    text: "text-accent",
    glow: "",
  },
  success: {
    bg: "bg-success/10",
    bgHover: "group-hover:bg-success/20",
    border: "hover:border-success/30",
    text: "text-success",
    glow: "",
  },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ===== HERO ===== */}
      <div className="relative min-h-screen flex flex-col">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/4" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.4) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Floating orbs */}
          <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-primary-glow/6 rounded-full blur-[100px] animate-float" style={{ animationDelay: "-3s" }} />
          <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: "-1.5s" }} />
        </div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center animate-glow-pulse">
              <Droplets className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">AI Smart Well</span>
            <img
              src={nvidiaInceptionBadgeBw}
              alt="NVIDIA Inception Program"
              className="h-9 cursor-pointer hover:opacity-80 transition-opacity hidden sm:block ml-2"
              onClick={() => navigate("/nvidia-inception")}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/investor-deck")} className="text-muted-foreground hover:text-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Investor Deck
            </Button>
            <Button onClick={() => navigate("/auth")} className="glow-primary">
              Enter Platform
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-5xl mx-auto">
            <div className="animate-fade-up">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-8">
                NVIDIA Inception Member · Patented Technology
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold mb-8 leading-[0.95] tracking-tight animate-fade-up-delay-1">
              <span className="gradient-text">Innovative Solutions</span>
              <br />
              <span className="text-foreground">for Oil Production</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2">
              AI-powered platform for identifying optimal well locations, boosting production,
              cutting costs, and improving decision-making accuracy in oil & gas industry.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up-delay-3">
              <Button size="lg" onClick={() => navigate("/auth")} className="glow-primary text-base px-8 py-6">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/dashboard/simulation")} className="text-base px-8 py-6 border-border/60 hover:border-primary/40 hover:bg-primary/5">
                Learn More
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-20 max-w-3xl mx-auto animate-fade-up-delay-4">
              {[
                { icon: BarChart3, value: "15,000+", label: "Wells Analyzed", color: "text-primary" },
                { icon: Target, value: "94%", label: "AI Accuracy", color: "text-primary-glow" },
                { icon: Cpu, value: "Significant", label: "Productivity Increase", color: "text-success" },
              ].map((stat, i) => (
                <div key={i} className="glass-card-hover rounded-2xl p-6 text-center group cursor-default">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className={`text-2xl md:text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 animate-fade-up-delay-5">
          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-muted-foreground/30 flex justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-primary/60 animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== VIDEO HERO SECTION ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase">Physics-Aware Visualization</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">Reservoir Fluid Dynamics</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              AI-generated simulations of wellbore fluid behavior — from SPT treatment injection to production restoration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Horizontal Well Video */}
            <div className="group relative rounded-2xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <div className="aspect-video relative">
                <video
                  src={horizontalWellVideo}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 mb-2">
                  Horizontal Well
                </span>
                <h3 className="text-lg font-bold text-white">Drilling & Completion Visualization</h3>
                <p className="text-sm text-white/60 mt-1">Cinematic cross-section of horizontal wellbore through geological formations</p>
              </div>
            </div>

            {/* SPT Treatment Video — links to fluid simulation */}
            <div
              className="group relative rounded-2xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/fluid-simulation")}
            >
              <div className="aspect-video relative bg-gradient-to-br from-[hsl(200,25%,8%)] to-[hsl(220,30%,12%)] flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-primary ml-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">Launch Interactive Simulation</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-success border border-success/30 mb-2">
                  SPT Treatment
                </span>
                <h3 className="text-lg font-bold text-white">Fluid Physics Simulation</h3>
                <p className="text-sm text-white/60 mt-1">Interactive particle simulation of reservoir fluid behavior during SPT treatment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8-STAGE PIPELINE ===== */}
      <section className="relative py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase">8-Stage AI Pipeline</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">Core Analysis Engine</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              End-to-end automated well screening — from satellite field scanning to final EOR treatment recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pipelineStages.map((stage, index) => (
              <div
                key={index}
                onClick={() => navigate(stage.path)}
                className="glass-card-hover rounded-2xl p-6 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-primary-glow/5 transition-all duration-500 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">{stage.emoji}</span>
                    <span className="text-xs font-bold text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">Stage {stage.stage}</span>
                  </div>
                  <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors duration-300">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
                  <div className="mt-3 flex items-center text-primary/40 text-xs font-medium group-hover:text-primary transition-all duration-300">
                    <span className="group-hover:mr-1 transition-all duration-300">Explore</span>
                    <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ADDITIONAL MODULES ===== */}
      <section className="relative py-28 px-6 border-t border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase">Platform Modules</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">Extended Capabilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Specialized tools for data management, geological modeling, financial planning & operational automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {additionalModules.map((feature, index) => (
              <div
                key={index}
                onClick={() => navigate(feature.path)}
                className="glass-card-hover rounded-2xl p-7 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-primary-glow/5 transition-all duration-500 pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-4xl mb-5 block group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 origin-left">{feature.emoji}</span>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  <div className="mt-4 flex items-center text-primary/40 text-xs font-medium group-hover:text-primary transition-all duration-300">
                    <span className="group-hover:mr-1 transition-all duration-300">Explore module</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="relative py-28 px-6 border-t border-border/50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase">Our Advantage</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">Why AI Smart Well?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We combine patented downhole technology with cutting-edge AI to unlock production potential that traditional methods miss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {advantages.map((item, i) => {
              const c = colorMap[item.color];
              return (
                <div key={i} className={`glass-card-hover rounded-2xl p-7 group ${c.border}`}>
                  <div className="flex items-start gap-5">
                    <div className={`flex-shrink-0 h-14 w-14 rounded-xl ${c.bg} ${c.bgHover} flex items-center justify-center transition-colors ${c.glow}`}>
                      <item.icon className={`h-7 w-7 ${c.text}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-28 px-6">
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 md:p-16 border-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Optimize Your Wells?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join operators who are already using AI to identify hidden production potential and maximize ROI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")} className="glow-primary text-base px-8 py-6">
                  Start Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/investor-deck")} className="text-base px-8 py-6 border-border/60">
                  <FileText className="mr-2 h-5 w-5" />
                  View Investor Deck
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Smart Well</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AI Smart Well & Maxxwell Production. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
