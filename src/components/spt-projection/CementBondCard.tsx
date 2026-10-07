import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCblFromLas, assessInterval, BI_GOOD, BI_MODERATE, ISOLATION_FT, CBL_MNEMONICS, type CblLog, type BondVerdict } from "@/lib/cement-bond";

interface Props { intervals: { top: number; bottom: number }[] }

const verdictLabel: Record<BondVerdict, { t: string; c: string }> = {
  isolated: { t: "Isolated — SPT OK", c: "text-success" },
  questionable: { t: "Questionable — review VDL", c: "text-warning" },
  poor: { t: "Poor isolation — crossflow risk", c: "text-destructive" },
  "no-data": { t: "Not logged", c: "text-muted-foreground" },
};

/** CBL screening is session-only: the file is read in the browser and never stored. */
export default function CementBondCard({ intervals }: Props) {
  const [log, setLog] = useState<CblLog | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [freeMv, setFreeMv] = useState(60);
  const [bondMv, setBondMv] = useState(1);
  const [name, setName] = useState("");

  const run = (text: string, f: number, b: number) => {
    try { setLog(parseCblFromLas(text, f, b)); setErr(null); } catch (e) { setLog(null); setErr((e as Error).message); }
  };
  const onFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text(); setRaw(text); setName(file.name); run(text, freeMv, bondMv);
  };
  const rows = useMemo(() => (log ? intervals.map((i) => assessInterval(log, i.top, i.bottom)) : []), [log, intervals]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
          Cement bond (CBL) across SPT intervals
          <Badge variant="outline" className="text-[10px]">PRELIMINARY</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Upload a LAS file with a CBL amplitude curve ({CBL_MNEMONICS.slice(0, 4).join(", ")}…). The file is read in your browser only and is not saved.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">CBL LAS file</Label><Input type="file" accept=".las,.LAS,.txt" onChange={(e) => onFile(e.target.files?.[0])} /></div>
          <div className="space-y-1"><Label className="text-xs">Free-pipe amplitude (mV)</Label><Input type="number" min={1} value={freeMv} onChange={(e) => { const v = Number(e.target.value); setFreeMv(v); if (raw && v > bondMv) run(raw, v, bondMv); }} /></div>
          <div className="space-y-1"><Label className="text-xs">Fully bonded amplitude (mV)</Label><Input type="number" min={0.1} step={0.1} value={bondMv} onChange={(e) => { const v = Number(e.target.value); setBondMv(v); if (raw && v > 0 && v < freeMv) run(raw, freeMv, v); }} /></div>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {!log && !err && (
          <p className="text-sm text-muted-foreground">Data gap: no cement bond log loaded. Zonal isolation across the SPT intervals is unverified — the verdict assumes isolation.</p>
        )}
        {log && (
          <>
            <p className="text-xs text-muted-foreground">{name}: curve {log.mnemonic}, {log.top.toFixed(0)}–{log.bottom.toFixed(0)} ft, {log.points.length} samples. VDL {log.hasVdl ? "present — review waveform to confirm" : "not in file"}.</p>
            {intervals.length === 0 ? <p className="text-sm text-muted-foreground">No pay intervals to evaluate.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40"><th className="py-2 pr-3">Interval (ft)</th><th className="py-2 pr-3">Avg bond index</th><th className="py-2 pr-3">Good bond</th><th className="py-2 pr-3">Seal above / below</th><th className="py-2">Isolation</th></tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.top} className="border-b border-border/20">
                    <td className="py-2 pr-3 font-medium">{r.top.toFixed(0)}–{r.bottom.toFixed(0)}</td>
                    <td className="py-2 pr-3">{r.avgBi != null ? r.avgBi.toFixed(2) : "—"}</td>
                    <td className="py-2 pr-3">{r.goodPct != null ? `${r.goodPct.toFixed(0)}%` : "—"}</td>
                    <td className="py-2 pr-3">{r.verdict === "no-data" ? "—" : `${r.sealAbove ? "yes" : "no"} / ${r.sealBelow ? "yes" : "no"}`}</td>
                    <td className={`py-2 ${verdictLabel[r.verdict].c}`}>{verdictLabel[r.verdict].t}</td>
                  </tr>))}
                </tbody>
              </table>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">Bond index = (log A<sub>free</sub> − log A) / (log A<sub>free</sub> − log A<sub>bonded</sub>). Good ≥ {BI_GOOD}, moderate ≥ {BI_MODERATE}. Isolation requires {ISOLATION_FT} ft of good bond above and below. Amplitudes depend on casing size — confirm with a log analyst.</p>
      </CardContent>
    </Card>
  );
}
