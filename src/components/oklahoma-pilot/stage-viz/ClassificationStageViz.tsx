import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, FileCheck, AlertCircle, CheckCircle2 } from "lucide-react";

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  well: WellRecord;
}

const DATA_FIELDS = [
  { key: "well_name", label: "Well Name", category: "Identity" },
  { key: "api_number", label: "API Number", category: "Identity" },
  { key: "operator", label: "Operator", category: "Identity" },
  { key: "county", label: "County", category: "Location" },
  { key: "latitude", label: "Latitude", category: "Location" },
  { key: "longitude", label: "Longitude", category: "Location" },
  { key: "formation", label: "Formation", category: "Geology" },
  { key: "total_depth", label: "Total Depth", category: "Geology" },
  { key: "well_type", label: "Well Type", category: "Geology" },
  { key: "production_oil", label: "Oil Production", category: "Production" },
  { key: "production_gas", label: "Gas Production", category: "Production" },
  { key: "water_cut", label: "Water Cut", category: "Production" },
  { key: "status", label: "Status", category: "Operations" },
] as const;

const CATEGORIES = ["Identity", "Location", "Geology", "Production", "Operations"] as const;

const ClassificationStageViz = ({ well }: Props) => {
  const fieldStatus = useMemo(() => {
    return DATA_FIELDS.map((f) => {
      const val = well[f.key as keyof WellRecord];
      const present = val !== null && val !== undefined && val !== "";
      return { ...f, present, value: val };
    });
  }, [well]);

  const completeness = useMemo(() => {
    const filled = fieldStatus.filter((f) => f.present).length;
    return Math.round((filled / fieldStatus.length) * 100);
  }, [fieldStatus]);

  const categoryScores = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const fields = fieldStatus.filter((f) => f.category === cat);
      const filled = fields.filter((f) => f.present).length;
      return { category: cat, filled, total: fields.length, pct: Math.round((filled / fields.length) * 100) };
    });
  }, [fieldStatus]);

  const qualityRating = completeness >= 85 ? "High" : completeness >= 60 ? "Medium" : "Low";
  const qualityColor = completeness >= 85 ? "text-success" : completeness >= 60 ? "text-warning" : "text-destructive";

  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Data Completeness Gauge */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Database className="h-3.5 w-3.5 text-primary" />
          Data Completeness
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={completeness >= 85 ? "hsl(var(--success, 142 76% 36%))" : completeness >= 60 ? "hsl(var(--warning, 38 92% 50%))" : "hsl(var(--destructive))"}
                strokeWidth="8"
                strokeDasharray={`${completeness * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${qualityColor}`}>{completeness}%</span>
              <span className="text-[9px] text-muted-foreground">Complete</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Badge variant="outline" className={`text-[10px] ${qualityColor}`}>
            {qualityRating} Quality
          </Badge>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FileCheck className="h-3.5 w-3.5 text-primary" />
          Category Coverage
        </div>
        <div className="space-y-2">
          {categoryScores.map((cat) => (
            <div key={cat.category} className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{cat.category}</span>
                <span className="font-medium">{cat.filled}/{cat.total}</span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    cat.pct === 100 ? "bg-success" : cat.pct >= 50 ? "bg-warning" : "bg-destructive"
                  }`}
                  style={{ width: `${cat.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field-level Detail Grid */}
      <div className="sm:col-span-2 p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="h-3.5 w-3.5 text-primary" />
          Field Classification
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {fieldStatus.map((f) => (
            <div
              key={f.key}
              className={`flex items-center gap-1.5 p-1.5 rounded text-[10px] ${
                f.present ? "bg-success/10" : "bg-destructive/10"
              }`}
            >
              {f.present ? (
                <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
              ) : (
                <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
              )}
              <span className={f.present ? "text-foreground" : "text-destructive"}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassificationStageViz;
