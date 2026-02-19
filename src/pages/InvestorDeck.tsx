import { useState, useRef, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
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
  Wifi,
  Database,
  Cpu,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import nvidiaInceptionBadgeBw from "@/assets/nvidia-inception-badge-bw.png";

const TOTAL_SLIDES = 19;

const InvestorDeck = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const animateSlide = (newSlide: number, dir: "next" | "prev") => {
    if (animating || newSlide === current) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(newSlide);
      setTimeout(() => setAnimating(false), 400);
    }, 10);
  };

  const next = useCallback(() => {
    setCurrent(c => {
      const newSlide = Math.min(c + 1, TOTAL_SLIDES - 1);
      if (newSlide !== c) {
        setDirection("next");
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);
      }
      return newSlide;
    });
  }, []);

  const prev = useCallback(() => {
    setCurrent(c => {
      const newSlide = Math.max(c - 1, 0);
      if (newSlide !== c) {
        setDirection("prev");
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);
      }
      return newSlide;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
    },
    [next, prev]
  );

  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting(true);
    const savedSlide = current;
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });
      const slideContainer = deckRef.current?.querySelector(".slide-render-area") as HTMLElement | null;
      if (!slideContainer) return;

      for (let i = 0; i < TOTAL_SLIDES; i++) {
        setCurrent(i);
        // Wait for render
        await new Promise((r) => setTimeout(r, 300));
        const canvas = await html2canvas(slideContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null,
        });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([1920, 1080], "landscape");
        pdf.addImage(imgData, "PNG", 0, 0, 1920, 1080);
      }

      pdf.save("SGO-AI-Investor-Deck.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setCurrent(savedSlide);
      setExporting(false);
    }
  };
  const handleFullscreen = () => deckRef.current?.requestFullscreen?.();

  const slideClass =
    "w-full h-full flex flex-col justify-center px-12 md:px-20 py-10 select-none";

  const slides = [
    // ===== SLIDE 1 — Cover =====
    <div key="cover" className={`${slideClass} items-center text-center bg-background`}>
      <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
        <Droplets className="h-9 w-9 text-primary" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold mb-4">
        <span className="text-primary">AI SMART WELL</span>
        <span className="text-muted-foreground text-2xl md:text-3xl block mt-2">+ MAXXWELL PRODUCTION</span>
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-2xl">
        AI-Powered Well Selection & Restoration | USA Pilot Project
      </p>
      <div className="grid grid-cols-4 gap-4 mb-8 max-w-2xl w-full">
        {[
          { value: "$2.39M", label: "Investment" },
          { value: "35-38%", label: "Year 1 EBITDA" },
          { value: "<1.5 yrs", label: "Payback" },
          { value: "90%+", label: "AI Accuracy" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg md:text-xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <img src={nvidiaInceptionBadgeBw} alt="NVIDIA Inception" className="h-8 opacity-70" />
      </div>
      <p className="text-xs text-muted-foreground mt-4">Confidential · Investment Opportunity · 2026</p>
    </div>,

    // ===== SLIDE 2 — The Problem =====
    <div key="problem" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="h-8 w-8 text-accent" />
        <h2 className="text-3xl md:text-4xl font-bold">The Problem</h2>
      </div>
      <p className="text-muted-foreground mb-6">Oil & gas operators face a critical challenge: finding the right wells to restore</p>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {[
          { value: "$12,100", label: "Analysis cost per well", sub: "Prohibitively expensive at scale", color: "text-accent" },
          { value: "25 days", label: "Analysis time per well", sub: "Too slow for large portfolios", color: "text-warning" },
          { value: "40-60%", label: "Success rate", sub: "Wasted capital on wrong wells", color: "text-destructive" },
          { value: "3 specialists", label: "Manual process", sub: "High labor costs, human error", color: "text-muted-foreground" },
        ].map((item) => (
          <div key={item.label} className="p-5 rounded-xl bg-muted/50 border border-border">
            <p className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</p>
            <p className="font-medium text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
        <p className="text-sm"><strong className="text-accent">The Math Problem:</strong> 500+ wells must be analyzed to find 6-10 productive candidates. At $12,100/well = <strong>$6,050,000</strong> just for analysis — before any acquisition or restoration.</p>
      </div>
    </div>,

    // ===== SLIDE 3 — Solution =====
    <div key="solution" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">Our Solution: AI SGOM</h2>
      </div>
      <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
        SGOM — AI-powered geological analysis platform that revolutionizes well selection
      </p>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Database, title: "Input", desc: "500 wells data, well logs, production history, geological data" },
          { icon: Cpu, title: "AI Analysis", desc: "Computer Vision, ML Prediction, Historical Analysis, Risk Scoring" },
          { icon: Target, title: "Output", desc: "6-10 Winners (1-2%), Ranked Candidates, ROI Forecast, Risk Score" },
          { icon: TrendingUp, title: "Result", desc: "90%+ accuracy, 83% cost reduction, 65% time savings" },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-xl bg-card border border-border">
            <item.icon className="h-7 w-7 text-primary mb-3" />
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic">"What used to take a team of engineers weeks, our platform delivers in minutes."</p>
    </div>,

    // ===== SLIDE 4 — Cost Comparison =====
    <div key="comparison" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-success" />
        <h2 className="text-3xl md:text-4xl font-bold">Manual vs SGOM AI</h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-border mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium">Parameter</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Manual</th>
              <th className="text-center p-3 font-bold text-primary">SGOM AI</th>
              <th className="text-center p-3 font-medium text-success">Savings</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Cost per well", "$12,100", "$2,000", "83%"],
              ["Time per well", "25 days", "9 days", "65%"],
              ["Team required", "3 specialists", "AI + 1 operator", "2 FTEs"],
              ["500 wells cost", "$6,050,000", "$1,000,000", "$5M+"],
              ["Accuracy", "40-60%", "90%+", "+30-50%"],
              ["Scalability", "Limited", "Unlimited", "∞"],
            ].map(([param, manual, sgom, savings]) => (
              <tr key={param} className="border-t border-border">
                <td className="p-3 font-medium">{param}</td>
                <td className="p-3 text-center text-muted-foreground">{manual}</td>
                <td className="p-3 text-center font-semibold text-primary">{sgom}</td>
                <td className="p-3 text-center text-success font-semibold">{savings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: "-83%", label: "Cost Reduction", sub: "$12,100 → $2,000 per well", color: "text-success" },
          { value: "-65%", label: "Time Savings", sub: "25 days → 9 days per well", color: "text-primary" },
          { value: "+50%", label: "Accuracy Boost", sub: "40-60% → 90%+ success rate", color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-muted/30 border border-border text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>,

    // ===== SLIDE 5 — How It Works =====
    <div key="workflow" className={`${slideClass} bg-background`}>
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
          <strong className="text-foreground">Result:</strong> Each well receives an AI-generated score, economic forecast, and optimized treatment plan — reducing decision time from <strong className="text-foreground">weeks to minutes</strong>.
        </p>
      </div>
    </div>,

    // ===== SLIDE 6 — Patented Technology =====
    <div key="patent" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-success" />
        <h2 className="text-3xl md:text-4xl font-bold">Patented SPT Technology</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">US Patent 8,863,823 · Maxxwell Production · maxxwellproduction.com</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { value: "3-5 ft", label: "Slot depth" },
              { value: "60%", label: "Stress reduction" },
              { value: "+50%", label: "Permeability" },
              { value: "Up to 10x", label: "Production boost" },
              { value: "15-20 yrs", label: "Effect duration" },
              { value: "95%", label: "Recovery rate" },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                <p className="text-lg font-bold text-success">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Key Advantages</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Ecologically safe (water and sand only)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> No casing damage, no cement cracks</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Works in any formations</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> No competition in Americas</li>
          </ul>
          <div className="p-4 rounded-xl bg-card border border-border mt-4">
            <p className="text-sm"><strong className="text-foreground">SGOM + SPT Integration</strong> = 90%+ Success Rate. AI selects the right wells; SPT restores them with precision.</p>
          </div>
        </div>
      </div>
    </div>,

    // ===== SLIDE 7 — Two Revenue Streams =====
    <div key="revenue-streams" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-success" />
        <h2 className="text-3xl md:text-4xl font-bold">Two Revenue Streams</h2>
      </div>
      <p className="text-muted-foreground mb-6">Diversified income through analysis services and production ownership</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
          <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">STREAM 1</Badge>
          <h3 className="text-lg font-semibold mb-3">SGOM Analysis Services (B2B)</h3>
          <p className="text-sm text-muted-foreground mb-4">AI-powered well analysis sold to operators worldwide. 29M abandoned wells represent our addressable market.</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Price per well</span><span className="font-medium">$2,000</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Client savings</span><span className="font-medium text-success">$10,100/well</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Typical project</span><span className="font-medium">200-500 wells</span></div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Target: Well acquisition funds · Private equity E&P · Mid-size operators</p>
        </div>
        <div className="p-6 rounded-xl bg-success/10 border border-success/20">
          <Badge className="mb-3 bg-success/20 text-success border-success/30">STREAM 2</Badge>
          <h3 className="text-lg font-semibold mb-3">Production Ownership</h3>
          <p className="text-sm text-muted-foreground mb-4">We own and operate restored wells, capturing 100% of the production upside.</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { value: "500", label: "Wells Analyzed" },
              { value: "6-10", label: "Winners Found" },
              { value: "4", label: "Wells Acquired" },
              { value: "90-105", label: "bbl/day Total" },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-background/50">
                <p className="font-bold text-success">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">30-35 bbl/day per well · Annual revenue: $2.1M–$2.5M</p>
        </div>
      </div>
    </div>,

    // ===== SLIDE 8 — Financial Projections =====
    <div key="financials" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-success" />
        <h2 className="text-3xl md:text-4xl font-bold">Financial Projections</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {[
          { year: "Year 1", sgom: "$1.0M", oil: "$1.4M–$1.6M", total: "$2.4M–$2.6M", ebitda: "35-38%", ebitdaVal: "$841K–$1M" },
          { year: "Year 2", sgom: "$3.0M", oil: "$2.1M–$2.5M", total: "$5.1M–$5.5M", ebitda: "56%", ebitdaVal: "$2.8M–$3.1M" },
          { year: "Year 3", sgom: "$6.0M", oil: "$2.0M–$2.4M", total: "$8.0M–$8.4M", ebitda: "55%+", ebitdaVal: "$4.4M+" },
        ].map((y) => (
          <div key={y.year} className="p-5 rounded-xl bg-card border border-border">
            <Badge variant="outline" className="mb-3">{y.year}</Badge>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">SGOM Revenue</span><span className="font-medium">{y.sgom}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Oil Revenue</span><span className="font-medium">{y.oil}</span></div>
              <div className="border-t border-border pt-2 flex justify-between"><span className="font-medium">Total Revenue</span><span className="font-bold text-primary">{y.total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">EBITDA ({y.ebitda})</span><span className="font-bold text-success">{y.ebitdaVal}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Oil wells", value: "3" },
          { label: "Production after SPT", value: "30-35 bbl/day" },
          { label: "Oil price assumption", value: "$65/bbl" },
          { label: "Decline rate", value: "5%/year" },
        ].map((a) => (
          <div key={a.label} className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-sm font-medium">{a.value}</p>
            <p className="text-xs text-muted-foreground">{a.label}</p>
          </div>
        ))}
      </div>
    </div>,

    // ===== SLIDE 9 — Product (MVP) =====
    <div key="product" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <Zap className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">Product — MVP Live</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: "Core Vision AI", desc: "Upload rock photos → classification, porosity, fracture analysis" },
          { title: "AI Well Ranking", desc: "Score wells by production potential, water cut, economic viability" },
          { title: "EOR Workflow", desc: "7-stage pipeline from scanning to treatment parameters" },
          { title: "Financial Forecast", desc: "Real-time oil prices, ROI calculation, payback period" },
          { title: "Real-Time Telemetry", desc: "IoT sensor architecture for pressure, flow, temperature" },
          { title: "ML Training Module", desc: "Train custom models (LSTM, Transformer) on well data" },
        ].map((f) => (
          <div key={f.title} className="p-4 rounded-lg bg-card border border-border">
            <h3 className="font-semibold text-primary mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button onClick={() => navigate('/budget')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
          <DollarSign className="h-4 w-4" />
          MVP Budget Breakdown →
        </button>
      </div>
    </div>,

    // ===== SLIDE 10 — IoT Strategy =====
    <div key="iot" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <Wifi className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">IoT Strategy</h2>
      </div>
      <p className="text-muted-foreground mb-6">Transforming one-time analysis into a self-learning, data-driven production management platform</p>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="p-5 rounded-xl bg-muted/50 border border-border">
          <Badge variant="outline" className="mb-3">Current Model</Badge>
          <h3 className="font-semibold mb-2">One-Time Service</h3>
          <ol className="space-y-1 text-sm text-muted-foreground">
            <li>1. SGOM analyzes geological data</li>
            <li>2. Identifies optimal perforation zones</li>
            <li>3. SPT restores well production</li>
            <li>4. Project complete — engagement ends</li>
          </ol>
        </div>
        <div className="p-5 rounded-xl bg-primary/10 border border-primary/20">
          <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">IoT-Enabled</Badge>
          <h3 className="font-semibold mb-2">Continuous Platform</h3>
          <ol className="space-y-1 text-sm text-muted-foreground">
            <li>1. SGOM analyzes + SPT restores</li>
            <li>2. IoT sensors stream real-time data</li>
            <li>3. SGOM self-learns and adapts</li>
            <li>4. Ongoing optimization — <strong className="text-primary">recurring revenue</strong></li>
          </ol>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Result:</strong> IoT transforms SGOM from a one-time consulting tool into a <strong className="text-primary">continuous revenue platform</strong> — increasing Client LTV from $50K–150K to $200K–500K+ through monthly SaaS subscriptions and self-learning AI optimization.
        </p>
      </div>
      <Button variant="outline" size="sm" className="mt-4 self-start" onClick={next}>
        Details → IoT Pricing
      </Button>
    </div>,

    // ===== SLIDE 11 — IoT Pricing =====
    <div key="iot-pricing" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">IoT Pricing</h2>
      </div>
      <p className="text-muted-foreground mb-5">Hardware + SaaS model: one-time equipment cost per well plus monthly platform subscription</p>
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {[
          { name: "Starter Kit", wells: "1–5 wells", hardware: "$2,500", hwDesc: "per well (one-time)", platform: "$500/mo", platDesc: "Platform + monitoring", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { name: "Professional", wells: "6–25 wells", hardware: "$2,000", hwDesc: "per well (volume discount)", platform: "$350/mo per well", platDesc: "Full analytics + AI alerts", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { name: "Enterprise", wells: "25+ wells", hardware: "Custom", hwDesc: "bulk pricing negotiated", platform: "Custom", platDesc: "Dedicated infrastructure", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
        ].map((tier) => (
          <div key={tier.name} className={`p-4 rounded-xl ${tier.bg} border ${tier.border}`}>
            <h3 className="font-semibold mb-1">{tier.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{tier.wells}</p>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Hardware</p>
                <p className={`text-lg font-bold ${tier.color}`}>{tier.hardware}</p>
                <p className="text-xs text-muted-foreground">{tier.hwDesc}</p>
              </div>
              <div className="p-2 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform</p>
                <p className={`text-lg font-bold ${tier.color}`}>{tier.platform}</p>
                <p className="text-xs text-muted-foreground">{tier.platDesc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50">
            <th className="text-left p-2 font-medium">Component</th>
            <th className="text-right p-2 font-medium">Cost per Well</th>
          </tr></thead>
          <tbody>
            {[
              ["Pressure sensor (0–10K psi)", "$350–$600"],
              ["Flow meter (turbine/ultrasonic)", "$800–$1,500"],
              ["Temperature probe (RTD)", "$150–$300"],
              ["Water cut analyzer", "$400–$700"],
              ["RTU / Controller", "$500–$900"],
              ["Cellular IoT gateway", "$200–$400"],
              ["Installation & commissioning", "$500–$1,000"],
            ].map(([item, cost]) => (
              <tr key={item} className="border-t border-border">
                <td className="p-2 text-muted-foreground">{item}</td>
                <td className="p-2 text-right font-mono text-primary font-medium">{cost}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-primary/30 bg-primary/5">
              <td className="p-2 font-semibold">Total per well</td>
              <td className="p-2 text-right font-mono text-primary font-bold">$2,900 – $5,400</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>,

    // ===== SLIDE 12 — Target Market =====
    <div key="market" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-8">
        <Globe className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">Target Market</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[
          { value: "$32B", label: "TAM — Global EOR", color: "primary" },
          { value: "$3.2B", label: "SAM — US Independents", color: "accent" },
          { value: "$320M", label: "SOM — Initial Target", color: "success" },
        ].map((m) => (
          <div key={m.label} className={`p-6 rounded-xl bg-${m.color}/10 border border-${m.color}/20 text-center`}>
            <p className={`text-3xl font-bold text-${m.color}`}>{m.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="p-4 rounded-lg bg-muted/30">
          <p className="font-medium mb-1">3.7M Abandoned Wells in USA</p>
          <p className="text-muted-foreground">$15B+ in stranded reserves waiting to be recovered</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30">
          <p className="font-medium mb-1">29M Abandoned Wells Globally</p>
          <p className="text-muted-foreground">Massive addressable market for SGOM analysis services</p>
        </div>
      </div>
    </div>,

    // ===== SLIDE 12 — Scale-Up Path =====
    <div key="scaleup" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-8">
        <ArrowUpRight className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">Scale-Up Path</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { phase: "Pilot · Year 1", wells: "500", owned: "4", invest: "$2.39M", note: "Prove model", color: "primary" },
          { phase: "Series A · Year 2", wells: "2,000", owned: "25", invest: "$5.2M", note: "Scale operations", color: "accent" },
          { phase: "Growth · Year 3+", wells: "5,000+", owned: "60+", invest: "$11M+", note: "Expand markets", color: "success" },
        ].map((p) => (
          <div key={p.phase} className={`p-6 rounded-xl bg-${p.color}/10 border border-${p.color}/20`}>
            <Badge variant="outline" className="mb-4">{p.phase}</Badge>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Wells Analyzed</span><span className="font-bold">{p.wells}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Wells Owned</span><span className="font-bold">{p.owned}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Investment</span><span className={`font-bold text-${p.color}`}>{p.invest}</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">{p.note}</p>
          </div>
        ))}
      </div>
    </div>,

    // ===== SLIDE 13 — Competition =====
    <div key="competition" className={`${slideClass} bg-background`}>
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
              ["Real-Time IoT Telemetry", "✅", "⚠️ Basic", "✅"],
              ["SaaS / Cloud-Native", "✅", "❌", "❌"],
              ["Affordable for Independents", "✅", "⚠️", "❌"],
              ["Continuous Self-Learning", "✅", "❌", "⚠️ Limited"],
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
        Only solution combining AI analysis + patented SPT + IoT continuous learning in a cloud-native SaaS.
      </p>
    </div>,

    // ===== SLIDE 14 — Go-to-Market Strategy =====
    <div key="gtm" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp className="h-8 w-8 text-success" />
        <h2 className="text-3xl md:text-4xl font-bold">Go-to-Market Strategy</h2>
      </div>

      {/* Target Segments */}
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        {[
          { segment: "Independent Operators", size: "1–50 wells", pain: "Can't afford $12K/well analysis", approach: "Direct sales, industry events", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { segment: "PE & Acquisition Funds", size: "100–1,000+ wells", pain: "Need fast portfolio screening", approach: "NVIDIA Capital Connect, referrals", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
          { segment: "Service Companies", size: "Multi-basin ops", pain: "No AI tools for well selection", approach: "White-label / API partnerships", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
        ].map((s) => (
          <div key={s.segment} className={`p-3 rounded-xl ${s.bg} border ${s.border}`}>
            <h3 className={`font-semibold text-sm ${s.color} mb-1`}>{s.segment}</h3>
            <p className="text-xs text-muted-foreground mb-2">{s.size}</p>
            <p className="text-xs mb-1"><span className="font-medium text-foreground">Pain:</span> <span className="text-muted-foreground">{s.pain}</span></p>
            <p className="text-xs"><span className="font-medium text-foreground">Channel:</span> <span className="text-muted-foreground">{s.approach}</span></p>
          </div>
        ))}
      </div>

      {/* GTM Timeline */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {[
          { phase: "Phase 1 · Now", title: "Validate", items: ["Live MVP demo", "NVIDIA Inception network", "First pilot: Diversified Energy"], kpi: "1 signed LOI", color: "primary" },
          { phase: "Phase 2 · 6 mo", title: "Prove Unit Economics", items: ["500 wells → 4 restored", "Validate ROI on marginal wells", "Build case studies"], kpi: "$1M ARR pipeline", color: "accent" },
          { phase: "Phase 3 · 12 mo", title: "Scale", items: ["SaaS launch + IoT sensors", "Permian & Bakken expansion", "Field service partnerships"], kpi: "10+ paying clients", color: "success" },
        ].map((p) => (
          <div key={p.phase} className={`p-3 rounded-xl bg-${p.color}/10 border border-${p.color}/20`}>
            <Badge variant="outline" className="mb-2 text-xs">{p.phase}</Badge>
            <h3 className="font-semibold text-sm mb-2">{p.title}</h3>
            <ul className="space-y-1 text-xs text-muted-foreground mb-2">
              {p.items.map((i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success shrink-0" />{i}</li>)}
            </ul>
            <p className={`text-xs font-semibold text-${p.color}`}>KPI: {p.kpi}</p>
          </div>
        ))}
      </div>

      {/* Sales channels summary */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex flex-wrap gap-4 text-xs">
          <span><strong className="text-foreground">Primary:</strong> <span className="text-muted-foreground">NVIDIA Capital Connect · Direct outreach · Industry conferences (SPE, NAPE)</span></span>
          <span><strong className="text-foreground">Digital:</strong> <span className="text-muted-foreground">LinkedIn B2B · Technical content · Case studies</span></span>
          <span><strong className="text-foreground">Partnerships:</strong> <span className="text-muted-foreground">Maxxwell Production · Field service companies · Well acquisition brokers</span></span>
        </div>
      </div>
    </div>,

    // ===== SLIDE 15 — Investment Budget =====
    <div key="budget" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">Investment Budget: $2,387,840</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-4">Allocation</h3>
          <div className="space-y-3">
            {[
              { pct: "48%", label: "SPT Operations (4 wells)", value: "$1,157,840", color: "bg-primary" },
              { pct: "25%", label: "AI Platform (SGOM)", value: "$600,000", color: "bg-accent" },
              { pct: "13%", label: "Team & Operations", value: "$300,000", color: "bg-success" },
              { pct: "6%", label: "SGOM Data & Analysis", value: "$150,000", color: "bg-warning" },
              { pct: "5%", label: "Sales, Legal & Other", value: "$130,000", color: "bg-muted-foreground" },
              { pct: "2%", label: "Working Capital", value: "$50,000", color: "bg-border" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className={`h-7 w-12 rounded-md ${f.color} flex items-center justify-center text-xs font-bold text-white`}>{f.pct}</div>
                <div className="flex-1 flex justify-between">
                  <span className="text-sm">{f.label}</span>
                  <span className="text-sm font-medium">{f.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">SPT Operations Breakdown ($1.16M)</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Well Purchase", value: "$440K" },
              { label: "SPT Organizer", value: "$126K" },
              { label: "Wellsite Supervision", value: "$74K" },
              { label: "Third Parties", value: "$357K" },
              { label: "Field Crew", value: "$160K" },
            ].map((i) => (
              <div key={i.label} className="flex justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">{i.label}</span>
                <span className="font-medium">{i.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,

    // ===== SLIDE 16 — Why Invest Now =====
    <div key="why-invest" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-8">
        <Zap className="h-8 w-8 text-warning" />
        <h2 className="text-3xl md:text-4xl font-bold">Why Invest Now?</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {[
          { icon: Target, title: "Unique AI + SPT Integration", desc: "Only solution combining AI selection with proven restoration technology" },
          { icon: DollarSign, title: "Massive Cost Advantage", desc: "83% cheaper analysis unlocks previously uneconomic wells" },
          { icon: TrendingUp, title: "Two Revenue Streams", desc: "Analysis fees (recurring) + Production (long-term)" },
          { icon: Shield, title: "Patent Protection", desc: "SPT technology protected in US (US8863823), no competition in Americas" },
          { icon: BarChart3, title: "High Margins", desc: "40-42% Year 1, growing to 55%+ Year 2" },
          { icon: Lightbulb, title: "Reasonable Entry Point", desc: "$2.39M pilot proves model before larger commitment" },
        ].map((item) => (
          <div key={item.title} className="p-5 rounded-xl bg-card border border-border flex items-start gap-4">
            <item.icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // ===== SLIDE 17 — Team =====
    <div key="team" className={`${slideClass} bg-background`}>
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-8 w-8 text-primary" />
        <h2 className="text-3xl md:text-4xl font-bold">Team</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-3 text-xl font-bold text-primary">
            ER
          </div>
          <h3 className="text-base font-semibold">Edward Rubinstein</h3>
          <p className="text-xs text-primary mb-1">Co-Founder / CEO</p>
          <p className="text-xs text-muted-foreground">Business strategy.</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center mb-3 text-xl font-bold text-accent">
            AN
          </div>
          <h3 className="text-base font-semibold">Anatoli Nikouline</h3>
          <p className="text-xs text-accent mb-1">CEO & SPT Engineer · Maxxwell Production</p>
          <p className="text-xs text-muted-foreground">Patented SPT technology inventor. Decades of field experience in well restoration across US & Canada.</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="h-14 w-14 rounded-full bg-success/20 flex items-center justify-center mb-3 text-xl font-bold text-success">
            AA
          </div>
          <h3 className="text-base font-semibold">Alexander Alishoev</h3>
          <p className="text-xs text-success mb-1">Lead Developer</p>
          <p className="text-xs text-muted-foreground">Full-stack development, AI/ML integration, platform architecture.</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-3 text-xl font-bold text-primary">
            MP
          </div>
          <h3 className="text-base font-semibold">Maxxwell Production</h3>
          <p className="text-xs text-primary mb-1">Technology Partner</p>
          <p className="text-xs text-muted-foreground">SPT service company since 2012. Patents US 8,863,823 & US 8,240,369. Chevron, Halliburton, Schlumberger.</p>
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <Badge variant="outline">NVIDIA Inception Member</Badge>
        <Badge variant="outline">US Patent 8,863,823</Badge>
        <Badge variant="outline">Nevada C-Corporation</Badge>
      </div>
    </div>,

    // ===== SLIDE 18 — Contact =====
    <div key="contact" className={`${slideClass} items-center text-center bg-background`}>
      <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
        <Droplets className="h-9 w-9 text-primary" />
      </div>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Explore This Opportunity?</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-xl">
        AI + Patented SPT + IoT = The future of oil well restoration
      </p>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold">Edward Rubinstein</span>
          <span className="text-muted-foreground">· Co-Founder/CEO</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span>edward@aismartwell.com</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span>1 (650) 787-2743</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span>www.aismartwell.com</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-8">
        <Badge variant="outline">NVIDIA Inception Member</Badge>
        <Badge variant="outline">US Patent 8,863,823</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-6">Confidential — For Intended Recipients Only</p>
    </div>,
  ];

  return (
    <div
      ref={deckRef}
      className="min-h-screen bg-background text-foreground outline-none print:bg-white print:text-black"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">
          {current + 1} / {TOTAL_SLIDES}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportPDF} disabled={exporting} title="Export PDF">
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export PDF"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleFullscreen} title="Fullscreen">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="fixed top-[49px] left-0 right-0 z-40 h-0.5 bg-muted/30 print:hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      {/* Slide container */}
      <div className="pt-12 print:pt-0">
        <div className="slide-render-area relative w-full max-w-5xl mx-auto aspect-[16/9] overflow-hidden rounded-xl border border-border print:border-none print:max-w-none print:rounded-none">
          <div
            key={current}
            className={`absolute inset-0 ${
              animating
                ? direction === "next"
                  ? "animate-slide-in-from-right"
                  : "animate-slide-in-from-left"
                : ""
            }`}
            style={{ animation: animating ? undefined : "none" }}
          >
            {slides[current]}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6 pb-8 print:hidden">
          <Button variant="outline" size="sm" onClick={prev} disabled={current === 0 || animating} className="transition-transform hover:scale-105">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i !== current) animateSlide(i, i > current ? "next" : "prev");
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={next} disabled={current === TOTAL_SLIDES - 1 || animating} className="transition-transform hover:scale-105">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvestorDeck;
