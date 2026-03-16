import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnhancedWellLog from "@/components/well-log/EnhancedWellLog";
import { supabase } from "@/integrations/supabase/client";

interface WellOption {
  id: string;
  well_name: string | null;
  api_number: string | null;
  formation: string | null;
  total_depth: number | null;
}

const GeophysicalExpertise = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState<WellOption[]>([]);
  const [selectedWell, setSelectedWell] = useState<WellOption | null>(null);

  useEffect(() => {
    const fetchWells = async () => {
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, formation, total_depth")
        .order("well_name", { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setWells(data);
        // Default to Brawner 10-15 if available
        const brawner = data.find(w => w.api_number === "42467309790000");
        setSelectedWell(brawner || data[0]);
      }
    };
    fetchWells();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Geophysical Expertise</h1>
              <Badge className="text-xs">Stage 8</Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            AI-powered well log interpretation and formation evaluation
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Activity className="mr-1 h-3 w-3" />
          Well Log AI
        </Badge>
      </div>

      {/* Well Selector */}
      {wells.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-muted-foreground font-medium">Well:</label>
          <select
            value={selectedWell?.id || ""}
            onChange={(e) => {
              const w = wells.find(w => w.id === e.target.value);
              if (w) setSelectedWell(w);
            }}
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.well_name || w.api_number || w.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Well Log */}
      {selectedWell && (
        <EnhancedWellLog
          wellId={selectedWell.id}
          wellName={selectedWell.well_name || "Unknown Well"}
          formation={selectedWell.formation}
          defaultExpanded={true}
          totalDepth={selectedWell.total_depth ?? undefined}
        />
      )}

      {!selectedWell && wells.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No wells found. Import wells first to view well log analysis.</p>
        </div>
      )}
    </div>
  );
};

export default GeophysicalExpertise;
