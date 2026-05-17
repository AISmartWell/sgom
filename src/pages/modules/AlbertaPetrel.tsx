import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, MapPin, Database, FileSpreadsheet, Activity } from "lucide-react";

type Well = {
  uwi: string;
  well_name: string | null;
  operator: string | null;
  well_type: string | null;
  status: string | null;
  formation: string | null;
  latitude: number | null;
  longitude: number | null;
  total_depth_ft: number | null;
  spud_date: string | null;
  source: string;
};

const REGIONS = [
  "ALL", "CARDIUM", "MONTNEY", "DUVERNAY", "VIKING",
  "ATHABASCA_OIL_SANDS", "PEACE_RIVER",
];

export default function AlbertaPetrel() {
  const [region, setRegion] = useState("CARDIUM");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [wells, setWells] = useState<Well[]>([]);
  const [selected, setSelected] = useState<Well | null>(null);
  const [production, setProduction] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const search = async () => {
    setLoading(true);
    setSelected(null);
    setProduction([]);
    setLogs([]);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-alberta-wells", {
        body: { action: "search", region, limit },
      });
      if (error) throw error;
      setWells(data.wells ?? []);
      toast.success(`Loaded ${data.count} wells from ${region}`);
    } catch (e: any) {
      toast.error(e.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const loadWellDetail = async (w: Well) => {
    setSelected(w);
    setProduction([]);
    setLogs([]);
    try {
      const [prodRes, logRes] = await Promise.all([
        supabase.functions.invoke("fetch-alberta-wells", {
          body: { action: "production", uwi: w.uwi, months: 36 },
        }),
        supabase.functions.invoke("fetch-alberta-wells", {
          body: { action: "logs", uwi: w.uwi, depth_from: 1500, depth_to: 3500 },
        }),
      ]);
      if (prodRes.data?.history) setProduction(prodRes.data.history);
      if (logRes.data?.logs) setLogs(logRes.data.logs);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const importWell = async () => {
    if (!selected) return;
    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to import wells");
        return;
      }
      const { data: uc } = await supabase
        .from("user_companies").select("company_id").eq("user_id", user.id).limit(1).single();
      if (!uc) {
        toast.error("No company linked to user");
        return;
      }
      const { data: well, error: wErr } = await supabase
        .from("wells")
        .insert({
          company_id: uc.company_id,
          well_name: selected.well_name ?? selected.uwi,
          api_number: selected.uwi,
          operator: selected.operator,
          well_type: selected.well_type,
          status: selected.status,
          formation: selected.formation,
          latitude: selected.latitude,
          longitude: selected.longitude,
          total_depth: selected.total_depth_ft,
          spud_date: selected.spud_date,
          state: "AB",
          source: "Alberta PETREL",
          raw_data: selected as any,
        })
        .select()
        .single();
      if (wErr) throw wErr;

      if (production.length > 0) {
        const rows = production.map((p) => ({
          company_id: uc.company_id,
          well_id: well.id,
          production_month: `${p.month}-01`,
          oil_bbl: p.oil_bbl,
          gas_mcf: p.gas_mcf,
          water_bbl: p.water_bbl,
          days_on: p.days_on,
        }));
        await supabase.from("production_history").insert(rows);
      }

      if (logs.length > 0) {
        const rows = logs.slice(0, 1000).map((l) => ({
          company_id: uc.company_id,
          well_id: well.id,
          measured_depth: l.depth_ft,
          gamma_ray: l.gamma_ray,
          density: l.density,
          neutron_porosity: l.neutron_porosity,
          resistivity: l.resistivity,
          source: "alberta-petrel",
        }));
        await supabase.from("well_logs").insert(rows);
      }

      toast.success(`Imported ${selected.uwi} into Wells, Production & Logs`);
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-primary text-primary">
              Data Source
            </Badge>
            <h1 className="text-3xl font-bold">Alberta PETREL</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Search Alberta (AER Public GIS) and Petrinex production data. Import directly into Wells, Production History and Well Logs.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Search wells
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Play / Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input type="number" min={1} max={200} value={limit}
              onChange={(e) => setLimit(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={search} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Search PETREL
            </Button>
          </div>
        </CardContent>
      </Card>

      {wells.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results · {wells.length} wells</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UWI</TableHead>
                    <TableHead>Well</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>TD (ft)</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wells.map((w) => (
                    <TableRow
                      key={w.uwi}
                      className={`cursor-pointer ${selected?.uwi === w.uwi ? "bg-primary/10" : ""}`}
                      onClick={() => loadWellDetail(w)}
                    >
                      <TableCell className="font-mono text-xs">{w.uwi}</TableCell>
                      <TableCell>{w.well_name}</TableCell>
                      <TableCell>{w.operator}</TableCell>
                      <TableCell>{w.well_type}</TableCell>
                      <TableCell>{w.status}</TableCell>
                      <TableCell>{w.formation}</TableCell>
                      <TableCell>{w.total_depth_ft}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{w.source}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selected.well_name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono mt-1">{selected.uwi}</p>
            </div>
            <Button onClick={importWell} disabled={importing}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Import to project
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="production">
              <TabsList>
                <TabsTrigger value="production"><Activity className="w-4 h-4 mr-2" /> Production ({production.length})</TabsTrigger>
                <TabsTrigger value="logs"><FileSpreadsheet className="w-4 h-4 mr-2" /> LAS Logs ({logs.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="production">
                <div className="overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Oil (bbl)</TableHead>
                        <TableHead>Gas (mcf)</TableHead>
                        <TableHead>Water (bbl)</TableHead>
                        <TableHead>Days On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {production.map((p) => (
                        <TableRow key={p.month}>
                          <TableCell>{p.month}</TableCell>
                          <TableCell>{p.oil_bbl}</TableCell>
                          <TableCell>{p.gas_mcf}</TableCell>
                          <TableCell>{p.water_bbl}</TableCell>
                          <TableCell>{p.days_on}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="logs">
                <div className="overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Depth (ft)</TableHead>
                        <TableHead>GR</TableHead>
                        <TableHead>RHOB</TableHead>
                        <TableHead>NPHI</TableHead>
                        <TableHead>RT (Ohm·m)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.slice(0, 200).map((l, i) => (
                        <TableRow key={i}>
                          <TableCell>{l.depth_ft}</TableCell>
                          <TableCell>{l.gamma_ray}</TableCell>
                          <TableCell>{l.density}</TableCell>
                          <TableCell>{l.neutron_porosity}</TableCell>
                          <TableCell>{l.resistivity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {logs.length > 200 && (
                    <p className="text-xs text-muted-foreground p-2">Showing first 200 of {logs.length} samples.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
