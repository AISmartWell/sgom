import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Droplets,
  LayoutDashboard,
  Database,
  Map,
  Target,
  BarChart3,
  DollarSign,
  Wrench,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Microscope,
  Radio,
  Brain,
  GraduationCap,
  Activity,
  Radar,
  FolderSearch,
  TrendingDown,
  TrendingUp,
  Settings,
  Building2,
  Presentation,
  Layers,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Real-Time Monitor",
    icon: Radio,
    href: "/dashboard/realtime",
    badge: "📡",
  },
  {
    title: "Telemetry Architecture",
    icon: Activity,
    href: "/dashboard/telemetry-architecture",
    badge: "🔗",
  },
  {
    title: "Data Collection",
    icon: Database,
    href: "/dashboard/data-collection",
    badge: "🗄️",
  },
  {
    title: "Geological Analysis",
    icon: Map,
    href: "/dashboard/geological-analysis",
    badge: "🗺️",
  },
  {
    title: "Core Analysis",
    icon: Microscope,
    href: "/dashboard/core-analysis",
    badge: "🔬",
  },
  {
    title: "AI Well Selection",
    icon: Target,
    href: "/dashboard/well-selection",
    badge: "🎯",
  },
  {
    title: "Reservoir Simulation",
    icon: BarChart3,
    href: "/dashboard/simulation",
    badge: "📊",
  },
  {
    title: "Financial Forecast",
    icon: DollarSign,
    href: "/dashboard/financial",
    badge: "💰",
  },
  {
    title: "SPT Treatment",
    icon: Wrench,
    href: "/dashboard/spt-treatment",
    badge: "🔧",
  },
  {
    title: "SPT Projection",
    icon: TrendingUp,
    href: "/dashboard/spt-projection",
    badge: "🚀",
  },
  {
    title: "Economic Analysis",
    icon: DollarSign,
    href: "/dashboard/economic-analysis",
    badge: "💵",
  },
  {
    title: "SPT Parameters",
    icon: Settings,
    href: "/dashboard/spt-parameters",
    badge: "⚙️",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/dashboard/reports",
    badge: "✅",
  },
  {
    title: "EOR Optimization",
    icon: Brain,
    href: "/dashboard/eor-optimization",
    badge: "🧠",
  },
   {
     title: "ML Training",
     icon: GraduationCap,
     href: "/dashboard/ml-training",
     badge: "🎓",
   },
   {
     title: "Geophysical Expertise",
     icon: Activity,
     href: "/dashboard/geophysical",
     badge: "📊",
   },
    {
      title: "Field Scanning",
      icon: Radar,
      href: "/dashboard/field-scanning",
      badge: "🛰️",
    },
     {
       title: "Data Classification",
       icon: FolderSearch,
       href: "/dashboard/data-classification",
       badge: "📂",
     },
     {
       title: "Cumulative Analysis",
       icon: TrendingDown,
       href: "/dashboard/cumulative-analysis",
       badge: "📈",
     },
   {
      title: "Multi-Tenant",
      icon: Building2,
      href: "/dashboard/multi-tenant",
      badge: "🏢",
    },
    {
      title: "SaaS Business Model",
      icon: Presentation,
      href: "/dashboard/saas-business-model",
      badge: "💼",
    },
   {
      title: "Architecture",
      icon: Layers,
      href: "/dashboard/architecture",
      badge: "🏗️",
    },
   {
      title: "MVP Scope",
      icon: Target,
      href: "/mvp-scope",
      badge: "🗺️",
    },
   {
      title: "Investor Deck",
      icon: Presentation,
      href: "/investor-deck",
      badge: "📊",
    },
   {
      title: "Budget Overview",
      icon: DollarSign,
      href: "/budget",
      badge: "💲",
    },
   {
      title: "Documentation",
      icon: FileText,
      href: "/docs",
      badge: "📄",
    },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ collapsed = false, onToggle }: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("You have been logged out");
    navigate("/auth");
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
            <Droplets className="h-6 w-6 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">
                AI Smart Well
              </h1>
              <p className="text-xs text-muted-foreground">SGOM Platform</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  {item.badge && (
                    <span className="text-xs">{item.badge}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Log Out</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
