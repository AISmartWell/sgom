import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Printer,
  Maximize,
  Droplets,
  AlertTriangle,
  Lightbulb,
  Target,
  Layers,
  TrendingUp,
  DollarSign,
  Users,
  Globe,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import nvidiaInceptionBadgeBw from "@/assets/nvidia-inception-badge-bw.png";

const TOTAL_SLIDES = 13;

const InvestorDeck = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);

  const next = () => setCurrent((p) => Math.min(p + 1, TOTAL_SLIDES - 1));
  const prev = () => setCurrent((p) => Math.max(p - 1, 0));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
    },
    []
  );

  const handlePrint = () => window.print();

  const handleFullscreen = () => {
    deckRef.current?.requestFullscreen?.();
  };

  const slideClass =
    "w-full h-full flex flex-col justify-center px-12 md:px-20 py-10 select-none";

  return (
    <div
      ref={deckRef}
      className="min-h-screen bg-background text-foreground outline-none print:bg-white print:text-black"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Top bar — hidden in print */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">
          {current + 1} / {TOTAL_SLIDES}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrint} title="Print / Save as PDF">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleFullscreen} title="Fullscreen">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Slide container */}
      <div className="pt-12 print:pt-0">
        <div className="relative w-full max-w-5xl mx-auto aspect-[16/9] overflow-hidden rounded-xl border border-border print:border-none print:max-w-none print:rounded-none">
          {/* ===== SLIDE 1 — Cover ===== */}
          {current === 0 && (
            <div className={`${slideClass} items-center text-center bg-gradient-to-br from-primary/10 via-background to-accent/5`}>
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <Droplets className="h-9 w-9 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="text-primary">SGO.ai</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-2xl">
                AI-Powered Platform for Enhanced Oil Recovery Optimization
              </p>
              <div className="flex items-center gap-4 mb-8">
                <Badge variant="outline" className="text-sm px-4 py-1">Pre-Seed · $500K</Badge>
                <img src={nvidiaInceptionBadgeBw} alt="NVIDIA Inception" className="h-8 opacity-70" />
              </div>
              <p className="text-sm text-muted-foreground">Business Summary Deck · 2026</p>
            </div>
          )}

          {/* ===== SLIDE 2 — The Problem ===== */}
          {current === 1 && (
            <div className={`${slideClass} bg-gradient-to-br from-accent/5 via-background to-background`}>
              <div className="flex items-center gap-3 mb-8">
                <AlertTriangle className="h-8 w-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold">The Problem</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8 flex-1">
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-3xl font-bold text-accent mb-1">900,000+</p>
                    <p className="text-muted-foreground">Marginal wells in the US alone — most producing below economic threshold</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/50 border border-border">
                    <p className="text-3xl font-bold text-primary mb-1">Weeks</p>
                    <p className="text-muted-foreground">Time required for manual geological analysis and well selection</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-5 rounded-xl bg-muted/50 border border-border">
                    <p className="text-3xl font-bold text-warning mb-1">$Billions</p>
                    <p className="text-muted-foreground">Left underground due to outdated analysis methods and inefficient recovery</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/50 border border-border">
                    <p className="font-semibold mb-2">Industry relies on:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Manual core sample analysis</li>
                      <li>• Subjective well selection</li>
                      <li>• Outdated decline curve methods</li>
                      <li>• No real-time optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SLIDE 3 — Solution ===== */}
          {current === 2 && (
            <div className={`${slideClass} bg-gradient-to-br from-primary/5 via-background to-background`}>
              <div className="flex items-center gap-3 mb-8">
                <Lightbulb className="h-8 w-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">Our Solution</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
                An AI-powered SaaS platform that automates geological analysis and optimizes Enhanced Oil Recovery — reducing decision time from <strong className="text-foreground">weeks to minutes</strong>.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Target, title: "AI Well Selection", desc: "Machine learning ranks wells by recovery potential, eliminating guesswork" },
                  { icon: Layers, title: "Automated Analysis", desc: "Computer vision analyzes core samples; AI interprets well logs & seismic data" },
                  { icon: TrendingUp, title: "Production Optimization", desc: "7-stage workflow from field scanning to SPT treatment parameters" },
                ].map((item) => (
                  <div key={item.title} className="p-5 rounded-xl bg-card border border-border">
                    <item.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SLIDE 4 — How It Works ===== */}
          {current === 3 && (
            <div className={`${slideClass} bg-background`}>
              <div className="flex items-center gap-3 mb-8">
                <Layers className="h-8 w-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              </div>
              <p className="text-muted-foreground mb-6">7-stage automated workflow — from raw field data to optimized treatment plan</p>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { n: 1, label: "Field Scanning", color: "bg-primary/20 text-primary" },
                  { n: 2, label: "Data Classification", color: "bg-primary/20 text-primary" },
                  { n: 3, label: "Cumulative Analysis", color: "bg-primary/20 text-primary" },
                  { n: 4, label: "SPT Projection", color: "bg-accent/20 text-accent" },
                  { n: 5, label: "Economic Analysis", color: "bg-warning/20 text-warning" },
                  { n: 6, label: "Geophysical Review", color: "bg-success/20 text-success" },
                  { n: 7, label: "SPT Parameters", color: "bg-success/20 text-success" },
                ].map((s) => (
                  <div key={s.n} className="flex flex-col items-center text-center">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${s.color}`}>
                      {s.n}
                    </div>
                    <p className="text-xs font-medium leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-5 rounded-xl bg-muted/30 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Result:</strong> Each well receives an AI-generated score, economic forecast, and optimized treatment plan — what used to take a team of engineers weeks, our platform delivers in minutes.
                </p>
              </div>
            </div>
          )}

          {/* ===== SLIDE 5 — Patented Technology ===== */}
          {current === 4 && (
            <div className={`${slideClass} bg-gradient-to-br from-success/5 via-background to-background`}>
              <div className="flex items-center gap-3 mb-8">
                <Shield className="h-8 w-8 text-success" />
                <h2 className="text-3xl md:text-4xl font-bold">Patented Technology</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Slot Perforation Technology (SPT)</h3>
                  <p className="text-muted-foreground">
                    US Patent 8,863,823 by Maxxwell Production — a proven downhole technology that creates precision slots in well casing, increasing reservoir contact area and reviving marginal wells.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Slot depth up to 5 feet</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Drainage area up to 25 sq ft per foot</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Decades of verified field results</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Applicable to marginal & low-rate wells</li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Our Innovation</p>
                  <p className="text-lg">
                    We combine this <strong>proven physical technology</strong> with <strong>AI-powered selection and optimization</strong> — ensuring SPT is applied to the right wells with the right parameters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== SLIDE 6 — Product (MVP) ===== */}
          {current === 5 && (
            <div className={`${slideClass} bg-background`}>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="h-8 w-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">Product — MVP Live</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "Core Vision AI", desc: "Upload rock photos → get classification, porosity, fracture analysis" },
                  { title: "AI Well Ranking", desc: "Score wells by production potential, water cut, economic viability" },
                  { title: "EOR Workflow", desc: "7-stage pipeline from scanning to treatment parameters" },
                  { title: "Financial Forecast", desc: "Real-time oil prices, ROI calculation, payback period" },
                  { title: "Real-Time Telemetry", desc: "IoT sensor architecture for pressure, flow, temperature monitoring" },
                  { title: "ML Training Module", desc: "Train custom models (LSTM, Transformer) on well data" },
                ].map((f) => (
                  <div key={f.title} className="p-4 rounded-lg bg-card border border-border">
                    <h3 className="font-semibold text-primary mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Badge variant="outline" className="text-sm">Live demo: sgom.lovable.app</Badge>
              </div>
            </div>
          )}

          {/* ===== SLIDE 7 — Target Market ===== */}
          {current === 6 && (
            <div className={`${slideClass} bg-gradient-to-br from-primary/5 via-background to-background`}>
              <div className="flex items-center gap-3 mb-8">
                <Globe className="h-8 w-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">Target Market</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <p className="text-3xl font-bold text-primary">$32B</p>
                  <p className="text-sm text-muted-foreground mt-1">TAM — Global EOR Services</p>
                </div>
                <div className="p-6 rounded-xl bg-accent/10 border border-accent/20 text-center">
                  <p className="text-3xl font-bold text-accent">$3.2B</p>
                  <p className="text-sm text-muted-foreground mt-1">SAM — US Independent Operators</p>
                </div>
                <div className="p-6 rounded-xl bg-success/10 border border-success/20 text-center">
                  <p className="text-3xl font-bold text-success">$320M</p>
                  <p className="text-sm text-muted-foreground mt-1">SOM — Initial Target Segment</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Target Customers</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">Independent Operators</p>
                    <p className="text-muted-foreground">Small/mid-size producers with marginal wells</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">Field Service Companies</p>
                    <p className="text-muted-foreground">EOR & well intervention providers</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="font-medium">Petroleum Engineers</p>
                    <p className="text-muted-foreground">Consultants seeking AI-powered tools</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SLIDE 8 — Business Model ===== */}
          {current === 7 && (
            <div className={`${slideClass} bg-background`}>
              <div className="flex items-center gap-3 mb-8">
                <DollarSign className="h-8 w-8 text-success" />
                <h2 className="text-3xl md:text-4xl font-bold">Business Model</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-primary/10 border border-primary/20">
                    <h3 className="font-semibold mb-2">SaaS Subscription</h3>
                    <p className="text-sm text-muted-foreground">Monthly platform access per company with tiered pricing based on well count</p>
                  </div>
                  <div className="p-5 rounded-xl bg-success/10 border border-success/20">
                    <h3 className="font-semibold mb-2">Per-Well Analysis Fee</h3>
                    <p className="text-sm text-muted-foreground">Pay-per-use AI analysis for core samples, well ranking, and SPT optimization</p>
                  </div>
                  <div className="p-5 rounded-xl bg-accent/10 border border-accent/20">
                    <h3 className="font-semibold mb-2">Professional Services</h3>
                    <p className="text-sm text-muted-foreground">Custom model training, field integration, and consulting for enterprise clients</p>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold mb-4">Revenue Potential</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Avg. subscription</span><span className="font-medium">$2,000–5,000/mo</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Per-well analysis</span><span className="font-medium">$500–2,000</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Potential savings/field</span><span className="font-medium">$2M+</span></div>
                    <div className="border-t border-border pt-3 mt-3 flex justify-between"><span className="text-muted-foreground">Target ARR (Year 2)</span><span className="font-bold text-primary">$500K–1M</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SLIDE 9 — Competition ===== */}
          {current === 8 && (
            <div className={`${slideClass} bg-background`}>
              <div className="flex items-center gap-3 mb-8">
                <BarChart3 className="h-8 w-8 text-accent" />
                <h2 className="text-3xl md:text-4xl font-bold">Competitive Landscape</h2>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium"></th>
                      <th className="text-center p-3 font-bold text-primary">SGO.ai</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Legacy Software</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Big Oil In-House</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["AI Well Selection", "✅", "❌", "⚠️ Limited"],
                      ["Core Vision AI", "✅", "❌", "❌"],
                      ["Patented SPT Integration", "✅", "❌", "❌"],
                      ["Real-Time Telemetry", "✅", "⚠️ Basic", "✅"],
                      ["SaaS / Cloud-Native", "✅", "❌", "❌"],
                      ["Affordable for Independents", "✅", "⚠️", "❌"],
                    ].map(([feature, us, legacy, big]) => (
                      <tr key={feature} className="border-t border-border">
                        <td className="p-3 font-medium">{feature}</td>
                        <td className="p-3 text-center">{us}</td>
                        <td className="p-3 text-center">{legacy}</td>
                        <td className="p-3 text-center">{big}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                No existing solution combines AI-powered analysis with patented downhole technology in a cloud-native SaaS for independent operators.
              </p>
            </div>
          )}

          {/* ===== SLIDE 10 — Go-to-Market ===== */}
          {current === 9 && (
            <div className={`${slideClass} bg-gradient-to-br from-success/5 via-background to-background`}>
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="h-8 w-8 text-success" />
                <h2 className="text-3xl md:text-4xl font-bold">Go-to-Market Strategy</h2>
              </div>
              <div className="space-y-6">
                {[
                  { phase: "Phase 1 — Now", title: "MVP & Validation", items: ["Live platform demo", "NVIDIA Inception membership", "Target: 2–3 pilot operators in Oklahoma"] },
                  { phase: "Phase 2 — 6 months", title: "Pilot Deployments", items: ["Paid pilots with independent operators", "Validate ROI on real marginal wells", "Iterate product based on field data"] },
                  { phase: "Phase 3 — 12 months", title: "Scale", items: ["Launch SaaS subscription model", "Expand to Permian & Bakken basins", "Partner with field service companies"] },
                ].map((p) => (
                  <div key={p.phase} className="flex gap-4 items-start">
                    <Badge variant="outline" className="shrink-0 mt-1 text-xs">{p.phase}</Badge>
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.items.map((i) => (
                          <span key={i} className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">{i}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SLIDE 11 — Team ===== */}
          {current === 10 && (
            <div className={`${slideClass} bg-background`}>
              <div className="flex items-center gap-3 mb-8">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">Team</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-2xl font-bold text-primary">
                    F
                  </div>
                  <h3 className="text-lg font-semibold">[Founder Name]</h3>
                  <p className="text-sm text-primary mb-2">CEO & Founder</p>
                  <p className="text-sm text-muted-foreground">
                    [Background — petroleum engineering, AI/ML, business experience]
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border">
                  <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 text-2xl font-bold text-accent">
                    A
                  </div>
                  <h3 className="text-lg font-semibold">[Advisor / Co-founder]</h3>
                  <p className="text-sm text-accent mb-2">Technical Advisor</p>
                  <p className="text-sm text-muted-foreground">
                    [Background — domain expertise, SPT technology, industry connections]
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border text-sm text-muted-foreground">
                <strong className="text-foreground">Technology Partner:</strong> Maxxwell Production — holders of US Patent 8,863,823 (Slot Perforation Technology)
              </div>
            </div>
          )}

          {/* ===== SLIDE 12 — The Ask ===== */}
          {current === 11 && (
            <div className={`${slideClass} bg-gradient-to-br from-primary/10 via-background to-accent/5`}>
              <div className="flex items-center gap-3 mb-8">
                <DollarSign className="h-8 w-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">The Ask — $500K Pre-Seed</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4">Use of Funds</h3>
                  <div className="space-y-3">
                    {[
                      { pct: "40%", label: "GPU Infrastructure & AI Model Training", color: "bg-primary" },
                      { pct: "25%", label: "Engineering Team", color: "bg-accent" },
                      { pct: "20%", label: "Pilot Deployments (2–3 operators)", color: "bg-success" },
                      { pct: "15%", label: "Go-to-Market & Operations", color: "bg-warning" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-3">
                        <div className={`h-8 w-14 rounded-md ${f.color} flex items-center justify-center text-xs font-bold text-white`}>{f.pct}</div>
                        <span className="text-sm">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Key Milestones (12 months)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Custom AI models trained on NVIDIA DGX Cloud</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 2–3 paid pilot deployments</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Validated ROI on real wells</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Ready for Seed round</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ===== SLIDE 13 — Contact ===== */}
          {current === 12 && (
            <div className={`${slideClass} items-center text-center bg-gradient-to-br from-primary/10 via-background to-success/5`}>
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <Droplets className="h-9 w-9 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Let's Talk</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                We're looking for investors who believe AI will transform energy production.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>[your-email@sgo.ai]</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>sgom.lovable.app</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-8">
                <Badge variant="outline">NVIDIA Inception Member</Badge>
                <Badge variant="outline">US Patent 8,863,823</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Navigation — hidden in print */}
        <div className="flex items-center justify-center gap-4 mt-6 pb-8 print:hidden">
          <Button variant="outline" size="sm" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={next} disabled={current === TOTAL_SLIDES - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvestorDeck;
