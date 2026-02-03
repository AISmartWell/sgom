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
    {
      title: "Data Collection",
      description: "Сбор и интеграция данных из баз скважин Oklahoma, Texas",
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
      description: "AI-анализ сейсмики, каротажа, 3D геологическое моделирование",
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
      description: "Ранжирование скважин по потенциалу с ML-алгоритмами",
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
      description: "Динамическое моделирование и прогноз добычи",
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
      description: "ROI анализ, инвестиционные расчёты по проектам",
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
      description: "Технология гидрорезки (Patent US8863823)",
      icon: Wrench,
      href: "/dashboard/spt-treatment",
      status: "pending" as const,
      emoji: "🔧",
      stats: [
        { label: "Effect", value: "5-20x" },
        { label: "Duration", value: "25yr" },
      ],
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Добро пожаловать{userName ? `, ${userName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground">
          Платформа SGOM — AI Smart Well & Maxxwell Production
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Всего скважин"
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
          title="Активных проектов"
          value="23"
          description="In analysis"
          icon={Activity}
          variant="accent"
        />
        <StatCard
          title="Средний ROI"
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
          Полный цикл анализа и оптимизации нефтедобычи
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
