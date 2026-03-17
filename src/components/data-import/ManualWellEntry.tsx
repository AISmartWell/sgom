import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PenLine, Loader2, CheckCircle2 } from "lucide-react";

interface ManualWellEntryProps {
  companyId: string | null;
  onImportComplete: () => void;
}

const US_STATES = ["OK", "TX", "NM", "CO", "ND", "WY", "KS", "LA", "PA", "WV", "OH"];
const WELL_TYPES = ["OIL", "GAS", "OIL AND GAS", "INJECTION", "DISPOSAL", "DRY HOLE"];
const STATUSES = ["ACTIVE", "INACTIVE", "PLUGGED", "DRILLING", "COMPLETED", "PERMITTED"];

export const ManualWellEntry = ({ companyId, onImportComplete }: ManualWellEntryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    api_number: "",
    well_name: "",
    operator: "",
    well_type: "",
    status: "",
    county: "",
    state: "OK",
    latitude: "",
    longitude: "",
    formation: "",
    total_depth: "",
    production_oil: "",
    production_gas: "",
    water_cut: "",
    spud_date: "",
    completion_date: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast.error("No company found. Please log in first.");
      return;
    }
    if (!form.api_number || !form.well_name) {
      toast.error("API Number and Well Name are required");
      return;
    }

    if (form.latitude) {
      const lat = parseFloat(form.latitude);
      if (isNaN(lat) || lat < 24 || lat > 72) { toast.error("Latitude must be between 24 and 72"); return; }
    }
    if (form.longitude) {
      const lng = parseFloat(form.longitude);
      if (isNaN(lng) || lng < -180 || lng > -60) { toast.error("Longitude must be between -180 and -60"); return; }
    }

    setIsSubmitting(true);
    try {
      const wellData = {
        api_number: form.api_number.trim(),
        well_name: form.well_name.trim(),
        operator: form.operator.trim() || "Unknown",
        well_type: form.well_type || null,
        status: form.status || null,
        county: form.county.trim().toUpperCase() || null,
        state: form.state,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        formation: form.formation.trim() || null,
        total_depth: form.total_depth ? parseFloat(form.total_depth) : null,
        production_oil: form.production_oil ? parseFloat(form.production_oil) : null,
        production_gas: form.production_gas ? parseFloat(form.production_gas) : null,
        water_cut: form.water_cut ? parseFloat(form.water_cut) : null,
        spud_date: form.spud_date || null,
        completion_date: form.completion_date || null,
        company_id: companyId,
        source: "MANUAL",
      };

      const { error } = await supabase.from("wells").upsert(wellData, { onConflict: "api_number" });
      if (error) throw error;

      toast.success(`Well "${form.well_name}" saved successfully`);
      setForm({
        api_number: "", well_name: "", operator: "", well_type: "", status: "",
        county: "", state: "OK", latitude: "", longitude: "", formation: "",
        total_depth: "", production_oil: "", production_gas: "", water_cut: "",
        spud_date: "", completion_date: "",
      });
      onImportComplete();
    } catch (err) {
      console.error("Insert error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save well");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-primary" />
          Manual Well Entry
        </CardTitle>
        <CardDescription>
          Enter well data manually one at a time. API Number and Well Name are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="api_number">API Number *</Label>
              <Input id="api_number" placeholder="3500100001" value={form.api_number} onChange={(e) => updateField("api_number", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="well_name">Well Name *</Label>
              <Input id="well_name" placeholder="SMITH 1-24" value={form.well_name} onChange={(e) => updateField("well_name", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="operator">Operator</Label>
              <Input id="operator" placeholder="ALPHA PETROLEUM" value={form.operator} onChange={(e) => updateField("operator", e.target.value)} />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Well Type</Label>
              <Select value={form.well_type} onValueChange={(v) => updateField("well_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {WELL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="county">County</Label>
              <Input id="county" placeholder="CANADIAN" value={form.county} onChange={(e) => updateField("county", e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="any" placeholder="35.467" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="any" placeholder="-97.523" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="formation">Formation</Label>
              <Input id="formation" placeholder="MISSISSIPPIAN" value={form.formation} onChange={(e) => updateField("formation", e.target.value)} />
            </div>
          </div>

          {/* Production */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="total_depth">Total Depth (ft)</Label>
              <Input id="total_depth" type="number" placeholder="8500" value={form.total_depth} onChange={(e) => updateField("total_depth", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="production_oil">Oil (bbl/day)</Label>
              <Input id="production_oil" type="number" placeholder="150" value={form.production_oil} onChange={(e) => updateField("production_oil", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="production_gas">Gas (mcf/day)</Label>
              <Input id="production_gas" type="number" placeholder="300" value={form.production_gas} onChange={(e) => updateField("production_gas", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="water_cut">Water Cut (%)</Label>
              <Input id="water_cut" type="number" step="0.1" placeholder="25" value={form.water_cut} onChange={(e) => updateField("water_cut", e.target.value)} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="spud_date">Spud Date</Label>
              <Input id="spud_date" type="date" value={form.spud_date} onChange={(e) => updateField("spud_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="completion_date">Completion Date</Label>
              <Input id="completion_date" type="date" value={form.completion_date} onChange={(e) => updateField("completion_date", e.target.value)} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" />Save Well</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
