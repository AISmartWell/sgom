import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Server,
  Brain,
  Globe,
  Database,
  Shield,
  Layers,
  Radio,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ArchNode {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  techs: string[];
  description: string;
  details: string[];
}

const layers: { label: string; color: string; nodes: ArchNode[] }[] = [
  {
    label: "Frontend",
    color: "hsl(var(--primary))",
    nodes: [
      {
        id: "ui",
        title: "React UI",
        icon: Monitor,
        color: "primary",
        techs: ["React 18", "TypeScript", "Vite"],
        description: "Modular SPA architecture. Each platform module is a separate page with lazy-loaded components.",
        details: [
          "React Router v6 — nested routing inside DashboardLayout",
          "TanStack React Query — caching, refetch, optimistic updates",
          "shadcn/ui + Tailwind CSS — design system with semantic tokens",
          "Leaflet — interactive well maps (15,000+ markers)",
          "Three.js (@react-three/fiber) — 3D geological models",
          "Recharts — production data charts, financial forecasts",
        ],
      },
    ],
  },
  {
    label: "Backend (Lovable Cloud)",
    color: "hsl(var(--accent))",
    nodes: [
      {
        id: "db",
        title: "PostgreSQL",
        icon: Database,
        color: "accent",
        techs: ["PostgreSQL 15", "RLS", "Realtime"],
        description: "Primary data store with Row Level Security for multi-tenancy.",
        details: [
          "Tables: companies, user_companies, wells",
          "RLS policies isolate data by company_id",
          "Realtime subscriptions for well monitoring",
          "Scalable to 100K+ records with indexes",
        ],
      },
      {
        id: "auth",
        title: "Authentication",
        icon: Shield,
        color: "accent",
        techs: ["JWT", "Email/Password", "OAuth"],
        description: "User authentication and authorization linked to company accounts.",
        details: [
          "JWT tokens with auto-refresh",
          "User → Company mapping via user_companies",
          "Route protection at DashboardLayout level",
          "Role support (owner, engineer, viewer)",
        ],
      },
      {
        id: "edge",
        title: "Edge Functions",
        icon: Server,
        color: "accent",
        techs: ["Deno", "TypeScript"],
        description: "Server-side logic: external API integrations and AI processing.",
        details: [
          "analyze-core — CV analysis of core samples via Gemini AI",
          "rank-wells — ML-based well ranking by potential",
          "fetch-wells — data retrieval from OCC ArcGIS API",
          "get-oil-price — current oil price fetching",
        ],
      },
    ],
  },
  {
    label: "AI / ML",
    color: "hsl(var(--warning))",
    nodes: [
      {
        id: "ai",
        title: "AI Gateway",
        icon: Brain,
        color: "warning",
        techs: ["Gemini 2.5 Flash", "Gemini Pro", "GPT-5"],
        description: "AI models for image analysis, well ranking, and production forecasting.",
        details: [
          "Computer Vision — core photo analysis (lithology, porosity)",
          "NLP — report and recommendation generation",
          "Scoring — ML well potential assessment (94% accuracy)",
          "Forecasting — production curve modeling",
        ],
      },
    ],
  },
  {
    label: "External APIs",
    color: "hsl(var(--success))",
    nodes: [
      {
        id: "occ",
        title: "OCC ArcGIS API",
        icon: Globe,
        color: "success",
        techs: ["REST", "GeoJSON", "Oklahoma"],
        description: "Oklahoma well data — coordinates, operators, statuses.",
        details: [
          "15,000+ wells with coordinates and metadata",
          "Filtering by county, operator, status",
          "GeoJSON format for map rendering",
          "24h polling for data updates",
        ],
      },
      {
        id: "iot",
        title: "IoT Telemetry",
        icon: Radio,
        color: "success",
        techs: ["MQTT", "HTTP", "RTU"],
        description: "Real-time telemetry stream from wellsite equipment.",
        details: [
          "Sensors → RTU → Transport (HTTP/MQTT)",
          "Packets every 1–15 min (pressure, flow rate, temp, water cut)",
          "Ingestion API → RLS Engine → Realtime dashboard",
          "RTU buffering on connectivity loss",
        ],
      },
    ],
  },
];
const ArchitectureNode = ({ node }: { node: ArchNode }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = node.icon;

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-${node.color}/30 hover:border-${node.color}/60`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${node.color}/10`}>
              <Icon className={`h-5 w-5 text-${node.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{node.title}</CardTitle>
              <div className="flex gap-1 mt-1 flex-wrap">
                {node.techs.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{node.description}</p>
        {expanded && (
          <ul className="mt-3 space-y-1.5 text-sm border-t pt-3">
            {node.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const Architecture = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
           Platform Architecture
        </h1>
        <p className="text-muted-foreground">
          SGOM — multi-layered architecture with data isolation, AI processing, and external source integration
        </p>
      </div>

      {/* Data Flow Summary */}
      <Card className="mb-8 bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm font-medium">
            {["Field Sensors", "→", "RTU / MQTT", "→", "Edge Functions", "→", "PostgreSQL + RLS", "→", "React UI", "→", "AI Reports"].map(
              (item, i) =>
                item === "→" ? (
                  <ArrowRight key={i} className="h-4 w-4 text-primary" />
                ) : (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layers */}
      <div className="space-y-8">
        {layers.map((layer) => (
          <div key={layer.label}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: layer.color }}
              />
              <h2 className="text-lg font-semibold">{layer.label}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layer.nodes.map((node) => (
                <ArchitectureNode key={node.id} node={node} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tech Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Stack Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "Modules", value: "20+" },
              { label: "Edge Functions", value: "4" },
              { label: "DB Tables", value: "3" },
              { label: "AI Models", value: "3" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Architecture;
