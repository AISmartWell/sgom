import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sptScreening, wellVerdictLabel, type SptVerdict } from "@/lib/spt-sandbox-verdict";
import { sptSuitability } from "@/lib/spt-suitability";

type Well = {
  id: string; well_name: string | null; api_number: string | null; state: string; status: string | null;
  well_type: string | null; total_depth: number | null; water_cut: number | null;
  production_oil: number | null; production_gas: number | null;
  spud_date: string | null; completion_date: string | null;
};
type ApiCall = { well_ref: string | null; action: string; verdict: string | null; created_at: string };

const variant = (v: SptVerdict) => (v === "candidate" ? "default" : v === "conditional" ? "secondary" : "destructive") as "default" | "secondary" | "destructive";
const suitVariant = (tone: string) => (tone === "success" ? "default" : tone === "warning" ? "secondary" : tone === "destructive" ? "destructive" : "outline") as "default" | "secondary" | "destructive" | "outline";
const suitCell = (w: Well, id: string) => sptSuitability(w).checks.find((c) => c.id === id);

const WellVerdicts = () => {
  const [wells, setWells] = useState<Well[]>([]);
  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [w, c] = await Promise.all([
        supabase.from("wells").select("id, well_name, api_number, state, status, well_type, total_depth, water_cut, production_oil, production_gas, spud_date, completion_date").order("well_name").limit(2000),
        supabase.from("api_call_log").select("well_ref, action, verdict, created_at").in("action", ["spt_screening", "well_verdict"]).is("error_code", null).order("created_at", { ascending: false }).limit(500),
      ]);
      setWells((w.data as Well[]) ?? []);
      setCalls((c.data as ApiCall[]) ?? []);
    })();
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return wells
      .filter((w) => !s || (w.well_name ?? "").toLowerCase().includes(s) || (w.api_number ?? "").includes(s))
      .slice(0, 300)
      .map((w) => {
        const r = sptScreening(w);
        const suit = sptSuitability(w);
        const last = calls.find((c) => c.well_ref && (c.well_ref === w.well_name || c.well_ref === w.api_number));
        return { w, r, suit, last };
      });
  }, [wells, calls, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { candidate: 0, conditional: 0, not_recommended: 0 };
    wells.forEach((w) => { c[sptScreening(w).verdict]++; });
    return c;
  }, [wells]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <Badge variant="outline" className="mb-2">Stage 6 · SPT</Badge>
        <h1 className="text-3xl font-bold">Well Verdicts</h1>
        <p className="text-muted-foreground mt-1">
          spt_screening and well_verdict results for your wells, computed with the same rules as the Upstrima sandbox API. Screening only — not an engineering program.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>SPT candidate: {counts.candidate}</Badge>
        <Badge variant="secondary">Conditional: {counts.conditional}</Badge>
        <Badge variant="destructive">Not recommended: {counts.not_recommended}</Badge>
      </div>
      <Input placeholder="Search by well name or API number" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <Tabs defaultValue="verdict">
        <TabsList>
          <TabsTrigger value="verdict">Well verdict</TabsTrigger>
          <TabsTrigger value="screening">SPT screening</TabsTrigger>
          <TabsTrigger value="suitability">Maxxwell criteria</TabsTrigger>
        </TabsList>
        <TabsContent value="verdict">
          <Card className="glass-card"><CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Well</TableHead><TableHead>API</TableHead><TableHead>Depth, ft</TableHead>
                <TableHead>Verdict</TableHead><TableHead>Maxxwell criteria</TableHead><TableHead>Confidence</TableHead><TableHead>Last returned via API</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map(({ w, r, suit, last }) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.well_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{w.api_number ?? "—"}</TableCell>
                    <TableCell>{w.total_depth ?? "—"}</TableCell>
                    <TableCell><Badge variant={variant(r.verdict)}>{wellVerdictLabel(r.verdict)}</Badge></TableCell>
                    <TableCell><Badge variant={suitVariant(suit.labelTone)}>{suit.label}</Badge></TableCell>
                    <TableCell className="text-sm">{r.confidence}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{last ? `${last.verdict} · ${new Date(last.created_at).toLocaleString()}` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="screening">
          <Card className="glass-card"><CardHeader><CardTitle className="text-base">Screening factors</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Well</TableHead><TableHead>Result</TableHead><TableHead>Fluid</TableHead>
                <TableHead>Factors for</TableHead><TableHead>Risks</TableHead><TableHead>Missing data</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map(({ w, r }) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.well_name ?? w.api_number ?? "—"}</TableCell>
                    <TableCell><Badge variant={variant(r.verdict)}>{r.verdict}</Badge></TableCell>
                    <TableCell>{r.fluid}</TableCell>
                    <TableCell className="text-xs">{r.factors_for.join("; ") || "—"}</TableCell>
                    <TableCell className="text-xs text-destructive">{r.risks.join("; ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.missing_data.join(", ") || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="suitability">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Well suitability — Maxxwell operational criteria</CardTitle>
              <p className="text-xs text-muted-foreground">
                Screening guidance from Maxxwell Production's documented "preferred wells" criteria. PRELIMINARY — it does not change the SPT verdict; expert confirmation is a separate service.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Well</TableHead>
                  <TableHead>Suitability</TableHead>
                  <TableHead>Operation period</TableHead>
                  <TableHead>Water problems</TableHead>
                  <TableHead>Current inflow</TableHead>
                  <TableHead>Opening method</TableHead>
                  <TableHead>Reservoirs</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map(({ w, suit }) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.well_name ?? w.api_number ?? "—"}</TableCell>
                      <TableCell><Badge variant={suitVariant(suit.labelTone)}>{suit.label}</Badge></TableCell>
                      {["operation_period", "no_water_problems", "current_inflow", "opening_method", "reservoirs"].map((id) => {
                        const c = suit.checks.find((x) => x.id === id)!;
                        return (
                          <TableCell key={id} className={`text-xs ${c.state === "unknown" ? "text-muted-foreground" : ""}`} title={c.detail}>
                            {c.state === "met" ? "✓ " : c.state === "not_met" ? "✕ " : c.state === "caution" ? "! " : ""}
                            {c.detail}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WellVerdicts;
