import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: "ready" | "in-progress" | "pending";
  emoji?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
}

const ModuleCard = ({
  title,
  description,
  icon: Icon,
  href,
  status,
  emoji,
  stats,
}: ModuleCardProps) => {
  const statusConfig = {
    ready: { label: "Ready", className: "status-high" },
    "in-progress": { label: "In Progress", className: "status-medium" },
    pending: { label: "Pending", className: "status-low" },
  };

  return (
    <Link
      to={href}
      className="group block"
    >
      <div className="glass-card rounded-xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {emoji && <span className="text-2xl">{emoji}</span>}
          </div>
          <Badge className={cn("text-xs", statusConfig[status].className)}>
            {statusConfig[status].label}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {stats && stats.length > 0 && (
          <div className="flex gap-4 mb-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Открыть модуль</span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default ModuleCard;
