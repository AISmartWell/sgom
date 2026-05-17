import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Database, ShieldCheck, ShieldAlert } from "lucide-react";

type SourceKey = "alberta_petrel" | "texas_rrc" | "oklahoma_occ" | "kansas_kgs";

type SourceDef = {
  key: SourceKey;
  label: string;
  jurisdiction: string;
  fn: string;
  regions: string[];
  buildBody: (region: string, limit: number) => Record<string, unknown>;
  parse: (data: any) => any[];
};

const SOURCES: SourceDef[] = [
  {
    key: "alberta_petrel",
    label: "Alberta PETREL (AER + Petrinex)",
    jurisdiction: "Canada · Alberta",
    fn: "fetch-alberta-wells",
    regions: ["ALL", "CARDIUM", "MONTNEY", "DUVERNAY", "VIKING", "ATHABASCA_OIL_SANDS", "PEACE_RIVER"],
    buildBody: (region, limit) => ({ action: "search", region, limit }),
    parse: (d) => d?.wells ?? [],
  },
  {
    key: "texas_rrc",
    label: "Texas RRC Public Viewer",
    jurisdiction: "USA · Texas",
    fn: "fetch-texas-wells",
    regions: ["ALL", "PERMIAN", "EAGLE_FORD", "BARNETT"],
    buildBody: (region, limit) => ({ region, limit }),
    parse: (d) => d?.wells ?? [],
  },
  {
    key: "oklahoma_occ",
    label: "Oklahoma OCC",
    jurisdiction: "USA · Oklahoma",
    fn: "fetch-wells",
    regions: ["ALL", "ANADARKO", "ARKOMA", "ARDMORE"],
    buildBody: (region, limit) => ({ state: "OK", region, limit }),
    parse: (d) => d?.wells ?? [],
  },
  {
    key: "kansas_kgs",
    label: "Kansas Geological Survey",
    jurisdiction: "USA · Kansas",
    fn: "fetch-wells",
    regions: ["ALL", "HUGOTON", "CHEROKEE", "SEDGWICK"],
    buildBody: (region, limit) => ({ state: "KS", region, limit }),
    parse: (d) => d?.wells ?? [],
  },
];

export default function AdminImport() {
  const [sourceKey, setSourceKey] = useState<SourceKey>("alberta_petrel");
  const [region, setRegion] = useState("CARDIUM");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const source = SOURCES.find((s) => s.key === sourceKey)!;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }
      const [{ data: roles }, { data: uc }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("user_companies").select("company_id").eq("user_id", user.id).limit(1).maybeSingle(),
      ]);
      setIsAdmin(roles?.some((r: any) => r.role === "admin") ?? false);
      setCompanyId(uc?.company_id ?? null);
    })();
  }, []);

  useEffect(() => {
    setRegion(source.regions[0] === "ALL" ? source.regions[1] ?? "ALL" : source.regions[0]);
    setResults([]);
  }, [sourceKey]);

  const runFetch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke(source.fn, {
        body: source.buildBody(region, limit),
      });
      if (error) throw error;
      const rows = source.parse(data);
      setResults(rows);
      toast.success(`${source.label} · ${rows.length} wells from ${region}`);
    } catch (e: any) {
      toast.error(e.message ?? "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    if (!companyId) { toast.error("No company linked"); return; }
    if (results.length === 0) { toast.error("Nothing to import"); return; }
    setImporting(true);
    try {
      const rows = results.map((w: any) => ({
        company_id: companyId,
        well_name: w.well_name ?? w.uwi ?? w.api_number ?? "Unknown",
        api_number: w.uwi ?? w.api_number ?? null,
        operator: w.operator ?? null,
        well_type: w.well_type ?? null,
        status: w.status ?? null,
        formation: w.formation ?? null,
        latitude: w.latitude ?? null,
        longitude: w.longitude ?? null,
        total_depth: w.total_depth_ft ?? w.total_depth ?? null,
        spud_date: w.spud_date ?? null,
        state: source.key === "alberta_petrel" ? "AB"
          : source.key === "texas_rrc" ? "TX"
          : source.key === "oklahoma_occ" ? "OK" : "KS",
        source: source.label,
        raw_data: w,
      }));
      const { error } = await supabase.from("wells").insert(rows);
      if (error) throw error;
      toast.success(`Imported ${rows.length} wells from ${source.label}`);
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (isAdmin === null) {
    return <div className="p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Admin role required to access data import controls.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
        <h1 className="text-3xl font-bold">Open Data Import</h1>
        <ShieldCheck className="w-5 h-5 text-primary ml-auto" />
      </div>
      <p className="text-muted-foreground -mt-4">
        Run targeted imports from public registries scoped by jurisdiction and play.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" /> Source &amp; region
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Data source</Label>
            <Select value={sourceKey} onValueChange={(v) => setSourceKey(v as SourceKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label} <span className="text-xs text-muted-foreground ml-2">· {s.jurisdiction}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Region / Play</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {source.regions.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input type="number" min={1} max={500} value={limit}
              onChange={(e) => setLimit(Number(e.target.value))} />
          </div>
          <div className="md:col-span-4 flex gap-3">
            <Button onClick={runFetch} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Preview import
            </Button>
            <Button onClick={runImport} disabled={importing || results.length === 0} variant="default">
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Import {results.length > 0 ? `${results.length} wells` : ""}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview · {results.length} wells from {region}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Well</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.slice(0, 200).map((w: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{w.uwi ?? w.api_number}</TableCell>
                      <TableCell>{w.well_name}</TableCell>
                      <TableCell>{w.operator}</TableCell>
                      <TableCell>{w.well_type}</TableCell>
                      <TableCell>{w.status}</TableCell>
                      <TableCell>{w.formation}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{w.source ?? source.label}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {results.length > 200 && (
                <p className="text-xs text-muted-foreground p-2">Showing first 200 of {results.length}.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
