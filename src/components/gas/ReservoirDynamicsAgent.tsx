import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, Bot, Info, Plus, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  fitWaterDrive,
  type AquiferModel, type WaterDrivePoint, type WaterDriveResult,
  type FetkovichParams, type CarterTracyParams,
} from "@/lib/water-drive";
import { forecastWaterDrive, type DynamicsForecastResult } from "@/lib/water-drive-forecast";
import { WD_DEMO, type WDRow } from "@/components/gas/WaterDrivePanel";

const fmt = (v: number, d = 2) =>
  v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

interface Verdict {
  grade: string; drive: string; confidence: string; findings: string[]; recommendation: string;
}

export default function ReservoirDynamicsAgent() {
  const [rows, setRows] = useState<WDRow[]>(WD_DEMO);
  const [model, setModel] = useState<AquiferModel>("fetkovich");
  const [tempF, setTempF] = useState("150");
  const [bw, setBw] = useState("1.02");
  const [pwf, setPwf] = useState("400");
  const [pab, setPab] = useState("300");
  const [qEcon, setQEcon] = useState("150");
  const [years, setYears] = useState("10");

  const [fit, setFit] = useState<WaterDriveResult | null>(null);
  const [fc, setFc] = useState<DynamicsForecastResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, k: keyof WDRow, v: string) =>
    setRows(r => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const addRow = () => setRows(r => [...r, { t: "", P: "", Gp: "", Z: "", Wp: "0" }]);
  const delRow = (i: number) => setRows(r => r.filter((_, j) => j !== i));

  const points = useMemo<WaterDrivePoint[]>(
    () =>
      rows
        .map(r => ({
          t: parseFloat(r.t), P: parseFloat(r.P), Z: parseFloat(r.Z),
          Gp: parseFloat(r.Gp) * 1e9, Wp: parseFloat(r.Wp || "0") * 1e3,
        }))
        .filter(p => [p.t, p.P, p.Z, p.Gp].every(isFinite) && p.Z > 0 && p.P > 0),
    [rows],
  );

  const T_R = useMemo(() => (parseFloat(tempF) || 150) + 459.67, [tempF]);
  const Bw = useMemo(() => parseFloat(bw) || 1.0, [bw]);

  const runAgent = () => {
    setError(null); setFc(null); setVerdict(null);
    if (points.length < 4) {
      setError("At least 4 history points (t, P, Gp, Z) are required.");
      return;
    }
    const fitted = fitWaterDrive(points, model, T_R, Bw);
    if (!fitted) {
      setFit(null);
      setError("The aquifer model cannot reproduce this pressure history — review the data.");
      return;
    }
    setFit(fitted);

    const res = forecastWaterDrive({
      history: points,
      model, params: fitted.params, G: fitted.G, T_R, Bw,
      Pwf: parseFloat(pwf) || 400,
      Pab: parseFloat(pab) || 300,
      qEconMscfd: parseFloat(qEcon) || 100,
      years: Math.min(40, Math.max(1, parseFloat(years) || 10)),
    });
    if (!res) {
      setError("Forecast could not be solved — check the last two history points (rate must be positive).");
      return;
    }
    setFc(res);
    setVerdict(buildVerdict(fitted, res));
  };

  const rateData = useMemo(
    () => fc?.series.slice(1).map(s => ({
      years: +s.years.toFixed(2),
      qgHist: s.forecast ? undefined : s.qg,
      qgFc: s.forecast ? s.qg : undefined,
      qwHist: s.forecast ? undefined : s.qw,
      qwFc: s.forecast ? s.qw : undefined,
    })) ?? [],
    [fc],
  );

  const cumData = useMemo(
    () => fc?.series.map(s => ({
      years: +s.years.toFixed(2),
      Gp: s.Gp / 1e9,
      Wp: s.Wp / 1e3,
      P: s.P,
    })) ?? [],
    [fc],
  );

  const splitYear = fc ? fc.series[fc.historyCount - 1].years : 0;
  const fet = fit?.model === "fetkovich" ? (fit.params as FetkovichParams) : null;
  const ct = fit?.model === "carter_tracy" ? (fit.params as CarterTracyParams) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> History &amp; forecast controls
          </CardTitle>
          <CardDescription>
            Time (days), pressure (psia), cumulative gas (Bscf), Z, cumulative water (Mbbl).
            The agent fits the aquifer, then forward-solves the balance.
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
            <Field label="Reservoir T, °F" value={tempF} onChange={setTempF} />
            <Field label="Bw, bbl/STB" value={bw} onChange={setBw} />
            <Field label="Flowing BHP Pwf, psia" value={pwf} onChange={setPwf} />
            <Field label="Abandonment P, psia" value={pab} onChange={setPab} />
            <Field label="Econ. limit, Mscf/d" value={qEcon} onChange={setQEcon} />
            <Field label="Horizon, years" value={years} onChange={setYears} />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Aquifer model</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Button variant={model === "fetkovich" ? "default" : "outline"} size="sm"
                onClick={() => { setModel("fetkovich"); setFc(null); setVerdict(null); }}>
                Fetkovich
              </Button>
              <Button variant={model === "carter_tracy" ? "default" : "outline"} size="sm"
                onClick={() => { setModel("carter_tracy"); setFc(null); setVerdict(null); }}>
                Carter–Tracy
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={runAgent}>
            <Bot className="mr-2 h-4 w-4" /> Run reservoir-dynamics agent
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {fit && (
            <p className="text-[11px] font-mono text-muted-foreground border-t pt-3">
              Aquifer fit: {fet
                ? `Wei = ${fet.Wei.toExponential(2)} bbl, J = ${fmt(fet.J, 3)} bbl/d/psi`
                : ct ? `B' = ${fmt(ct.B, 2)} bbl/psi, C = ${ct.C.toExponential(2)} 1/d` : ""}
              {" · "}OGIP {fmt(fit.G / 1e9)} Bscf · spread {fmt(fit.cv * 100, 1)} %
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Current gas rate" value={fc ? fmt(fc.qNow, 0) : "—"} unit="Mscf/d" />
          <Metric title="Remaining gas (forecast)" value={fc ? fmt(fc.remaining / 1e9) : "—"} unit="Bscf" primary />
          <Metric title="Forecast water" value={fc ? fmt(fc.waterForecast / 1e3, 1) : "—"} unit="Mbbl" />
          <Metric
            title="Years to limit"
            value={fc ? (fc.yearsToLimit != null ? fmt(fc.yearsToLimit, 1) : `>${years}`) : "—"}
            unit="yr"
            note={fc ? `stop: ${fc.stopReason}` : undefined}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production forecast — gas &amp; water rate</CardTitle>
            <CardDescription className="flex items-center gap-1">
              {fc ? (
                <span className="font-mono text-xs">
                  Solid = history, dashed = forecast · EUR {fmt(fc.EUR / 1e9)} Bscf · RF {fmt(fc.rf * 100, 1)} %
                </span>
              ) : (<><Info className="h-3 w-3" /> Run the agent to build the forecast</>)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <LineChart data={rateData} margin={{ top: 8, right: 24, bottom: 12, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="years" type="number" tick={{ fontSize: 11 }}
                    label={{ value: "years", position: "insideBottom", offset: -6 }} />
                  <YAxis yAxisId="g" tick={{ fontSize: 11 }}
                    label={{ value: "qg, Mscf/d", angle: -90, position: "insideLeft" }} />
                  <YAxis yAxisId="w" orientation="right" tick={{ fontSize: 11 }}
                    label={{ value: "qw, bbl/d", angle: 90, position: "insideRight" }} />
                  <Tooltip formatter={(v: number) => fmt(v, 1)} />
                  <Legend />
                  <ReferenceLine yAxisId="g" x={splitYear} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                  <Line yAxisId="g" type="monotone" dataKey="qgHist" name="Gas — history"
                    stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line yAxisId="g" type="monotone" dataKey="qgFc" name="Gas — forecast"
                    stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls />
                  <Line yAxisId="w" type="monotone" dataKey="qwHist" name="Water — history"
                    stroke="hsl(var(--foreground))" strokeWidth={1.5} dot={{ r: 3 }} connectNulls />
                  <Line yAxisId="w" type="monotone" dataKey="qwFc" name="Water — forecast"
                    stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cumulative production &amp; reservoir pressure</CardTitle>
            <CardDescription>Balance-consistent Gp, Wp and P over the forecast horizon.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <LineChart data={cumData} margin={{ top: 8, right: 24, bottom: 12, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="years" type="number" tick={{ fontSize: 11 }}
                    label={{ value: "years", position: "insideBottom", offset: -6 }} />
                  <YAxis yAxisId="c" tick={{ fontSize: 11 }}
                    label={{ value: "Gp, Bscf / Wp, Mbbl", angle: -90, position: "insideLeft" }} />
                  <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v, 2)} />
                  <Legend />
                  <Line yAxisId="c" type="monotone" dataKey="Gp" name="Gp, Bscf"
                    stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line yAxisId="c" type="monotone" dataKey="Wp" name="Wp, Mbbl"
                    stroke="hsl(var(--foreground))" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="p" type="monotone" dataKey="P" name="P, psia"
                    stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Reservoir Dynamics Agent
            </CardTitle>
            <CardDescription>
              Physics first: the aquifer fit and the forward balance are deterministic — the agent only
              interprets the solver output and flags the risks.
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
              The agent couples three deterministic models. The aquifer influx (Fetkovich or Carter–Tracy)
              is fitted to the measured pressure history; the gas balance F = G·Eg + We then fixes how much
              gas can be produced at any pressure; and the back-pressure deliverability qg = C·(P² − Pwf²),
              calibrated on the last measured rate, fixes how fast. Each time step solves both equations
              simultaneously for the reservoir pressure.
            </p>
            <p className="font-mono text-xs">
              Gp·Bg + Wp·Bw = G·(Bg − Bgi) + We(P,t) · qg = C·(P² − Pwf²) · WGR grows with the water-drive index
            </p>
            <p>
              Water production follows the measured water–gas ratio, amplified as the water-drive index rises
              — the proxy for an advancing front and coning. The run stops at abandonment pressure, at the
              economic rate limit, or at the end of the horizon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase text-muted-foreground">{label}</label>
      <Input value={value} onChange={e => onChange(e.target.value)} className="mt-1 font-mono text-xs" />
    </div>
  );
}

function Metric({ title, value, unit, primary, note }: {
  title: string; value: string; unit: string; primary?: boolean; note?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold font-mono ${primary ? "text-primary" : ""}`}>
          {value} <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        {note && <p className="mt-1 text-[11px] font-mono text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

function buildVerdict(fit: WaterDriveResult, fc: DynamicsForecastResult): Verdict {
  const findings: string[] = [];
  const wdiPct = fc.wdiEnd * 100;

  findings.push(
    `Aquifer-corrected OGIP ${fmt(fit.G / 1e9)} Bscf (${fit.model === "fetkovich" ? "Fetkovich" : "Carter–Tracy"}); per-point spread ${fmt(fit.cv * 100, 1)} %.`,
  );
  findings.push(
    `Forecast adds ${fmt(fc.remaining / 1e9)} Bscf on top of the produced volume — EUR ${fmt(fc.EUR / 1e9)} Bscf, recovery factor ${fmt(fc.rf * 100, 1)} %.`,
  );
  findings.push(
    `Gas rate declines from ${fmt(fc.qNow, 0)} Mscf/d to ${fmt(fc.series[fc.series.length - 1].qg, 0)} Mscf/d; run stops on ${fc.stopReason}${fc.yearsToLimit != null ? ` after ${fmt(fc.yearsToLimit, 1)} years` : ""}.`,
  );
  findings.push(
    `Cumulative water over the forecast ${fmt(fc.waterForecast / 1e3, 1)} Mbbl; water-drive index reaches ${fmt(wdiPct, 1)} % of voidage.`,
  );

  const drive =
    wdiPct >= 50 ? "Strong water drive" :
    wdiPct >= 20 ? "Moderate water drive" :
    wdiPct >= 5 ? "Weak aquifer support" : "Essentially volumetric";

  const rfPct = fc.rf * 100;
  const grade =
    fc.remaining / 1e9 > 2 && rfPct < 60 ? "HIGH remaining potential" :
    fc.remaining / 1e9 > 0.5 ? "MODERATE remaining potential" :
    "LOW — near depletion";

  if (wdiPct >= 40) {
    findings.push("Gas trapped behind the advancing water front will cap the recovery factor well below volumetric expectations.");
  }

  const recommendation =
    wdiPct >= 50
      ? "Manage the well against water, not pressure: install deliquification (plunger lift or velocity string) before the forecast water rate doubles, limit drawdown to slow coning, and re-run the forecast after every pressure survey."
      : wdiPct >= 20
      ? "Size compression for the rising water load, track the water–gas ratio against this forecast monthly, and re-fit the aquifer when the measured trend departs from the curve."
      : "Aquifer support is minor — the decline is depletion-driven; optimise for drawdown and compression timing, and keep the water check as periodic QC.";

  const confidence =
    fit.cv <= 0.05 && fc.series.length >= 8 ? "High" :
    fit.cv <= 0.15 ? "Medium" : "Low";

  return { grade, drive, confidence, findings, recommendation };
}
