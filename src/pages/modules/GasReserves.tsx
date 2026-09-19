import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Trash2, Info, Bot } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceDot,
} from "recharts";
import { pOverZGas, type GasMBPoint } from "@/lib/material-balance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WaterDrivePanel from "@/components/gas/WaterDrivePanel";

interface Row { P: string; Gp: string; Z: string }

const DEMO: Row[] = [
  { P: "3200", Gp: "0.0", Z: "0.885" },
  { P: "2950", Gp: "0.85", Z: "0.870" },
  { P: "2680", Gp: "1.80", Z: "0.858" },
  { P: "2400", Gp: "2.75", Z: "0.850" },
  { P: "2100", Gp: "3.70", Z: "0.848" },
  { P: "1820", Gp: "4.55", Z: "0.852" },
];

const fmt = (v: number, d = 2) =>
  v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

export default function GasReserves() {
  const [rows, setRows] = useState<Row[]>(DEMO);
  const [abandonPz, setAbandonPz] = useState("500");

  const update = (i: number, k: keyof Row, v: string) =>
    setRows(r => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const addRow = () => setRows(r => [...r, { P: "", Gp: "", Z: "" }]);
  const delRow = (i: number) => setRows(r => r.filter((_, j) => j !== i));

  const result = useMemo(() => {
    const pts: GasMBPoint[] = rows
      .map(r => ({ P: parseFloat(r.P), Gp: parseFloat(r.Gp) * 1e9, Z: parseFloat(r.Z) }))
      .filter(p => isFinite(p.P) && isFinite(p.Gp) && isFinite(p.Z) && p.Z > 0);
    if (pts.length < 3) return null;
    return pOverZGas(pts);
  }, [rows]);

  const chartData = useMemo(() => {
    if (!result) return [];
    const maxGp = result.G * 1.05;
    const data: Array<{ gp: number; measured?: number; fit: number }> = [];
    // fit line from 0 to OGIP
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const gp = (maxGp / steps) * i;
      data.push({ gp: gp / 1e9, fit: result.slope * gp + result.Pi_over_Zi });
    }
    // overlay measured points
    for (const p of result.points) {
      data.push({ gp: p.x / 1e9, measured: p.y, fit: result.slope * p.x + result.Pi_over_Zi });
    }
    return data.sort((a, b) => a.gp - b.gp);
  }, [result]);

  const stats = useMemo(() => {
    if (!result) return null;
    const G = result.G; // scf
    const lastGp = Math.max(...result.points.map(p => p.x));
    const remaining = Math.max(0, G - lastGp);
    const rf = G > 0 ? lastGp / G : 0;
    const pAb = parseFloat(abandonPz);
    let recoverableToAb: number | null = null;
    if (isFinite(pAb) && pAb > 0 && pAb < result.Pi_over_Zi) {
      const gpAb = (result.Pi_over_Zi - pAb) / -result.slope; // Gp at P/Z = pAb
      recoverableToAb = Math.max(0, gpAb - lastGp);
    }
    return { G, lastGp, remaining, rf, recoverableToAb };
  }, [result, abandonPz]);

  const [verdict, setVerdict] = useState<null | {
    grade: string;
    drive: string;
    confidence: string;
    findings: string[];
    recommendation: string;
  }>(null);

  const runAgent = () => {
    if (!result || !stats) { setVerdict(null); return; }
    const findings: string[] = [];
    const rfPct = stats.rf * 100;
    const remBscf = stats.remaining / 1e9;

    findings.push(
      `OGIP extrapolated from the P/Z straight line: ${fmt(stats.G / 1e9)} Bscf (Pi/Zi = ${fmt(result.Pi_over_Zi, 1)} psia).`,
    );
    findings.push(
      `Produced to date ${fmt(stats.lastGp / 1e9)} Bscf — recovery factor ${fmt(rfPct, 1)} %, remaining ${fmt(remBscf)} Bscf.`,
    );

    const drive =
      result.r2 >= 0.97 ? "Volumetric depletion drive" :
      result.r2 >= 0.90 ? "Mostly volumetric, minor pressure support" :
      "Non-linear trend — likely water drive / aquifer influx";
    findings.push(
      `Straight-line quality R² = ${fmt(result.r2, 4)} → ${drive.toLowerCase()}.`,
    );
    if (result.r2 < 0.90) {
      findings.push("With aquifer support the volumetric OGIP from this plot is underestimated; confirm with a water-influx model.");
    }

    if (stats.recoverableToAb != null) {
      findings.push(
        `At the specified abandonment P/Z (${abandonPz} psia) a further ${fmt(stats.recoverableToAb / 1e9)} Bscf is technically recoverable.`,
      );
    }

    const grade =
      remBscf > 2 && rfPct < 55 ? "HIGH remaining potential" :
      remBscf > 0.5 ? "MODERATE remaining potential" :
      "LOW — near depletion";

    const recommendation =
      remBscf > 2 && rfPct < 55
        ? "Significant gas remains in place. Prioritise for compression / recompletion review and run SPT screening on the pay intervals."
        : remBscf > 0.5
        ? "Moderate remaining volume. Evaluate wellhead compression and deliquification before major intervention spend."
        : "Reservoir is close to depletion. Economic limit review and abandonment planning recommended.";

    const confidence =
      result.r2 >= 0.97 && result.points.length >= 5 ? "High" :
      result.r2 >= 0.90 ? "Medium" : "Low";

    setVerdict({ grade, drive, confidence, findings, recommendation });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Flame className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gas Reserves — P/Z Material Balance</h1>
          <p className="text-sm text-muted-foreground font-mono">
            P/Z = (Pi/Zi)·(1 − Gp/G) · Havlena–Odeh reduced to gas
          </p>
        </div>
        <Badge variant="outline" className="ml-auto font-mono">Stage 4 · Gas</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Measured history (P, Gp, Z)</CardTitle>
            <CardDescription>
              Reservoir pressure (psia), cumulative gas produced (Bscf), gas deviation factor Z at P &amp; T.
              Minimum 3 points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 text-xs font-mono text-muted-foreground">
              <span>P, psia</span><span>Gp, Bscf</span><span>Z</span><span />
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2">
                <Input value={r.P} onChange={e => update(i, "P", e.target.value)} placeholder="3200" className="font-mono" />
                <Input value={r.Gp} onChange={e => update(i, "Gp", e.target.value)} placeholder="0.85" className="font-mono" />
                <Input value={r.Z} onChange={e => update(i, "Z", e.target.value)} placeholder="0.87" className="font-mono" />
                <Button variant="ghost" size="icon" onClick={() => delRow(i)} disabled={rows.length <= 3}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add point
            </Button>

            <div className="border-t pt-3">
              <label className="text-xs font-mono text-muted-foreground">
                Abandonment P/Z, psia (optional forecast)
              </label>
              <Input value={abandonPz} onChange={e => setAbandonPz(e.target.value)} className="mt-1 font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Results + chart */}
        <div className="space-y-6 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>OGIP (G)</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono">
                  {stats ? fmt(stats.G / 1e9) : "—"} <span className="text-sm text-muted-foreground">Bscf</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Remaining gas</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono text-primary">
                  {stats ? fmt(stats.remaining / 1e9) : "—"} <span className="text-sm text-muted-foreground">Bscf</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Recovery factor</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono">
                  {stats ? fmt(stats.rf * 100, 1) : "—"} <span className="text-sm text-muted-foreground">%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Recoverable to abandonment</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold font-mono">
                  {stats?.recoverableToAb != null ? fmt(stats.recoverableToAb / 1e9) : "—"}
                  <span className="text-sm text-muted-foreground"> Bscf</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">P/Z vs cumulative gas produced</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {result ? (
                  <>
                    <Badge variant={result.r2 > 0.95 ? "default" : "destructive"} className="font-mono">
                      R² = {fmt(result.r2, 4)}
                    </Badge>
                    <span className="font-mono text-xs">
                      Pi/Zi = {fmt(result.Pi_over_Zi, 1)} psia · slope = {fmt(result.slope * 1e9, 3)} psia/Bscf
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" /> Enter at least 3 valid points with declining P/Z
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={380}>
                  <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="gp" type="number"
                      label={{ value: "Gp, Bscf", position: "insideBottom", offset: -4 }}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      label={{ value: "P/Z, psia", angle: -90, position: "insideLeft" }}
                      tick={{ fontSize: 11 }} domain={[0, "auto"]}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [fmt(v, 1) + " psia", name]}
                      labelFormatter={(v: number) => `Gp = ${fmt(v, 2)} Bscf`}
                    />
                    <Legend />
                    <Line type="linear" dataKey="fit" name="P/Z straight-line fit → OGIP"
                      stroke="hsl(var(--primary))" dot={false} strokeWidth={2} strokeDasharray="6 3" />
                    <Line type="linear" dataKey="measured" name="Measured P/Z"
                      stroke="hsl(var(--foreground))" dot={{ r: 4 }} strokeWidth={0} />
                    {stats && (
                      <ReferenceDot x={stats.G / 1e9} y={0} r={6}
                        fill="hsl(var(--primary))" stroke="none"
                        label={{ value: `OGIP ${fmt(stats.G / 1e9)} Bscf`, position: "top", fontSize: 11 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" /> Gas Reserves Agent
                  </CardTitle>
                  <CardDescription>
                    Runs the P/Z material-balance calculation and issues an engineering verdict.
                    Numbers come from the deterministic solver — the agent only interprets them.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={runAgent} disabled={!result}>Run agent</Button>
              </div>
            </CardHeader>
            {verdict && (
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="font-mono">{verdict.grade}</Badge>
                  <Badge variant="secondary" className="font-mono">{verdict.drive}</Badge>
                  <Badge variant="outline" className="font-mono">Confidence: {verdict.confidence}</Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                  {verdict.findings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <span className="font-mono text-xs uppercase tracking-widest text-primary">Recommendation</span>
                  <p className="mt-1">{verdict.recommendation}</p>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">How it works</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                For a volumetric gas reservoir the material balance reduces to a straight line:
                plotting P/Z against cumulative production Gp and extrapolating to P/Z = 0 gives the
                original gas in place (OGIP). Remaining reserves = OGIP − Gp, and the recovery factor
                RF = Gp / OGIP.
              </p>
              <p className="font-mono text-xs">
                Refs: Havlena &amp; Odeh (1963) SPE-559 · Craft &amp; Hawkins, Applied Petroleum Reservoir Engineering.
              </p>
              <p>
                A downward-curving trend instead of a straight line indicates water drive (aquifer influx);
                in that case the volumetric OGIP from this plot is underestimated.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
