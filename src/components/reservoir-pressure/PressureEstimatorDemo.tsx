/**
 * Guided demo of the Reservoir Pressure Estimator pipeline.
 * Uses the production libraries (pvt.ts, material-balance.ts) on a deterministic
 * synthetic dataset — no database access required.
 *
 * Steps: Inputs → Gradient Pi → PVT snapshots → Havlena-Odeh OOIP → P(Np) forecast → EKF calibration
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, ScatterChart, Scatter,
} from "recharts";
import { Play, RotateCcw, ChevronRight, CheckCircle2, Gauge, Beaker, Sigma, Activity, Radio } from "lucide-react";
import { pvtSnapshot } from "@/lib/pvt";
import { havlenaOdehOil, pressureFromMB, type OilMBPoint } from "@/lib/material-balance";

// ── Deterministic demo well ──────────────────────────────────────────────────
const DEMO = {
  name: "Brawner 10-15",
  formation: "Mississippian Chat",
  datumFt: 3450,
  gradient: 0.465,     // psi/ft brine
  tempF: 165,
  api: 36,
  gammaG: 0.78,
  ooipTrue: 1_850_000, // STB — used only to synthesize the history
  rfMax: 0.16,
  npCurrent: 212_000,  // STB produced to date
  rft: { depthFt: 3420, psi: 1485 }, // measured RFT point for calibration
};

const STEPS = [
  { key: "inputs", title: "Inputs", icon: Gauge, desc: "Well datum, fluid properties and production history" },
  { key: "gradient", title: "Initial pressure", icon: Activity, desc: "Pi = gradient × datum depth" },
  { key: "pvt", title: "PVT snapshots", icon: Beaker, desc: "Bo, Rs, Bg at each pressure step (Vasquez-Beggs)" },
  { key: "mb", title: "Material balance", icon: Sigma, desc: "Havlena-Odeh straight line F vs Eo → OOIP" },
  { key: "forecast", title: "P(Np) forecast", icon: Activity, desc: "Bisection on the calibrated MB line" },
  { key: "ekf", title: "EKF calibration", icon: Radio, desc: "RFT point updates the gradient prior" },
] as const;

function bg(P: number, tempF: number, Z = 0.88) {
  // rb/scf: Bg = 0.00504 · Z · T(°R) / P
  return (0.00504 * Z * (tempF + 460)) / Math.max(P, 1);
}

export default function PressureEstimatorDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (step >= STEPS.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 1600);
    return () => clearTimeout(t);
  }, [playing, step]);

  const model = useMemo(() => {
    const Pi = DEMO.datumFt * DEMO.gradient;

    // 1) Synthesize an observed depletion history (P, Np) — solution-gas drive
    const history = Array.from({ length: 10 }, (_, i) => {
      const Np = (DEMO.ooipTrue * DEMO.rfMax * (i / 9)) * 0.72; // up to ~72% of rfMax
      const depl = Np / (DEMO.ooipTrue * DEMO.rfMax);
      const P = Math.max(Pi * 0.15, Pi * (1 - 0.85 * depl));
      return { P, Np };
    });

    // 2) PVT snapshot at every pressure point
    const pvtRows = history.map(({ P, Np }) => {
      const s = pvtSnapshot({ P, tempF: DEMO.tempF, api: DEMO.api, gammaG: DEMO.gammaG, correlation: "vasquez_beggs" });
      return { P, Np, Bo: s.Bo, Rs: s.Rs, muO: s.muO, Pb: s.Pb, Bg: bg(P, DEMO.tempF) };
    });

    // 3) Havlena-Odeh straight line
    const mbPoints: OilMBPoint[] = pvtRows.map(r => ({
      P: r.P, Np: r.Np, Bo: r.Bo, Rs: r.Rs, Bg: r.Bg, Rp: r.Rs * 1.08,
    }));
    const mb = havlenaOdehOil(mbPoints);

    // 4) Forecast P at current & future cumulative production
    const pvtFn = (P: number) => {
      const s = pvtSnapshot({ P, tempF: DEMO.tempF, api: DEMO.api, gammaG: DEMO.gammaG, correlation: "vasquez_beggs" });
      return { Bo: s.Bo, Rs: s.Rs, Bg: bg(P, DEMO.tempF), Rp: s.Rs * 1.08 };
    };
    const curve = mb
      ? Array.from({ length: 14 }, (_, i) => {
          const Np = (i / 13) * DEMO.ooipTrue * DEMO.rfMax * 0.9;
          const P = i === 0 ? Pi : pressureFromMB(Np, mb.N, mb.Boi, mb.Rsi, pvtFn);
          return { Np: Math.round(Np), P: P ? Math.round(P) : null };
        })
      : [];
    const pNow = mb ? pressureFromMB(DEMO.npCurrent, mb.N, mb.Boi, mb.Rsi, pvtFn) : null;

    // 5) 1-D Bayes / EKF update of the gradient prior with the RFT point
    const zGrad = DEMO.rft.psi / DEMO.rft.depthFt;
    const mu = DEMO.gradient, sigma2 = 0.01, r2 = 1e-4;
    const muPost = (mu * r2 + zGrad * sigma2) / (sigma2 + r2);
    const sigma2Post = (sigma2 * r2) / (sigma2 + r2);
    const confBefore = 100 * (1 - Math.sqrt(sigma2) / mu);
    const confAfter = 100 * (1 - Math.sqrt(sigma2Post) / muPost);

    return { Pi, pvtRows, mb, curve, pNow, zGrad, muPost, sigma2Post, confBefore, confAfter };
  }, []);

  const { Pi, pvtRows, mb, curve, pNow, zGrad, muPost, confBefore, confAfter } = model;
  const visible = (i: number) => step >= i;

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">Demo</Badge>
            <Badge variant="outline" className="border-accent/40 text-accent">{DEMO.name} · {DEMO.formation}</Badge>
          </div>
          <CardTitle className="text-lg">How the estimator works — step by step</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Live run of the same physics used in production: PVT correlations → Havlena-Odeh material balance → EKF self-calibration.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setStep(s => (s >= STEPS.length - 1 ? s : s + 1)); setPlaying(false); }} variant="outline" disabled={step >= STEPS.length - 1}>
            <ChevronRight className="h-4 w-4 mr-1" /> Next step
          </Button>
          <Button size="sm" onClick={() => { setStep(0); setPlaying(true); }}>
            <Play className="h-4 w-4 mr-1" /> Run demo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); setStep(0); }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === i, done = step > i;
            return (
              <div
                key={s.key}
                className={`rounded-lg border p-2 transition-all ${
                  active ? "border-primary bg-primary/10" : done ? "border-accent/40 bg-accent/5" : "border-border bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-medium">
                  {done ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Icon className="h-4 w-4 text-primary" />}
                  <span>{i + 1}. {s.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Step 1 — inputs */}
        <div className="grid md:grid-cols-4 gap-3">
          {[
            ["Datum depth", `${DEMO.datumFt.toLocaleString()} ft`],
            ["Gradient prior", `${DEMO.gradient} psi/ft`],
            ["Reservoir T / API", `${DEMO.tempF} °F / ${DEMO.api}°`],
            ["Cumulative oil Np", `${DEMO.npCurrent.toLocaleString()} STB`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-[11px] text-muted-foreground">{k}</div>
              <div className="text-sm font-semibold mt-0.5">{v}</div>
            </div>
          ))}
        </div>

        {/* Step 2 — Pi */}
        {visible(1) && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs text-muted-foreground">Step 2 · Initial pressure from gradient</div>
            <div className="font-mono text-sm mt-1">
              Pi = {DEMO.gradient} psi/ft × {DEMO.datumFt.toLocaleString()} ft = <span className="text-primary font-bold">{Math.round(Pi).toLocaleString()} psia</span>
            </div>
          </div>
        )}

        {/* Step 3 — PVT */}
        {visible(2) && (
          <div className="rounded-lg border border-border p-4 overflow-x-auto">
            <div className="text-xs text-muted-foreground mb-2">
              Step 3 · PVT snapshots (Vasquez-Beggs / Beggs-Robinson), Pb ≈ {Math.round(pvtRows[0].Pb).toLocaleString()} psia
            </div>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-1">P, psia</th>
                  <th className="text-right">Np, STB</th>
                  <th className="text-right">Bo, bbl/STB</th>
                  <th className="text-right">Rs, scf/STB</th>
                  <th className="text-right">μo, cP</th>
                  <th className="text-right">Bg, rb/scf</th>
                </tr>
              </thead>
              <tbody>
                {pvtRows.filter((_, i) => i % 2 === 0).map(r => (
                  <tr key={r.P} className="border-b border-border/40">
                    <td className="py-1">{Math.round(r.P).toLocaleString()}</td>
                    <td className="text-right">{Math.round(r.Np).toLocaleString()}</td>
                    <td className="text-right">{r.Bo.toFixed(3)}</td>
                    <td className="text-right">{Math.round(r.Rs)}</td>
                    <td className="text-right">{r.muO.toFixed(2)}</td>
                    <td className="text-right">{r.Bg.toFixed(5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Step 4 — Havlena-Odeh */}
        {visible(3) && mb && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground mb-2">Step 4 · Havlena-Odeh straight line: F = N · Eo</div>
              <div style={{ width: "100%", height: 220, minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="Eo" name="Eo" tick={{ fontSize: 10 }}
                      label={{ value: "Eo, bbl/STB", position: "insideBottom", offset: -12, fontSize: 10 }} />
                    <YAxis type="number" dataKey="F" name="F" tick={{ fontSize: 10 }} width={70}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                    <Scatter data={mb.points} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
              <div className="text-xs text-muted-foreground">Regression result</div>
              <div className="text-2xl font-bold text-accent">{Math.round(mb.N).toLocaleString()} STB</div>
              <div className="text-xs text-muted-foreground">OOIP (N) — slope of the straight line</div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div><span className="text-muted-foreground">R²</span><div className="font-semibold">{mb.r2.toFixed(4)}</div></div>
                <div><span className="text-muted-foreground">Boi</span><div className="font-semibold">{mb.Boi.toFixed(3)}</div></div>
                <div><span className="text-muted-foreground">Rsi</span><div className="font-semibold">{Math.round(mb.Rsi)} scf/STB</div></div>
                <div><span className="text-muted-foreground">Points</span><div className="font-semibold">{mb.points.length}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — forecast */}
        {visible(4) && (
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Step 5 · Pressure vs cumulative production — bisection on F(P) − N·Eo(P) = 0
            </div>
            <div style={{ width: "100%", height: 260, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="Np" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    label={{ value: "Np, STB", position: "insideBottom", offset: -12, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={60} label={{ value: "P, psia", angle: -90, position: "insideLeft", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="P" name="MB pressure" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                  <ReferenceLine x={DEMO.npCurrent} stroke="hsl(var(--accent))" strokeDasharray="4 4"
                    label={{ value: "today", fontSize: 10, fill: "hsl(var(--accent))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {pNow && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs">P current @ Np = {DEMO.npCurrent.toLocaleString()} STB </span>
                  <span className="font-bold text-primary">{Math.round(pNow).toLocaleString()} psia</span></div>
                <div><span className="text-muted-foreground text-xs">Depletion </span>
                  <span className="font-bold">{(100 * (1 - pNow / Pi)).toFixed(1)} %</span></div>
                <div><span className="text-muted-foreground text-xs">Confidence </span>
                  <span className="font-bold">0.75 (material balance)</span></div>
              </div>
            )}
          </div>
        )}

        {/* Step 6 — EKF */}
        {visible(5) && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Step 6 · New RFT point ({DEMO.rft.psi.toLocaleString()} psi @ {DEMO.rft.depthFt.toLocaleString()} ft) → 1-D Bayes / EKF update
            </div>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-[11px] text-muted-foreground">Observed gradient z</div><div className="font-semibold">{zGrad.toFixed(4)} psi/ft</div></div>
              <div><div className="text-[11px] text-muted-foreground">Prior μ</div><div className="font-semibold">{DEMO.gradient.toFixed(4)} psi/ft</div></div>
              <div><div className="text-[11px] text-muted-foreground">Posterior μ</div><div className="font-semibold text-primary">{muPost.toFixed(4)} psi/ft</div></div>
              <div><div className="text-[11px] text-muted-foreground">Confidence</div><div className="font-semibold text-accent">{confBefore.toFixed(1)} % → {confAfter.toFixed(1)} %</div></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              The posterior is written to <span className="font-mono">model_parameters</span> and logged in{" "}
              <span className="font-mono">calibration_audit</span>; the whole chain (PVT → MB → forecast) is recomputed and the
              result feeds the SPT Advisor ranking — with no manual edits to any formula.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
