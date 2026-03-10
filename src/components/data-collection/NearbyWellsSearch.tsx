import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NearbyWellsSearchProps {
  latitude: number;
  longitude: number;
  wellName: string;
  companyId: string;
  state: string;
  onComplete?: (count: number) => void;
}

const RADIUS_OPTIONS = [
  { value: "2", label: "2 miles" },
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
];

const SUPPORTED_STATES: Record<string, string> = {
  TX: "Texas RRC",
  OK: "Oklahoma OCC",
  KS: "Kansas KGS",
  NM: "New Mexico OCD",
  CO: "Colorado COGCC",
  ND: "North Dakota NDIC",
  WY: "Wyoming WOGCC",
};

export const NearbyWellsSearch = ({ latitude, longitude, wellName, companyId, state, onComplete }: NearbyWellsSearchProps) => {
  const [radius, setRadius] = useState("5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fetched: number; stored: number; source: string } | null>(null);

  const stateLabel = SUPPORTED_STATES[state] || state;
  const isSupported = state in SUPPORTED_STATES;

  const searchNearby = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-nearby-wells", {
        body: {
          company_id: companyId,
          state,
          latitude,
          longitude,
          radius_miles: Number(radius),
          limit: 200,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({ fetched: data.fetched, stored: data.stored, source: data.source || stateLabel });
      toast.success(`Found ${data.fetched} wells, imported ${data.stored} new wells from ${data.source || stateLabel}`);
      onComplete?.(data.stored);
    } catch (e: any) {
      toast.error(e.message || "Failed to search nearby wells");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-2 p-4 rounded-lg border border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-muted-foreground">Nearby Wells Search</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          State <span className="font-medium">{state}</span> is not yet supported. Supported states: {Object.keys(SUPPORTED_STATES).join(", ")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center gap-2">
        <Radar className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Find Nearby Wells</h4>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{stateLabel}</Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Search for wells near <span className="font-medium text-foreground">{wellName}</span> ({latitude.toFixed(4)}, {longitude.toFixed(4)})
      </p>

      <div className="flex items-center gap-2">
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={searchNearby} disabled={loading} className="h-8 text-xs">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <MapPin className="h-3.5 w-3.5 mr-1" />}
          Search
        </Button>
      </div>

      {result && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{result.fetched} found</Badge>
          <Badge className="bg-success/20 text-success border-success/30 text-xs">{result.stored} imported</Badge>
          <Badge variant="secondary" className="text-xs">{result.source}</Badge>
        </div>
      )}
    </div>
  );
};
