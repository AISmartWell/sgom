import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Droplets, Fuel, Layers, Calendar, Building2, Hash } from "lucide-react";
import ProductionHistoryChart from "@/components/production-history/ProductionHistoryChart";
import { NearbyWellsSearch } from "./NearbyWellsSearch";

interface WellRecord {
  id: string;
  api_number: string | null;
  well_name: string | null;
  operator: string | null;
  well_type: string | null;
  status: string | null;
  county: string | null;
  state: string;
  latitude: number | null;
  longitude: number | null;
  formation: string | null;
  total_depth: number | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  spud_date: string | null;
  completion_date: string | null;
  company_id?: string;
}

interface WellDetailDialogProps {
  well: WellRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
    <span className="text-sm font-medium">{value || "—"}</span>
  </div>
);

export const WellDetailDialog = ({ well, open, onOpenChange }: WellDetailDialogProps) => {
  if (!well) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Fuel className="h-5 w-5 text-primary" />
            {well.well_name || "Unnamed Well"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-3">
          <div className="space-y-1">
            <div className="flex gap-2 mb-4">
              <Badge variant="outline">{well.well_type || "Unknown type"}</Badge>
              <Badge className={
                well.status === "ACTIVE" ? "bg-success/20 text-success border-success/30" :
                well.status === "PLUGGED" ? "bg-muted text-muted-foreground" :
                "bg-warning/20 text-warning border-warning/30"
              }>
                {well.status || "Unknown"}
              </Badge>
            </div>

            <InfoRow icon={Hash} label="API Number" value={<span className="font-mono">{well.api_number}</span>} />
            <InfoRow icon={Building2} label="Operator" value={well.operator} />
            <InfoRow icon={MapPin} label="Location" value={`${well.county || "—"}, ${well.state}`} />
            <InfoRow icon={MapPin} label="Coordinates" value={
              well.latitude && well.longitude
                ? `${well.latitude.toFixed(5)}, ${well.longitude.toFixed(5)}`
                : null
            } />
            <InfoRow icon={Layers} label="Formation" value={well.formation} />
            <InfoRow icon={Layers} label="Total Depth" value={well.total_depth ? `${well.total_depth.toLocaleString()} ft` : null} />
            <InfoRow icon={Droplets} label="Oil Production" value={well.production_oil ? `${well.production_oil.toLocaleString()} bbl` : null} />
            <InfoRow icon={Fuel} label="Gas Production" value={well.production_gas ? `${well.production_gas.toLocaleString()} mcf` : null} />
            <InfoRow icon={Droplets} label="Water Cut" value={well.water_cut ? `${(well.water_cut * 100).toFixed(1)}%` : null} />
            <InfoRow icon={Calendar} label="Spud Date" value={well.spud_date} />
            <InfoRow icon={Calendar} label="Completion Date" value={well.completion_date} />
          </div>

          {/* Nearby Wells Search - for any state with coordinates */}
          {well.latitude && well.longitude && well.company_id && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <NearbyWellsSearch
                latitude={well.latitude}
                longitude={well.longitude}
                wellName={well.well_name || "Unknown"}
                companyId={well.company_id}
                state={well.state}
              />
            </div>
          )}

          {/* Production History Chart */}
          <div className="mt-4 pt-4 border-t border-border/40">
            <ProductionHistoryChart wellId={well.id} wellName={well.well_name || undefined} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
