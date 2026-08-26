import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Beaker, FlaskConical, Gauge, BookOpen, Download } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { pvtSnapshot } from "@/lib/pvt";
import { toast } from "sonner";

type Params = {
  api: number;
  gammaG: number;
  tempF: number;
  P: number;
  Rsb: number;
};

const PRESETS: { name: string; note: string; p: Params }[] = [
  {
    name: "Light oil — Permian Delaware",
    note: "38 °API, high GOR, undersaturated at datum",
    p: { api: 38, gammaG: 0.78, tempF: 165, P: 3200, Rsb: 620 },
  },
  {
    name: "Medium oil — Kansas Mississippian",
    note: "Typical mature shallow carbonate",
    p: { api: 32, gammaG: 0.72, tempF: 118, P: 1150, Rsb: 260 },
  },
  {
    name: "Heavy oil — Oklahoma shallow sand",
    note: "Low GOR, viscous, near bubble point",
    p: { api: 22, gammaG: 0.68, tempF: 96, P: 620, Rsb: 110 },
  },
];

const LAB_TESTS = [
  {
    test: "Constant Composition Expansion (CCE)",
    gives: "Pb, total volume vs pressure, oil compressibility co",
    use: "Defines the saturation pressure used as the physical floor for depletion forecasts",
  },
  {
    test: "Differential Liberation (DL)",
    gives: "Rs, Bo, Bg, ρo below Pb",
    use: "Feeds Havlena–Odeh material balance and OOIP estimation",
  },
  {
    test: "Separator Test",
    gives: "Bofb, Rsfb at field separator conditions",
    use: "Corrects lab DL data to actual surface facilities (gas gravity correction)",
  },
  {
    test: "Viscosity (rolling-ball / capillary)",
    gives: "μo vs pressure, μod dead oil",
    use: "Drives inflow performance and SPT restoration-rate modelling",
  },
  {
    test: "Compositional analysis (GC to C7+)",
    gives: "Mole fractions, MW and γ of C7+",
    use: "EOS tuning, gas-injection / miscibility screening",
  },
  {
    test: "Water analysis",
    gives: "Salinity (ppm NaCl), Rw, density",
    use: "Archie Sw calculation in the Petrophysical Solver Module",
  },
];

const REPORT_FIELDS = [
  ["Sample type", "Bottomhole / recombined surface", "Bottomhole is preferred above Pb"],
  ["Reservoir temperature", "°F", "Used in every correlation"],
  ["Saturation pressure Pb", "psia", "Free-gas threshold"],
  ["Solution GOR Rsb", "scf/STB", "Gas dissolved at Pb"],
  ["Oil FVF Bob", "bbl/STB", "Typically 1.05–1.60"],
  ["Oil compressibility co", "1/psi", "1e-6 – 3e-5 range"],
  ["Oil viscosity μo", "cp", "At Pb and at reservoir P"],
  ["Stock-tank gravity", "°API", "Sanity check vs field data"],
  ["Gas gravity γg", "air = 1", "0.60–0.90 typical"],
];

export default function PVTGuide() {
  const [p, setP] = useState<Params>(PRESETS[1].p);

  const snap = useMemo(
    () => pvtSnapshot({ P: p.P, tempF: p.tempF, api: p.api, gammaG: p.gammaG, Rsb: p.Rsb }),
    [p],
  );

  const curve = useMemo(() => {
    const pts: { P: number; Bo: number; Rs: number; muO: number }[] = [];
    const pMax = Math.max(p.P * 1.4, snap.Pb * 1.5, 500);
    for (let i = 1; i <= 40; i++) {
      const P = (pMax / 40) * i;
      const s = pvtSnapshot({ P, tempF: p.tempF, api: p.api, gammaG: p.gammaG, Rsb: p.Rsb });
      pts.push({
        P: Math.round(P),
        Bo: Number(s.Bo.toFixed(4)),
        Rs: Math.round(s.Rs),
        muO: Number(s.muO.toFixed(3)),
      });
    }
    return pts;
  }, [p, snap.Pb]);

  const set = (k: keyof Params) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (isFinite(v)) setP(prev => ({ ...prev, [k]: v }));
  };

  const exportCsv = () => {
    const head = "pressure_psia,Bo_bbl_per_STB,Rs_scf_per_STB,muO_cp\n";
    const body = curve.map(r => `${r.P},${r.Bo},${r.Rs},${r.muO}`).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pvt-table.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PVT table exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" />
              PVT Laboratory Guide
            </h1>
            <Badge variant="outline">Stage 4.5</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            What a PVT report contains, how each test is used in SGOM, and a live black-oil calculator
            (Standing / Vasquez-Beggs / Beggs-Robinson).
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> Export PVT table
        </Button>
      </div>

      {/* Lab tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Beaker className="h-4 w-4 text-primary" /> Standard laboratory tests
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Test</th>
                <th className="py-2 pr-4 font-medium">Measured outputs</th>
                <th className="py-2 font-medium">Where SGOM uses it</th>
              </tr>
            </thead>
            <tbody>
              {LAB_TESTS.map(t => (
                <tr key={t.test} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-4 font-medium">{t.test}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{t.gives}</td>
                  <td className="py-2 text-muted-foreground">{t.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Report anatomy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" /> Anatomy of a PVT report
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Field</th>
                <th className="py-2 pr-4 font-medium">Unit / value</th>
                <th className="py-2 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_FIELDS.map(([a, b, c]) => (
                <tr key={a} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{a}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{b}</td>
                  <td className="py-2 text-muted-foreground">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" /> Black-oil PVT calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(pr => (
              <Button
                key={pr.name}
                size="sm"
                variant="secondary"
                onClick={() => setP(pr.p)}
                title={pr.note}
              >
                {pr.name}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Oil gravity (°API)</Label>
              <Input type="number" value={p.api} onChange={set("api")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gas gravity (air = 1)</Label>
              <Input type="number" step="0.01" value={p.gammaG} onChange={set("gammaG")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reservoir temp (°F)</Label>
              <Input type="number" value={p.tempF} onChange={set("tempF")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reservoir pressure (psia)</Label>
              <Input type="number" value={p.P} onChange={set("P")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rsb (scf/STB)</Label>
              <Input type="number" value={p.Rsb} onChange={set("Rsb")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Pb", `${snap.Pb.toFixed(0)} psia`],
              ["Rs", `${snap.Rs.toFixed(0)} scf/STB`],
              ["Bo", `${snap.Bo.toFixed(3)} bbl/STB`],
              ["μo", `${snap.muO.toFixed(2)} cp`],
              ["ρo", `${snap.rhoO.toFixed(1)} lb/ft³`],
              ["Gradient", `${snap.gradient.toFixed(3)} psi/ft`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-lg font-semibold font-mono">{v}</div>
              </div>
            ))}
          </div>

          <div className="h-72 w-full" style={{ minHeight: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="P" tick={{ fontSize: 11 }} label={{ value: "Pressure, psia", position: "insideBottom", offset: -4, fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <ReferenceLine yAxisId="left" x={Math.round(snap.Pb)} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Pb", fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="Bo" name="Bo (bbl/STB)" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="Rs" name="Rs (scf/STB)" stroke="hsl(var(--chart-2, 142 70% 45%))" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="muO" name="μo (cp)" stroke="hsl(var(--destructive))" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground">
            Correlations: Standing (1947) for Pb, Vasquez-Beggs (1980, SPE 6719) for Rs / Bo / co,
            Beggs-Robinson (1975) for viscosity, McCain (1990) for density. Results are estimates —
            replace with measured laboratory values whenever a report is available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
