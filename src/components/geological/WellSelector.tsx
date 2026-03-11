import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";

export interface SelectedWell {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
  county: string | null;
  state: string;
  operator: string | null;
  status: string | null;
  production_oil: number | null;
  water_cut: number | null;
}

interface WellSelectorProps {
  selectedWell: SelectedWell | null;
  onSelect: (well: SelectedWell | null) => void;
}

const WellSelector = ({ selectedWell, onSelect }: WellSelectorProps) => {
  const [wells, setWells] = useState<SelectedWell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWells = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth, county, state, operator, status, production_oil, water_cut")
        .order("well_name", { ascending: true })
        .limit(200);
      setWells((data as SelectedWell[]) || []);
      setLoading(false);
    };
    fetchWells();
  }, []);

  const label = (w: SelectedWell) =>
    w.well_name || w.api_number || w.id.slice(0, 8);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Bind to Well</span>
        {selectedWell && (
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            {selectedWell.formation || selectedWell.state}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading wells…
        </div>
      ) : wells.length === 0 ? (
        <p className="text-xs text-muted-foreground">No wells in database. Import wells first.</p>
      ) : (
        <Select
          value={selectedWell?.id || "none"}
          onValueChange={(val) => {
            if (val === "none") return onSelect(null);
            const w = wells.find((w) => w.id === val);
            onSelect(w || null);
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select a well (optional)" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="none" className="text-xs text-muted-foreground">
              No well — synthetic demo
            </SelectItem>
            {wells.map((w) => (
              <SelectItem key={w.id} value={w.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label(w)}</span>
                  {w.formation && (
                    <span className="text-muted-foreground">• {w.formation}</span>
                  )}
                  {w.county && (
                    <span className="text-muted-foreground">• {w.county}, {w.state}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedWell && (
        <div className="grid grid-cols-4 gap-2 text-[10px]">
          <div className="p-1.5 rounded bg-muted/30">
            <p className="text-muted-foreground">Depth</p>
            <p className="font-medium">{selectedWell.total_depth?.toLocaleString() || "—"} ft</p>
          </div>
          <div className="p-1.5 rounded bg-muted/30">
            <p className="text-muted-foreground">Oil</p>
            <p className="font-medium">{selectedWell.production_oil?.toFixed(0) || "—"} bbl/d</p>
          </div>
          <div className="p-1.5 rounded bg-muted/30">
            <p className="text-muted-foreground">Water Cut</p>
            <p className="font-medium">{selectedWell.water_cut?.toFixed(1) || "—"}%</p>
          </div>
          <div className="p-1.5 rounded bg-muted/30">
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">{selectedWell.status || "—"}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellSelector;
