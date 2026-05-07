import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Check, Database, Rocket, Building2, Droplets, Brain,
  Shield, Cpu, Globe, Zap, Award, TrendingUp, Users, Layers, Crown,
  ChevronRight, BarChart4, PiggyBank, Plane, FileText, Activity,
  Satellite, Wind, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import UnitEconomicsLab from "@/components/saas/UnitEconomicsLab";

/* ── scroll-reveal hook (local) ── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

/* ── data ── */
const plans = [
  {
    name: "EXPLORER",
    price: "$3,200",
    perWell: "$350",
    wells: "Up to 10 wells/mo",
    icon: Database,
    popular: false,
    features: ["AI geological analysis", "Standard reports", "Email support", "Dashboard access"],
  },
  {
    name: "PROFESSIONAL",
    price: "$9,600",
    perWell: "$200",
    wells: "Up to 50 wells/mo",
    icon: Rocket,
    popular: true,
    features: ["Advanced AI models", "Detailed SPT readiness reports", "Priority support", "Custom integrations"],
  },
  {
    name: "ENTERPRISE",
    price: "$24,000",
    perWell: "$120",
    wells: "Unlimited wells",
    icon: Building2,
    popular: false,
    features: ["Full platform access + API", "Dedicated account manager", "On-site training", "Custom ML model tuning"],
  },
];

const revenueData = [
  { year: "Year 1", subscriptions: 0.4, perWell: 0.2 },
  { year: "Year 2", subscriptions: 1.0, perWell: 1.2 },
  { year: "Year 3", subscriptions: 2.3, perWell: 3.5 },
];

const metrics = [
  { value: "$0.6M", label: "Year 1 ARR", sub: "5 clients" },
  { value: "$2.2M", label: "Year 2 ARR", sub: "15 clients" },
  { value: "$5.8M", label: "Year 3 ARR", sub: "35 clients" },
  { value: "~80%", label: "Gross Margin", sub: "SaaS industry standard" },
];

const advantages = [
  { title: "Low Entry Barrier", description: "Base subscription gets clients on the platform fast. Per-well fees scale with their usage.", stat: "2-4 week", statLabel: "avg. onboarding" },
  { title: "Predictable + Scalable Revenue", description: "Monthly subscriptions provide a stable revenue floor. Per-well fees grow naturally.", stat: "70/30", statLabel: "subscription/usage split" },
  { title: "Aligned Incentives", description: "Clients succeed → they analyze more wells → our revenue grows. Natural upsell.", stat: "3x", statLabel: "avg. tier upgrade in 18 mo" },
  { title: "Dual Revenue Streams", description: "SaaS revenue (high margin, recurring) + SPT service revenue (project-based).", stat: "80%+", statLabel: "SaaS gross margin" },
];

const revenueTiers = [
  {
    name: "Explorer",
    mrr: "$3,200",
    wells: "Up to 10 / mo",
    arpu: "$350",
    expansion: "20%",
    ltv: "$12,600",
    cacPayback: "4 months",
    churn: "< 12%",
    icon: Database,
    accent: "muted",
  },
  {
    name: "Professional",
    mrr: "$9,600",
    wells: "Up to 50 / mo",
    arpu: "$200",
    expansion: "35%",
    ltv: "$51,200",
    cacPayback: "3 months",
    churn: "< 8%",
    icon: Rocket,
    accent: "primary",
  },
  {
    name: "Enterprise",
    mrr: "$24,000+",
    wells: "Unlimited",
    arpu: "$120",
    expansion: "50%",
    ltv: "$144,000+",
    cacPayback: "2 months",
    churn: "< 5%",
    icon: Building2,
    accent: "accent",
  },
];

const moatItems = [
  {
    title: "Patented SPT Technology",
    description: "US Patent 8,863,823 for Slot Perforation Technology. Proprietary EOR method with proven 2-3x production uplift.",
    icon: Shield,
    stat: "US 8,863,823",
    statLabel: "granted patent",
  },
  {
    title: "NVIDIA Cosmos AI Stack",
    description: "Predict-Transfer-Reason pipeline powered by NVIDIA DGX H100. Cross-modal fusion of CV, geophysics and economics.",
    icon: Cpu,
    stat: "10-100x",
    statLabel: "faster inference",
  },
  {
    title: "9-Stage Analysis Pipeline",
    description: "End-to-end workflow from field scanning to EOR optimization. No competitor covers all stages in a single platform.",
    icon: Layers,
    stat: "9 stages",
    statLabel: "integrated pipeline",
  },
  {
    title: "Real-Time Data Fusion",
    description: "Satellite + drone + wireline + production history merged into unified Digital Twin. Real-time anomaly detection.",
    icon: Globe,
    stat: "4 sources",
    statLabel: "fused in real time",
  },
  {
    title: "Slot-Based Economics",
    description: "Per-well SaaS pricing aligns customer success with vendor revenue. Natural expansion as clients grow.",
    icon: PiggyBank,
    stat: "80%+",
    statLabel: "gross margin",
  },
  {
    title: "Regulatory & ESG Ready",
    description: "Built-in EPA reporting, methane detection via drone, and automated compliance documentation.",
    icon: Award,
    stat: "EPA",
    statLabel: "reporting ready",
  },
];

const droneTiers = [
  {
    name: "Drone Survey Add-on",
    desc: "Autonomous flight plan + data processing (GeoTIFF, thermal orthomosaic)",
    price: "$800",
    unit: "/well",
    target: "Operators, regulators",
    icon: Plane,
    highlight: false,
    features: ["Autonomous waypoint generation", "GeoTIFF + RGB orthomosaic", "Basic anomaly detection", "48-hr turnaround"],
  },
  {
    name: "Environmental Compliance Pack",
    desc: "Methane plume report + EPA Subpart W data package",
    price: "$1,500",
    unit: "/well",
    target: "DOI, EPA programs",
    icon: Wind,
    highlight: true,
    features: ["CH₄ / CH₂ plume mapping", "EPA-ready submission data", "Thermal hot-spot segmentation", "Regulatory documentation"],
  },
  {
    name: "Full Site Digital Twin",
    desc: "3D orthomosaic + AI Smart Well subsurface model + fusion score",
    price: "$3,200",
    unit: "/well",
    target: "State agencies, PE firms",
    icon: Satellite,
    highlight: false,
    features: ["Subsurface + surface fusion", "Cross-modal attention scoring", "3D point cloud overlay", "State/Federal preset configs"],
  },
  {
    name: "Ongoing Monitoring (IoT)",
    desc: "Quarterly drone rescan + anomaly alert subscription",
    price: "$200",
    unit: "/well/mo",
    target: "All segments",
    icon: Activity,
    highlight: false,
    features: ["Quarterly autonomous rescan", "Real-time anomaly alerts", "Trend degradation tracking", "API webhook notifications"],
  },
];

const droneCompare = [
  { cap: "Subsurface analysis", trad: "Manual / slow", base: "AI-automated", drone: "AI-automated" },
  { cap: "Surface condition assessment", trad: "Manual walkdown", base: "—", drone: "Autonomous drone" },
  { cap: "Methane emission mapping", trad: "Rarely done", base: "—", drone: "Gas sensor + AI" },
  { cap: "Cost per well assessment", trad: "$4,200+", base: "$500–800", drone: "$500–800" },
  { cap: "Time per well", trad: "3–5 days", base: "Minutes", drone: "Minutes + 1 hr flight" },
  { cap: "Regulatory report generation", trad: "Manual", base: "Partial", drone: "Automated package" },
];

/* ── sections ── */
const HeroSection = () => {
  const { ref, isVisible } = useScrollReveal(0.1);
  return (
    <section ref={ref} className={`relative flex items-center overflow-hidden py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-secondary/50 rotate-12 rounded-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-secondary/30 -rotate-6 rounded-3xl" />
      </div>
      <div className="relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Geological Analysis
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              <span className="text-primary">SGOM</span><br />
              <span className="text-foreground">SaaS Business Model</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Hybrid Pricing: Subscription + Per-Well Analysis. AI-driven geological insights that scale with your operations.
            </p>
            <p className="text-xs text-muted-foreground">AI Smart Well, Inc. | Confidential</p>
          </div>
          <div className="hidden lg:flex flex-col items-center justify-center gap-8">
            <div className="w-32 h-32 rounded-2xl bg-secondary flex items-center justify-center border border-border">
              <Droplets className="w-16 h-16 text-primary" />
            </div>
            <div className="w-32 h-32 rounded-2xl bg-secondary flex items-center justify-center border border-border">
              <Brain className="w-16 h-16 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">Hybrid SaaS Pricing Model</h2>
        <p className="text-muted-foreground text-lg">Base Subscription + Per-Well Analysis Fee</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative rounded-xl border p-8 flex flex-col transition-all hover:scale-[1.02] ${plan.popular ? "bg-card border-primary shadow-lg shadow-primary/10" : "bg-card border-border"}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent text-accent-foreground px-5 py-1 text-sm font-bold tracking-wide">MOST POPULAR</div>
            )}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${plan.popular ? "bg-primary/10" : "bg-secondary"}`}>
              <plan.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-sm font-bold tracking-[0.2em] text-muted-foreground mb-4">{plan.name}</h3>
            <div className="mb-1">
              <span className="text-4xl font-bold text-foreground">{plan.price}</span>
              <span className="text-muted-foreground text-sm"> /mo</span>
            </div>
            <p className="text-primary font-semibold mb-1">+ {plan.perWell} per well</p>
            <p className="text-muted-foreground text-sm mb-6">{plan.wells}</p>
            <div className="h-px bg-border mb-6" />
            <ul className="space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-secondary-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-center text-muted-foreground text-sm mt-10">
        All plans include: Secure cloud hosting • Data encryption • Quarterly business reviews • 99.9% uptime SLA
      </p>
    </section>
  );
};

const RevenueSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 bg-secondary/30 rounded-2xl px-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mb-12 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">Revenue Projections (3-Year)</h2>
        <p className="text-muted-foreground text-lg">Conservative scenario • Hybrid SaaS + SPT Service Revenue</p>
      </div>
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-card rounded-xl border border-border p-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueData} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 13 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}M`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`$${value}M`]} />
              <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
              <Bar dataKey="subscriptions" name="SaaS Subscriptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="perWell" name="Per-Well Fees" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-card rounded-xl border border-border p-5 flex items-center gap-5">
              <div className="w-1 h-12 rounded-full bg-primary shrink-0" />
              <div>
                <span className="text-2xl font-bold text-foreground">{m.value}</span>
                <div className="text-sm">
                  <span className="text-foreground font-medium">{m.label}</span>
                  <span className="text-muted-foreground ml-2">{m.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 bg-card rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Key Assumptions:</span>{" "}
          Avg. 20 wells/client/mo (Yr1) → 40 wells (Yr3) • Blended per-well rate ~$200 • Annual churn &lt;10% • Excludes SPT hardware/service revenue stream
        </p>
      </div>
    </section>
  );
};

const WhyHybridSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <h2 className="text-3xl md:text-4xl font-bold mb-12">Why Hybrid SaaS?</h2>
      <div className="space-y-4">
        {advantages.map((item) => (
          <div key={item.title} className="bg-secondary/50 rounded-xl border border-border p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-1 h-16 rounded-full bg-primary shrink-0 hidden md:block" />
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold text-primary">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
            <div className="md:text-right shrink-0 bg-muted rounded-lg px-6 py-4 md:min-w-[160px]">
              <div className="text-2xl font-bold text-primary">{item.stat}</div>
              <div className="text-xs text-muted-foreground">{item.statLabel}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const RevenueTiersSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <BarChart4 className="h-4 w-4 text-primary" />
          Unit Economics by Tier
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Revenue Tiers</h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Detailed monetization profile per customer tier. Professional tier drives the majority of ARR growth through expansion revenue.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {revenueTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl border p-6 flex flex-col transition-all hover:scale-[1.02] ${
              tier.accent === "primary" ? "bg-card border-primary shadow-lg shadow-primary/10" : "bg-card border-border"
            }`}
          >
            {tier.accent === "primary" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent text-accent-foreground px-4 py-0.5 text-xs font-bold tracking-wide">
                TOP GROWTH DRIVER
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tier.accent === "primary" ? "bg-primary/10" : "bg-secondary"}`}>
                <tier.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-[0.15em] text-muted-foreground">{tier.name.toUpperCase()}</h3>
                <p className="text-2xl font-bold text-foreground">{tier.mrr}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {[
                { label: "Well Volume", value: tier.wells },
                { label: "ARPU (per well)", value: tier.arpu },
                { label: "Expansion Rate", value: tier.expansion },
                { label: "Est. LTV", value: tier.ltv },
                { label: "CAC Payback", value: tier.cacPayback },
                { label: "Annual Churn", value: tier.churn },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Annual run-rate</span>
                <span className="font-bold text-primary">
                  {tier.mrr.replace("+", "").replace(",", "") === "$3200"
                    ? "$38.4K"
                    : tier.mrr.replace("+", "").replace(",", "") === "$9600"
                    ? "$115.2K"
                    : "$288K+"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-secondary/50 rounded-xl border border-border p-6">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Revenue Mix Hypothesis
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Year 1 Mix</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary w-[60%]" />
            </div>
            <p className="text-sm font-medium">60% Subscription / 40% Per-Well</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Year 2 Mix</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary w-[45%]" />
            </div>
            <p className="text-sm font-medium">45% Subscription / 55% Per-Well</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">Year 3 Mix</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary w-[35%]" />
            </div>
            <p className="text-sm font-medium">35% Subscription / 65% Per-Well</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const CompetitiveMoatSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          Defensible Position
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Competitive Moat</h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Six interconnected barriers make the AI Smart Well platform difficult to replicate and expensive to displace once deployed.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moatItems.map((item) => (
          <div
            key={item.title}
            className="group relative bg-card rounded-xl border border-border p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{item.title}</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {item.description}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <div className="text-xl font-bold text-primary">{item.stat}</div>
                <div className="text-xs text-muted-foreground">{item.statLabel}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-primary/10 via-secondary/30 to-accent/10 rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-foreground mb-2">Switching Cost Effect</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once a client&rsquo;s historical well data, trained ML models, and digital twins are hosted on the platform, migration costs exceed $200K in re-training and re-integration. This creates natural account stickiness and pricing power.
            </p>
          </div>
          <div className="shrink-0 bg-card rounded-lg border border-border px-6 py-4 text-center">
            <div className="text-3xl font-bold text-primary">&gt;$200K</div>
            <div className="text-xs text-muted-foreground">estimated switch cost</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DronePricingSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Plane className="h-4 w-4 text-primary" />
          Drone Inspection Module
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Drone Service Pricing</h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Above-ground + below-ground assessment pipeline. Add drone data to any tier for surface condition, methane mapping, and 3D site digital twin.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {droneTiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl border p-5 flex flex-col transition-all hover:scale-[1.02] ${
              tier.highlight ? "bg-card border-primary shadow-lg shadow-primary/10" : "bg-card border-border"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent text-accent-foreground px-4 py-0.5 text-xs font-bold tracking-wide">
                MOST POPULAR
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tier.highlight ? "bg-primary/10" : "bg-secondary"}`}>
                <tier.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-[0.15em] text-muted-foreground">{tier.name.toUpperCase()}</h3>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">{tier.price}</span>
              <span className="text-muted-foreground text-sm">{tier.unit}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tier.desc}</p>

            <div className="space-y-2 flex-1">
              {tier.features.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-secondary-foreground">{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{tier.target}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-r from-primary/10 via-secondary/30 to-accent/10 rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-foreground mb-1">TAM Expansion</h4>
          <p className="text-sm text-muted-foreground">
            500,000 priority orphaned wells × $800 average drone survey = $400M+ serviceable market before Environmental Compliance and Digital Twin tiers.
          </p>
        </div>
        <div className="shrink-0 bg-card rounded-lg border border-border px-5 py-3 text-center">
          <div className="text-2xl font-bold text-primary">$400M+</div>
          <div className="text-xs text-muted-foreground">drone TAM addition</div>
        </div>
      </div>
    </section>
  );
};

const DroneComparisonSection = () => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section ref={ref} className={`py-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mb-8 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          Competitive Position
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Drone Competitive Comparison</h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          How AI Smart Well + Drone stacks up against traditional consultants and our base subsurface-only platform.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Capability</th>
                <th className="py-3 px-4">Traditional Consultants</th>
                <th className="py-3 px-4">AI Smart Well (Pre-Drone)</th>
                <th className="py-3 px-4 text-primary">AI Smart Well + Drone</th>
              </tr>
            </thead>
            <tbody>
              {droneCompare.map((c) => (
                <tr key={c.cap} className="border-b border-border/40 last:border-0">
                  <td className="py-3 px-4 font-medium text-foreground">{c.cap}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.trad}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {c.base === "—" ? <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="h-3.5 w-3.5" /> Not offered</span> : c.base}
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> {c.drone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

/* ── main page ── */
const SaaSBusinessModel = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <HeroSection />
      <PricingSection />
      <RevenueTiersSection />
      <UnitEconomicsLab />
      <RevenueSection />
      <WhyHybridSection />
      <DronePricingSection />
      <DroneComparisonSection />
      <CompetitiveMoatSection />
    </div>
  );
};

export default SaaSBusinessModel;
