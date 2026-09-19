import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Droplets, Info, Plus, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  fitWaterDrive, evaluateWaterDrive,
  type AquiferModel, type WaterDrivePoint, type WaterDriveResult,
  type FetkovichParams, type CarterTracyParams,
} from "@/lib/water-drive";

export interface WDRow { t: string; P: string; Gp: string; Z: string; Wp: string }

export const WD_DEMO: WDRow[] = [
  { t: "0",    P: "3200", Gp: "0.00", Z: "0.885", Wp: "0" },
  { t: "365",  P: "2900", Gp: "0.90", Z: "0.874", Wp: "0" },
  { t: "730",  P: "2688", Gp: "1.80", Z: "0.868", Wp: "2" },
  { t: "1095", P: "2450", Gp: "2.70", Z: "0.862", Wp: "6" },
  { t: "1460", P: "2196", Gp: "3.60", Z: "0.857", Wp: "14" },
  { t: "1825", P: "1918", Gp: "4.50", Z: "0.853", Wp: "28" },
  { t: "2190", P: "1603", Gp: "5.40", Z: "0.852", Wp: "50" },
];

const fmt = (v: number, d = 2) =>
  v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const sci = (v: number) => (Math.abs(v) >= 1e5 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(2) : fmt(v, 3));

export default function WaterDrivePanel({ volumetricOGIP }: { volumetricOGIP?: number | null }) {
  const [rows, setRows] = useState<WDRow[]>(WD_DEMO);
  const [model, setModel] = useState<AquiferModel>("fetkovich");
  const [tempF, setTempF] = useState("150");
  const [bw, setBw] = useState("1.02");
  const [result, setResult] = useState<WaterDriveResult | null>(null);
  const [verdict, setVerdict] = useState<null | {
    grade: string; drive: string; confidence: string; findings: string[]; recommendation: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, k: keyof WDRow, v: string) =>
    setRows(r => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const addRow = () => setRows(r => [...r, { t: "", P: "", Gp: "", Z: "", Wp: "0" }]);
  const delRow = (i: number) => setRows(r => r.filter((_, j) => j !== i));

  const points = useMemo<WaterDrivePoint[]>(
    () =>
      rows
        .map(r => ({
          t: parseFloat(r.t),
          P: parseFloat(r.P),
          Z: parseFloat(r.Z),
          Gp: parseFloat(r.Gp) * 1e9,
          Wp: parseFloat(r.Wp || "0") * 1e3,
        }))
        .filter(p => [p.t, p.P, p.Z, p.Gp].every(isFinite) && p.Z > 0 && p.P > 0),
    [rows],
  );

  const T_R = useMemo(() => (parseFloat(tempF) || 150) + 459.67, [tempF]);
  const Bw = useMemo(() => parseFloat(bw) || 1.0, [bw]);

  const runFit = () => {
    setError(null);
    if (points.length < 4) {
      setResult(null); setVerdict(null);
      setError("At least 4 points with time, pressure, Z and cumulative gas are required.");
      return;
    }
    const fitted = fitWaterDrive(points, model, T_R, Bw);
    if (!fitted) {
      setResult(null); setVerdict(null);
      setError("No aquifer parameter set reproduces this history — check the pressure/time data.");
      return;
    }
    setResult(fitted);
    setVerdict(buildVerdict(fitted, volumetricOGIP));
  };

  const recompute = (params: FetkovichParams | CarterTracyParams) => {
    const res = evaluateWaterDrive(points, model, params, T_R, Bw);
    if (res) { setResult(res); setVerdict(buildVerdict(res, volumetricOGIP)); }
  };

  const chartData = useMemo(
    () => result?.series.map(s => ({ x: s.WeoverEg / 1e9, y: s.FoverEg / 1e9 })) ?? [],
    [result],
  );
  const influxData = useMemo(
    () => result?.series.map(s => ({ t: s.t, We: s.We / 1e6, P: s.P })) ?? [],
    [result],
  );

  const fet = result?.model === "fetkovich" ? (result.params as FetkovichParams) : null;
  const ct = result?.model === "carter_tracy" ? (result.params as CarterTracyParams) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" /> Pressure &amp; production history
          </CardTitle>
          <CardDescription>
            Time (days), reservoir pressure (psia), cumulative gas (Bscf), Z, cumulative water (Mbbl).
            Minimum 4 points — the first row is treated as initial conditions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_2rem] gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span>t, d</span><span>P, psia</span><span>Gp, Bscf</span><span>Z</span><span>Wp, Mbbl</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_2rem] gap-1.5">
              <Input value={r.t} onChange={e => update(i, "t", e.target.value)} className="font-mono px-2 text-xs" />
              <Input value={r.P} onChange={e => update(i, "P", e.target.value)} className="font-mono px-2 text-xs" />
              <Input value={r.Gp} onChange={e => update(i, "Gp", e.target.value)} className="font-mono px-2 text-xs" />
              <Input value={r.Z} onChange={e => update(i, "Z", e.target.value)} className="font-mono px-2 text-xs" />
              <Input value={r.Wp} onChange={e => update(i, "Wp", e.target.value)} className="font-mono px-2 text-xs" />
              <Button variant="ghost" size="icon" onClick={() => delRow(i)} disabled={rows.length <= 4}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add point
          </Button>

          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Reservoir T, °F</label>
              <Input value={tempF} onChange={e => setTempF(e.target.value)} className="mt-1 font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-muted-foreground">Bw, bbl/STB</label>
              <Input value={bw} onChange={e => setBw(e.target.value)} className="mt-1 font-mono" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Aquifer model</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Button
                variant={model === "fetkovich" ? "default" : "outline"} size="sm"
                onClick={() => { setModel("fetkovich"); setResult(null); setVerdict(null); }}
              >
                Fetkovich
              </Button>
              <Button
                variant={model === "carter_tracy" ? "default" : "outline"} size="sm"
                onClick={() => { setModel("carter_tracy"); setResult(null); setVerdict(null); }}
              >
                Carter–Tracy
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={runFit}>Fit aquifer &amp; solve OGIP</Button>
          {error && <p className="text-xs text-destructive">{error}</p>}

          {result && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Aquifer parameters (editable)</p>
              {fet && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground">Wei, bbl</label>
                    <Input
                      className="mt-1 font-mono text-xs" defaultValue={fet.Wei.toFixed(0)}
                      onBlur={e => recompute({ Wei: parseFloat(e.target.value) || fet.Wei, J: fet.J })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground">J, bbl/d/psi</label>
                    <Input
                      className="mt-1 font-mono text-xs" defaultValue={fet.J.toFixed(3)}
                      onBlur={e => recompute({ Wei: fet.Wei, J: parseFloat(e.target.value) || fet.J })}
                    />
                  </div>
                </div>
              )}
              {ct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground">B', bbl/psi</label>
                    <Input
                      className="mt-1 font-mono text-xs" defaultValue={ct.B.toFixed(2)}
                      onBlur={e => recompute({ B: parseFloat(e.target.value) || ct.B, C: ct.C })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground">tD = C·t, 1/day</label>
                    <Input
                      className="mt-1 font-mono text-xs" defaultValue={ct.C.toExponential(2)}
                      onBlur={e => recompute({ B: ct.B, C: parseFloat(e.target.value) || ct.C })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>OGIP with influx</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold font-mono text-primary">
                {result ? fmt(result.G / 1e9) : "—"} <span className="text-sm text-muted-foreground">Bscf</span>
              </div>
              {result && volumetricOGIP ? (
                <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                  vs volumetric {fmt(volumetricOGIP / 1e9)} Bscf
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Cumulative influx We</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold font-mono">
                {result ? fmt(result.We_last / 1e6, 2) : "—"} <span className="text-sm text-muted-foreground">MMbbl</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Water-drive index</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold font-mono">
                {result ? fmt(result.wdi * 100, 1) : "—"} <span className="text-sm text-muted-foreground">%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Diagnostic slope</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold font-mono">
                {result ? fmt(result.slope, 3) : "—"}
              </div>
              <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                target 1.000 {result ? `· R² ${fmt(result.r2, 4)} · spread ${fmt(result.cv * 100, 1)} %` : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Havlena–Odeh diagnostic: F/Eg vs We/Eg</CardTitle>
            <CardDescription className="flex items-center gap-1">
              {result ? (
                <span className="font-mono text-xs">
                  Intercept = OGIP · unit slope confirms the aquifer model ·{" "}
                  {fet ? `Wei = ${sci(fet.Wei)} bbl, J = ${sci(fet.J)} bbl/d/psi`
                       : ct ? `B' = ${sci(ct.B)} bbl/psi, C = ${sci(ct.C)} 1/d` : ""}
                </span>
              ) : (
                <><Info className="h-3 w-3" /> Run the fit to build the diagnostic plot</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 12, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="x" type="number" tick={{ fontSize: 11 }}
                    label={{ value: "We/Eg, Bscf", position: "insideBottom", offset: -6 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]}
                    label={{ value: "F/Eg, Bscf", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(v: number) => fmt(v, 3) + " Bscf"} />
                  <Legend />
                  <Line type="linear" dataKey="y" name="F/Eg" stroke="hsl(var(--primary))"
                    dot={{ r: 4 }} strokeWidth={2} />
                  {result && (
                    <ReferenceLine y={result.G / 1e9} stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="6 3"
                      label={{ value: `OGIP ${fmt(result.G / 1e9)} Bscf`, position: "right", fontSize: 11 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Water influx vs time</CardTitle>
            <CardDescription>Cumulative aquifer influx We reconstructed from the pressure history.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <LineChart data={influxData} margin={{ top: 8, right: 24, bottom: 12, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" type="number" tick={{ fontSize: 11 }}
                    label={{ value: "t, days", position: "insideBottom", offset: -6 }} />
                  <YAxis yAxisId="we" tick={{ fontSize: 11 }}
                    label={{ value: "We, MMbbl", angle: -90, position: "insideLeft" }} />
                  <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="we" type="monotone" dataKey="We" name="We, MMbbl"
                    stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  <Line yAxisId="p" type="monotone" dataKey="P" name="P, psia"
                    stroke="hsl(var(--foreground))" dot={false} strokeWidth={1} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Water-Drive Agent
            </CardTitle>
            <CardDescription>
              The aquifer fit is deterministic — the agent only interprets the solver output.
            </CardDescription>
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
              With aquifer support the gas balance becomes F = G·Eg + We, where F = Gp·Bg + Wp·Bw,
              Eg = Bg − Bgi and We is the cumulative water influx. Plotting F/Eg against We/Eg gives a
              straight line whose intercept is the true OGIP and whose slope is 1 when the aquifer model
              is correct. The solver grid-searches the aquifer parameters that drive the slope to unity
              with the best linearity.
            </p>
            <p className="font-mono text-xs">
              Fetkovich (1971): ΔWe = (Wei/pi)(p̄a − p̄R)·[1 − exp(−J·pi·Δt/Wei)] ·
              Carter–Tracy (1960): van Everdingen–Hurst pD, Edwardson approximation.
            </p>
            <p>
              Because part of the reservoir voidage is replaced by water, the volumetric P/Z
              extrapolation under-estimates OGIP — the water-drive OGIP shown here is the corrected value.
              Recovery factors under strong water drive are typically 45–65 % versus 75–90 % for
              volumetric depletion, due to gas trapped behind the advancing water front.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildVerdict(r: WaterDriveResult, volumetric?: number | null) {
  const findings: string[] = [];
  const wdiPct = r.wdi * 100;
  findings.push(
    `Aquifer-corrected OGIP = ${fmt(r.G / 1e9)} Bscf (${r.model === "fetkovich" ? "Fetkovich" : "Carter–Tracy"} model, diagnostic slope ${fmt(r.slope, 3)}, R² ${fmt(r.r2, 4)}).`,
  );
  if (volumetric && volumetric > 0) {
    const diff = ((r.G - volumetric) / volumetric) * 100;
    findings.push(
      `The volumetric P/Z line gives ${fmt(volumetric / 1e9)} Bscf — ${diff >= 0 ? "under" : "over"}estimated by ${fmt(Math.abs(diff), 1)} % relative to the water-drive solution.`,
    );
  }
  findings.push(
    `Cumulative water influx ${fmt(r.We_last / 1e6, 2)} MMbbl replaces ${fmt(wdiPct, 1)} % of the reservoir voidage.`,
  );

  const drive =
    wdiPct >= 50 ? "Strong water drive" :
    wdiPct >= 20 ? "Moderate water drive" :
    wdiPct >= 5 ? "Weak aquifer support" :
    "Essentially volumetric";
  findings.push(`Water-drive index ${fmt(wdiPct, 1)} % → ${drive.toLowerCase()}.`);

  if (Math.abs(r.slope - 1) > 0.15) {
    findings.push("Slope deviates from unity — the assumed aquifer geometry may be wrong; try the other model or review the pressure data.");
  }

  const grade =
    wdiPct >= 50 ? "HIGH water-encroachment risk" :
    wdiPct >= 20 ? "MODERATE water-encroachment risk" :
    "LOW water-encroachment risk";

  const recommendation =
    wdiPct >= 50
      ? "Strong influx: expect early water breakthrough and gas trapping. Plan deliquification (plunger lift / velocity string), consider perforating high in the structure and avoid aggressive drawdown that accelerates coning."
      : wdiPct >= 20
      ? "Moderate influx: monitor water-gas ratio trend, size compression for rising water load and re-run the balance after each new pressure survey."
      : "Aquifer support is minor — the volumetric P/Z forecast remains valid; keep the water-drive check as a periodic QC.";

  const confidence =
    Math.abs(r.slope - 1) <= 0.05 && r.r2 >= 0.97 ? "High" :
    Math.abs(r.slope - 1) <= 0.15 && r.r2 >= 0.90 ? "Medium" : "Low";

  return { grade, drive, confidence, findings, recommendation };
}
