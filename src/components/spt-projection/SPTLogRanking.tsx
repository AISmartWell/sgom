import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListOrdered, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { WellLogPoint } from "@/hooks/useWellLogs";
import { rankFromLogs, SW_HIGH, K_LOW, type LogRankResult } from "@/lib/spt-log-ranking";

interface Row { id: string; name: string; r: LogRankResult }

export default function SPTLogRanking() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: ids } = await supabase.from("well_logs").select("well_id").limit(20000);
      const wellIds = [...new Set((ids ?? []).map((x) => x.well_id))].slice(0, 50);
      if (!wellIds.length) { setLoading(false); return; }
      const [{ data: wells }, { data: water }] = await Promise.all([
        supabase.from("wells").select("id, well_name, api_number").in("id", wellIds),
        supabase.from("well_water_inputs").select("well_id, rw_formation, rw_injection, injection_share_pct").in("well_id", wellIds),
      ]);
      const out: Row[] = [];
      for (const id of wellIds) {
        const { data: logs } = await supabase.from("well_logs")
          .select("measured_depth, gamma_ray, resistivity, porosity, water_saturation, sp, density, neutron_porosity, source")
          .eq("well_id", id).order("measured_depth").limit(10000);
        const r = rankFromLogs((logs ?? []) as WellLogPoint[], water?.find((x) => x.well_id === id));
        const w = wells?.find((x) => x.id === id);
        if (r) out.push({ id, name: w?.well_name ?? w?.api_number ?? id.slice(0, 8), r });
      }
      setRows(out.sort((a, b) => b.r.score - a.r.score));
      setLoading(false);
    })();
  }, []);

  const f = (v: number | null, d = 1) => (v == null ? "—" : v.toFixed(d));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ListOrdered className="h-4 w-4 text-primary" />Log-based SPT Ranking<Badge variant="outline" className="text-[10px]">Measured curves</Badge></CardTitle>
        <CardDescription>Wells with imported log curves, ranked with the Stage 8 solver (net + bypassed pay, porosity, Timur permeability, Archie Sw with the well's saved waterflood correction).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Interpreting log curves…</div>
        : rows.length === 0 ? <p className="text-sm text-muted-foreground">No wells with usable log curves (GR, resistivity, porosity) yet. Upload LAS files in Data Import.</p>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr className="border-b border-border">
                <th className="text-left p-2">#</th><th className="text-left p-2">Well</th><th className="text-right p-2">Score</th>
                <th className="text-right p-2">Net pay ft</th><th className="text-right p-2">Bypassed ft</th><th className="text-right p-2">φ %</th>
                <th className="text-right p-2">k mD</th><th className="text-right p-2">Sw %</th><th className="text-right p-2">Risk zones</th>
              </tr></thead>
              <tbody>
                {rows.map((x, i) => (<>
                  <tr key={x.id} className="border-b border-border/50">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{x.name}{x.r.waterfloodCorrected && <Badge variant="outline" className="ml-2 text-[10px]">Rw corrected</Badge>}</td>
                    <td className="p-2 text-right font-mono font-semibold text-primary">{x.r.score}</td>
                    <td className="p-2 text-right font-mono">{x.r.netPay}</td>
                    <td className="p-2 text-right font-mono">{x.r.missedPay}</td>
                    <td className="p-2 text-right font-mono">{f(x.r.avgPor)}</td>
                    <td className="p-2 text-right font-mono">{f(x.r.avgK, 2)}</td>
                    <td className="p-2 text-right font-mono">{f(x.r.avgSw)}</td>
                    <td className="p-2 text-right">
                      <Button size="sm" variant="ghost" disabled={!x.r.riskIntervals.length} onClick={() => setOpen(open === x.id ? null : x.id)}>{x.r.riskIntervals.length}</Button>
                    </td>
                  </tr>
                  {open === x.id && (
                    <tr key={`${x.id}-d`}><td colSpan={9} className="p-2 bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Reservoir intervals with Sw ≥ {SW_HIGH}% or k &lt; {K_LOW} mD — avoid or isolate when placing slots:</div>
                      <div className="flex flex-wrap gap-2">
                        {x.r.riskIntervals.map((iv) => {
                          const sw = iv.archieSwCalc ?? iv.avgSw;
                          return <Badge key={iv.top} variant="outline" className="font-mono text-[11px]">
                            {Math.round(iv.top)}–{Math.round(iv.bottom)} ft · Sw {sw.toFixed(0)}% · k {iv.timurPermMd != null ? iv.timurPermMd.toFixed(2) : "—"} mD
                            {sw >= SW_HIGH ? " · wet" : ""}{iv.timurPermMd != null && iv.timurPermMd < K_LOW ? " · tight" : ""}
                          </Badge>;
                        })}
                      </div>
                    </td></tr>
                  )}
                </>))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Score weights (screening defaults): pay 35, porosity 20, permeability 20, hydrocarbon saturation 25. Up to 50 wells.</p>
      </CardContent>
    </Card>
  );
}
