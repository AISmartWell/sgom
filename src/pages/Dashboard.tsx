import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/dashboard/StatCard";
import ModuleCard from "@/components/dashboard/ModuleCard";
import {
  Database,
  Map,
  Target,
  BarChart3,
  DollarSign,
  Wrench,
  Activity,
  TrendingUp,
  Droplets,
  Users,
  Radar,
  FolderSearch,
  TrendingDown,
  Brain,
} from "lucide-react";

const Dashboard = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user?.email) {
        setUserName(user.email.split("@")[0]);
      }
    };
    getUser();
  }, []);

  const modules = [
    // ── Stages 1–6 ──
    {
      title: "Field Scanning",
      description: "Satellite imagery & well location mapping",
      icon: Radar,
      href: "/dashboard/field-scanning",
      status: "ready" as const,
      emoji: "🛰️",
      stats: [
        { label: "Stage", value: "1" },
        { label: "Wells", value: "15,000+" },
      ],
    },
    {
      title: "Data Classification",
      description: "AI-driven well data categorization & filtering",
      icon: FolderSearch,
      href: "/dashboard/data-classification",
      status: "ready" as const,
      emoji: "📂",
      stats: [
        { label: "Stage", value: "2" },
        { label: "Sources", value: "5" },
      ],
    },
    {
      title: "Cumulative Analysis",
      description: "Production decline curves & reserve estimation",
      icon: TrendingDown,
      href: "/dashboard/cumulative-analysis",
      status: "ready" as const,
      emoji: "📈",
      stats: [
        { label: "Stage", value: "3" },
        { label: "Wells", value: "847" },
      ],
    },
    {
      title: "SPT Projection",
      description: "AI well ranking & inflow projection for SPT candidates",
      icon: TrendingUp,
      href: "/dashboard/spt-projection",
      status: "ready" as const,
      emoji: "🚀",
      stats: [
        { label: "Stage", value: "4" },
        { label: "Accuracy", value: "94%" },
      ],
    },
    {
      title: "Economic Analysis",
      description: "ROI, payback period & profit projection per well",
      icon: DollarSign,
      href: "/dashboard/economic-analysis",
      status: "ready" as const,
      emoji: "💵",
      stats: [
        { label: "Stage", value: "5" },
        { label: "ROI", value: "7-8mo" },
      ],
    },
    {
      title: "Geophysical Expertise",
      description: "Well log analysis & formation evaluation",
      icon: Activity,
      href: "/dashboard/geophysical",
      status: "ready" as const,
      emoji: "📊",
      stats: [
        { label: "Stage", value: "6" },
        { label: "Formations", value: "120" },
      ],
    },
    // ── EOR Optimization (integrator) ──
    {
      title: "EOR Optimization",
      description: "Final treatment recommendations & PDF reports",
      icon: Brain,
      href: "/dashboard/eor-optimization",
      status: "in-progress" as const,
      emoji: "🧠",
      stats: [
        { label: "Candidates", value: "6-10" },
        { label: "Effect", value: "5-10x" },
      ],
    },
    // ── Additional Modules ──
    {
      title: "Data Collection",
      description: "Collect and integrate well data from Oklahoma & Texas databases",
      icon: Database,
      href: "/dashboard/data-collection",
      status: "ready" as const,
      emoji: "📡",
      stats: [
        { label: "Wells", value: "15,000+" },
        { label: "Sources", value: "5" },
      ],
    },
    {
      title: "Geological Analysis",
      description: "AI seismic analysis, well logs, 3D geological modeling",
      icon: Map,
      href: "/dashboard/geological-analysis",
      status: "ready" as const,
      emoji: "🗺️",
      stats: [
        { label: "Formations", value: "120" },
        { label: "Horizons", value: "45" },
      ],
    },
    {
      title: "AI Well Selection",
      description: "ML-based well ranking by production potential",
      icon: Target,
      href: "/dashboard/well-selection",
      status: "in-progress" as const,
      emoji: "🎯",
      stats: [
        { label: "High Potential", value: "847" },
        { label: "Accuracy", value: "94%" },
      ],
    },
    {
      title: "Reservoir Simulation",
      description: "Dynamic modeling and production forecasting",
      icon: BarChart3,
      href: "/dashboard/simulation",
      status: "ready" as const,
      emoji: "📊",
      stats: [
        { label: "Scenarios", value: "12" },
        { label: "Forecast", value: "12mo" },
      ],
    },
    {
      title: "Financial Forecast",
      description: "ROI analysis, investment calculations by project",
      icon: DollarSign,
      href: "/dashboard/financial",
      status: "ready" as const,
      emoji: "💰",
      stats: [
        { label: "ROI", value: "7-8mo" },
        { label: "Projects", value: "23" },
      ],
    },
    {
      title: "SPT Treatment",
      description: "Hydro-slotting technology (Patent US8863823)",
      icon: Wrench,
      href: "/dashboard/spt-treatment",
      status: "pending" as const,
      emoji: "🔧",
      stats: [
        { label: "Effect", value: "5-10x" },
        { label: "Duration", value: "10-15yr" },
      ],
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome{userName ? `, ${userName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground">
          SGOM Platform — AI Smart Well & Maxxwell Production
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Wells"
          value="15,847"
          description="Oklahoma & Texas"
          icon={Droplets}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="High Potential"
          value="847"
          description="SPT Candidates"
          icon={Target}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Active Projects"
          value="23"
          description="In analysis"
          icon={Activity}
          variant="accent"
        />
        <StatCard
          title="Average ROI"
          value="312%"
          description="7-8 months payback"
          icon={TrendingUp}
          variant="default"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Modules Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">SGOM Modules</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Complete cycle of oil production analysis and optimization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard key={module.href} {...module} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Prototype Workflow</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg text-success text-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Interactive Well Maps — Connected
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg text-success text-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            State Databases (OK, TX) — Connected
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-lg text-warning text-sm">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            Seismic Data Feeds — Loading...
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-lg text-warning text-sm">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            Well Log Archives — Loading...
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg text-primary text-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Production History — Ready
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
