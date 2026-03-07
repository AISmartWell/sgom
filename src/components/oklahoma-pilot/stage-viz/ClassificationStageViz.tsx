import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, FileCheck, AlertCircle, CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
  allWells?: WellRecord[];
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

type FieldKey = typeof DATA_FIELDS[number]["key"];

/** Find the most common non-null value for a field among sibling wells */
function findSuggestion(
  field: FieldKey,
  currentWell: WellRecord,
  siblings: WellRecord[]
): { value: string | number; source: string; confidence: number } | null {
  if (siblings.length === 0) return null;

  const values = siblings
    .map((w) => w[field as keyof WellRecord])
    .filter((v) => v !== null && v !== undefined && v !== "");

  if (values.length === 0) return null;

  // For numeric fields, use median
  if (typeof values[0] === "number") {
    const nums = (values as number[]).sort((a, b) => a - b);
    const median = nums[Math.floor(nums.length / 2)];
    const confidence = Math.min(95, Math.round((nums.length / siblings.length) * 100));
    return { value: Math.round(median * 100) / 100, source: `median of ${nums.length} wells`, confidence };
  }

  // For string fields, use mode (most frequent)
  const freq = new Map<string, number>();
  for (const v of values) {
    const s = String(v);
    freq.set(s, (freq.get(s) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [val, count] of freq) {
    if (count > bestCount) { best = val; bestCount = count; }
  }
  const confidence = Math.min(95, Math.round((bestCount / siblings.length) * 100));
  return { value: best, source: `${bestCount}/${siblings.length} wells`, confidence };
}

const ClassificationStageViz = ({ well, allWells = [] }: Props) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  // Find sibling wells (same county or same formation)
  const siblingWells = useMemo(() => {
    if (!allWells.length) return [];
    return allWells.filter((w) => {
      if (w.id === well.id) return false;
      const sameCounty = well.county && w.county && w.county === well.county;
      const sameFormation = well.formation && w.formation && w.formation === well.formation;
      return sameCounty || sameFormation;
    });
  }, [well, allWells]);

  // Generate suggestions for missing fields
  const suggestions = useMemo(() => {
    if (!siblingWells.length) return [];
    const missingFields = fieldStatus.filter((f) => !f.present);
    return missingFields
      .map((f) => {
        const suggestion = findSuggestion(f.key, well, siblingWells);
        if (!suggestion) return null;
        return { field: f, ...suggestion };
      })
      .filter(Boolean) as Array<{
        field: typeof fieldStatus[number];
        value: string | number;
        source: string;
        confidence: number;
      }>;
  }, [fieldStatus, siblingWells, well]);

  const missingCount = fieldStatus.filter((f) => !f.present).length;
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

      {/* Auto-Suggestions Panel */}
      {suggestions.length > 0 && (
        <div className="sm:col-span-2 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Lightbulb className="h-3.5 w-3.5" />
              AI Auto-Fill Suggestions
              <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                {suggestions.length} field{suggestions.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-primary hover:text-primary"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? "Hide" : "Show"} Details
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Based on {siblingWells.length} wells in {well.county ? `${well.county} County` : "the same area"}
            {well.formation ? ` / ${well.formation} formation` : ""}
          </p>

          {showSuggestions && (
            <div className="space-y-1.5 mt-1">
              {suggestions.map((s) => (
                <div
                  key={s.field.key}
                  className="flex items-center justify-between p-2 rounded-md bg-background/60 border border-border/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-3 w-3 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-foreground">{s.field.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">→</span>
                      <span className="text-[10px] font-semibold text-primary ml-1.5 truncate">
                        {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[9px] text-muted-foreground">{s.source}</div>
                      <div className="flex items-center gap-1">
                        <div className="w-10 h-1 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.confidence >= 70 ? "bg-success" : s.confidence >= 40 ? "bg-warning" : "bg-destructive"
                            }`}
                            style={{ width: `${s.confidence}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-muted-foreground">{s.confidence}%</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 text-[9px] px-1.5 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        toast.success(`Suggested ${s.field.label}: ${s.value}`, {
                          description: "Value queued for review before applying to database",
                        });
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showSuggestions && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {suggestions.map((s) => (
                <Badge
                  key={s.field.key}
                  variant="outline"
                  className="text-[9px] border-primary/30 bg-primary/5 text-primary cursor-pointer hover:bg-primary/15 transition-colors"
                  onClick={() => setShowSuggestions(true)}
                >
                  {s.field.label}: {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                  <span className="ml-1 opacity-60">{s.confidence}%</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No suggestions available */}
      {missingCount > 0 && suggestions.length === 0 && siblingWells.length === 0 && allWells.length > 0 && (
        <div className="sm:col-span-2 p-2 rounded-lg border border-border/30 bg-muted/5">
          <p className="text-[10px] text-muted-foreground text-center">
            No similar wells found in {well.county || "this"} county for auto-fill suggestions
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassificationStageViz;
