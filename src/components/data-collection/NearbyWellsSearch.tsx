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
  onComplete?: (count: number) => void;
}

const RADIUS_OPTIONS = [
  { value: "2", label: "2 miles" },
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
];

export const NearbyWellsSearch = ({ latitude, longitude, wellName, companyId, onComplete }: NearbyWellsSearchProps) => {
  const [radius, setRadius] = useState("5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fetched: number; stored: number } | null>(null);

  const searchNearby = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-texas-wells", {
        body: {
          company_id: companyId,
          latitude,
          longitude,
          radius_miles: Number(radius),
          limit: 200,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({ fetched: data.fetched, stored: data.stored });
      toast.success(`Found ${data.fetched} wells, imported ${data.stored} new wells`);
      onComplete?.(data.stored);
    } catch (e: any) {
      toast.error(e.message || "Failed to search nearby wells");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center gap-2">
        <Radar className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Find Nearby Wells (Texas RRC)</h4>
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
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">{result.fetched} found</Badge>
          <Badge className="bg-success/20 text-success border-success/30 text-xs">{result.stored} imported</Badge>
        </div>
      )}
    </div>
  );
};
