import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Database, Rocket, Building2, Droplets, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

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
    price: "$2,000",
    perWell: "$350",
    wells: "Up to 10 wells/mo",
    icon: Database,
    popular: false,
    features: ["AI geological analysis", "Standard reports", "Email support", "Dashboard access"],
  },
  {
    name: "PROFESSIONAL",
    price: "$6,000",
    perWell: "$200",
    wells: "Up to 50 wells/mo",
    icon: Rocket,
    popular: true,
    features: ["Advanced AI models", "Detailed SPT readiness reports", "Priority support", "Custom integrations"],
  },
  {
    name: "ENTERPRISE",
    price: "$15,000",
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
      <RevenueSection />
      <WhyHybridSection />
    </div>
  );
};

export default SaaSBusinessModel;
