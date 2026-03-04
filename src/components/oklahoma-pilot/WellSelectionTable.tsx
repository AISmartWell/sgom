import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";

interface WellRecord {
  id: string;
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  water_cut: number | null;
  production_oil: number | null;
  production_gas: number | null;
  formation: string | null;
  total_depth?: number | null;
}

type SptRating = "excellent" | "good" | "marginal" | "not_suitable";

interface WellSelectionTableProps {
  wells: WellRecord[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  maxSelection?: number;
  getSptRating?: (well: WellRecord) => SptRating;
}

const ratingConfig: Record<SptRating, { label: string; className: string }> = {
  excellent: { label: "Excellent", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  good: { label: "Good", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  marginal: { label: "Marginal", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  not_suitable: { label: "N/A", className: "bg-muted text-muted-foreground" },
};

const WellSelectionTable = ({
  wells,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  maxSelection = 20,
  getSptRating: getSptRatingProp,
}: WellSelectionTableProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {selectedIds.size} of {wells.length} selected (max {maxSelection})
        </p>
        <div className="flex gap-2">
          <button onClick={onSelectAll} className="text-xs text-primary hover:underline">
            Select top {maxSelection}
          </button>
          <button onClick={onDeselectAll} className="text-xs text-muted-foreground hover:underline">
            Clear all
          </button>
        </div>
      </div>
      <ScrollArea className="max-h-[500px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-border/50">
              <th className="p-2 w-8" />
              <th className="p-2 text-left font-medium text-muted-foreground">SPT Rating</th>
              <th className="p-2 text-left font-medium text-muted-foreground">Well Name</th>
              <th className="p-2 text-left font-medium text-muted-foreground">API #</th>
              <th className="p-2 text-left font-medium text-muted-foreground">County</th>
              <th className="p-2 text-left font-medium text-muted-foreground">Operator</th>
              <th className="p-2 text-right font-medium text-muted-foreground">Oil (bbl/d)</th>
              <th className="p-2 text-right font-medium text-muted-foreground">WC %</th>
              <th className="p-2 text-right font-medium text-muted-foreground">Depth (ft)</th>
              <th className="p-2 text-left font-medium text-muted-foreground">Formation</th>
            </tr>
          </thead>
          <tbody>
            {wells.map((well) => {
              const isSelected = selectedIds.has(well.id);
              const wc = well.water_cut ?? 0;
              const rating = getSptRatingProp?.(well) ?? "not_suitable";
              const rc = ratingConfig[rating];
              return (
                <tr
                  key={well.id}
                  className={`border-b border-border/20 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/5" : rating === "not_suitable" ? "opacity-50 hover:opacity-70" : "hover:bg-muted/30"
                  }`}
                  onClick={() => onToggle(well.id)}
                >
                  <td className="p-2">
                    <Checkbox
                      checked={isSelected}
                      disabled={!isSelected && selectedIds.size >= maxSelection}
                      onCheckedChange={() => onToggle(well.id)}
                    />
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className={rc.className + " text-[10px]"}>
                      {rc.label}
                    </Badge>
                  </td>
                  <td className="p-2 font-medium">{well.well_name || "—"}</td>
                  <td className="p-2 text-muted-foreground">{well.api_number || "—"}</td>
                  <td className="p-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-primary" />
                      {well.county || "—"}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground">{well.operator || "—"}</td>
                  <td className="p-2 text-right font-medium">{well.production_oil?.toFixed(1) ?? "—"}</td>
                  <td className="p-2 text-right">
                    <span className={`font-medium ${wc > 70 ? "text-destructive" : wc > 50 ? "text-yellow-400" : "text-success"}`}>
                      {well.water_cut?.toFixed(1) ?? "—"}%
                    </span>
                  </td>
                  <td className="p-2 text-right text-muted-foreground">{well.total_depth?.toFixed(0) ?? "—"}</td>
                  <td className="p-2 text-muted-foreground">{well.formation || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
};

export default WellSelectionTable;
