import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { rankFromLogs, SW_HIGH, K_LOW } from "@/lib/spt-log-ranking";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWellLogs } from "@/hooks/useWellLogs";
import { useWellWaterInputs } from "@/hooks/useWellWaterInputs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import { Flame, FileText, Database, AlertTriangle, Download, Loader2 } from "lucide-react";

const WELL_NAME = "SLB Slotted Liner Case (Alfa)";
const M2FT = 3.28084;
const ft = (m: number) => Math.round(m * M2FT).toLocaleString();

// Source document values (SLB PDF). Depths in metres, converted for display.
const DOC = {
  casing: 4503.83,
  liner: [4379, 4503] as [number, number],
  pay: [4350, 4495] as [number, number],
  poorCement: [4249.4, 4367.9] as [number, number],
  pltInflow: [4347, 4357] as [number, number],
  grossM: 145,
  netM: 63,
  phi: 0.07,
  sw: 0.37,
  pressureMpa: 71,
  pressureDatumM: 4400,
  channelShare: 82,
};

const intervals = [
  { name: "Poor cement", from: DOC.poorCement[0], to: DOC.poorCement[1], color: "hsl(var(--destructive))" },
  { name: "PLT main inflow", from: DOC.pltInflow[0], to: DOC.pltInflow[1], color: "hsl(var(--warning))" },
  { name: "Pay (Alfa)", from: DOC.pay[0], to: DOC.pay[1], color: "hsl(var(--success))" },
  { name: "Slotted liner", from: DOC.liner[0], to: DOC.liner[1], color: "hsl(var(--primary))" },
].map((i) => ({ ...i, offset: i.from - 4200, len: i.to - i.from }));

const SrcBadge = ({ kind }: { kind: "doc" | "db" | "calc" | "none" }) => {
  const map = {
    doc: { t: "SLB DOCUMENT", c: "border-primary/40 text-primary" },
    db: { t: "REAL DATA", c: "border-success/40 text-success" },
    calc: { t: "CALCULATED", c: "border-warning/40 text-warning" },
    none: { t: "NO DATA", c: "border-muted text-muted-foreground" },
  }[kind];
  return <Badge variant="outline" className={`text-[10px] ${map.c}`}>{map.t}</Badge>;
};

const Metric = ({ label, value, sub, kind }: { label: string; value: string; sub?: string; kind: "doc" | "db" | "calc" | "none" }) => (
  <div className="glass-card rounded-lg p-4 space-y-1">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <SrcBadge kind={kind} />
    </div>
    <div className="text-2xl font-bold font-mono">{value}</div>
    {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
  </div>
);

export default function SLBAlfaWell() {
  const [well, setWell] = useState<any>(null);
  const [pressures, setPressures] = useState<any[]>([]);
  const [prod, setProd] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("wells").select("*").eq("well_name", WELL_NAME).maybeSingle().then(({ data }) => setWell(data));
  }, []);
  useEffect(() => {
    if (!well?.id) return;
    supabase.from("well_pressures").select("*").eq("well_id", well.id).order("estimation_date").then(({ data }) => setPressures(data ?? []));
    supabase.from("production_history").select("*").eq("well_id", well.id).order("production_month").then(({ data }) => setProd(data ?? []));
  }, [well?.id]);

  const { data: logs } = useWellLogs(well?.id);
  const { data: water } = useWellWaterInputs(well?.id);

  // Calculations from document values
  const gradKpaM = (DOC.pressureMpa * 1000) / DOC.pressureDatumM; // kPa/m
  const gradPsiFt = gradKpaM * 0.0442075;
  const eqDensity = gradKpaM / 9.80665; // g/cc
  const ntg = DOC.netM / DOC.grossM;
  const hcPoreFt = DOC.netM * M2FT * DOC.phi * (1 - DOC.sw); // ft of HC pore column
  const linerOverlapPay = Math.max(0, Math.min(DOC.liner[1], DOC.pay[1]) - Math.max(DOC.liner[0], DOC.pay[0]));
  const payAboveLiner = DOC.liner[0] - DOC.pay[0];
  const pressurePsi = DOC.pressureMpa * 145.038;

  const inflow = [
    { name: "Channel behind casing (above liner)", value: DOC.channelShare },
    { name: "Through slotted liner", value: 100 - DOC.channelShare },
  ];

  const gradientLine = [0, 1000, 2000, 3000, 4000, 4500].map((d) => ({
    depth: d,
    hydrostatic: +(d * 9.80665 * 1.0 / 1000).toFixed(1),
    reservoir: +(d * gradKpaM / 1000).toFixed(1),
  }));

  const petro = [
    { name: "Gross", m: DOC.grossM },
    { name: "Net pay", m: DOC.netM },
    { name: "Liner ∩ pay", m: linerOverlapPay },
    { name: "Pay above liner", m: payAboveLiner },
  ];

  const screening = [
    { k: "Depth", v: `${ft(DOC.casing)} ft`, s: "Beyond field experience (>~10,000 ft)", r: "fail" },
    { k: "Reservoir pressure", v: `~${Math.round(pressurePsi).toLocaleString()} psi`, s: "Abnormally high, needs confirmation", r: "fail" },
    { k: "Porosity", v: logs ? "from LAS" : `${(DOC.phi * 100).toFixed(0)}%`, s: "Low but productive (tight gas sand)", r: "warn" },
    { k: "Water saturation", v: `${(DOC.sw * 100).toFixed(0)}%`, s: "Acceptable (< 50%)", r: "pass" },
    { k: "Completion damage", v: "Barite + channel", s: "Mechanical, SPT bypasses it", r: "pass" },
    { k: "Permeability", v: "not provided", s: "Needed for inflow forecast", r: "none" },
  ];
  const rc = (r: string) => r === "pass" ? "text-success" : r === "warn" ? "text-warning" : r === "fail" ? "text-destructive" : "text-muted-foreground";

  const rank = useMemo(() => (logs?.length ? rankFromLogs(logs as any, water) : null), [logs, water]);
  const ivChart = (rank?.intervals ?? []).map((i) => {
    const sw = i.archieSwCalc ?? i.avgSw;
    const risk = sw >= SW_HIGH || (i.timurPermMd != null && i.timurPermMd < K_LOW);
    return { name: `${Math.round(i.top)}–${Math.round(i.bottom)}`, sw: +sw.toFixed(1), k: i.timurPermMd != null ? +i.timurPermMd.toFixed(3) : null, risk };
  });
  const pageRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const downloadPdf = async () => {
    if (!pageRef.current) return;
    setPdfBusy(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(pageRef.current, { scale: 1.5, backgroundColor: getComputedStyle(document.body).backgroundColor, ignoreElements: (el) => el.hasAttribute("data-pdf-skip") });
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * w) / canvas.width;
      const img = canvas.toDataURL("image/jpeg", 0.9);
      for (let y = 0; y < imgH; y += h) { if (y) pdf.addPage(); pdf.addImage(img, "JPEG", 0, -y, w, imgH); }
      pdf.save("SGOM_SLB_Alfa_SPT_Review.pdf");
    } finally { setPdfBusy(false); }
  };

  const logChart = (logs ?? []).map((p) => ({ md: p.measured_depth, gr: p.gamma_ray, rt: p.resistivity, phi: p.porosity != null ? p.porosity * (p.porosity < 1 ? 100 : 1) : null, sw: p.water_saturation }));

  return (
    <div ref={pageRef} className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30">Well Dashboard</Badge>
            <Badge variant="outline">GAS</Badge>
            <Badge variant="outline">Formation Alfa</Badge>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Flame className="h-7 w-7 text-primary" />{WELL_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Slotted liner under-performing · 7" casing to {ft(DOC.casing)} ft · all data available as of today
          </p>
        </div>
        <Button data-pdf-skip onClick={downloadPdf} disabled={pdfBusy}>{pdfBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Download PDF</Button>
        <div className="glass-card rounded-lg p-4 max-w-sm">
          <div className="text-xs text-muted-foreground mb-1">SGOM verdict</div>
          <div className="text-lg font-semibold text-warning">Conditional SPT candidate</div>
          <div className="text-xs text-muted-foreground">Confidence: medium-low until LAS, BHT, rates and gas composition arrive</div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border/40 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        Values tagged SLB DOCUMENT are transcribed from the client PDF; CALCULATED are derived from them; REAL DATA comes from records stored on the platform. Nothing here is a live simulation.
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
            AI agent verdict — factor breakdown
            <span className="flex gap-2"><Badge variant="outline" className="text-warning border-warning/40">Conditional SPT candidate</Badge><Badge variant="outline">Confidence: medium-low</Badge></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-success">Supporting factors</div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Gas well with slotted liner; {DOC.channelShare}% of inflow via behind-casing channel (poor cement) — bypassed pay signature</li>
              <li>{payAboveLiner} m of pay not covered by the liner</li>
              <li>High reservoir energy: ~{Math.round(pressurePsi).toLocaleString()} psi at {ft(DOC.casing)} ft</li>
              <li>Pay-interval porosity {(DOC.phi * 100).toFixed(0)}%, Sw {(DOC.sw * 100).toFixed(0)}%</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-destructive">Risks / limitations</div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Channel isolation required before SPT to avoid crossflow</li>
              <li>HPHT execution risk; bottom-hole temperature unconfirmed</li>
              <li>H₂S / CO₂ content unknown — affects materials and program</li>
              <li>No LAS curves: ranking based on document averages only</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-primary">To raise confidence</div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>LAS for the productive interval (Stage 6 re-ranks automatically)</li>
              <li>Cement bond log / cementing records</li>
              <li>Production rate history</li>
              <li>Gas composition analysis</li>
            </ul>
          </div>
          <p className="md:col-span-3 text-xs text-muted-foreground border-t border-border/40 pt-2">
            Summary of the agent interpretation of transcribed document values — not a live analysis run. Verdict may move to priority candidate or be withdrawn once LAS data is loaded.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Total depth" value={`${ft(DOC.casing)} ft`} sub={`${DOC.casing} m`} kind="doc" />
        <Metric label="Reservoir pressure" value={`${Math.round(pressurePsi).toLocaleString()} psi`} sub={`~${DOC.pressureMpa} MPa (to confirm)`} kind="doc" />
        <Metric label="Pressure gradient" value={`${gradPsiFt.toFixed(2)} psi/ft`} sub={`${gradKpaM.toFixed(1)} kPa/m · ≈${eqDensity.toFixed(2)} g/cm³`} kind="calc" />
        <Metric label="Gas via channel" value={`${DOC.channelShare}%`} sub="PLT: inflow above the liner" kind="doc" />
        <Metric label="Net / gross" value={`${(ntg * 100).toFixed(0)}%`} sub={`${DOC.netM} m of ${DOC.grossM} m`} kind="calc" />
        <Metric label="Porosity / Sw" value={`${(DOC.phi * 100).toFixed(0)}% / ${(DOC.sw * 100).toFixed(0)}%`} sub="Log average, pay interval" kind="doc" />
        <Metric label="HC pore column" value={`${hcPoreFt.toFixed(1)} ft`} sub="h·φ·(1−Sw)" kind="calc" />
        <Metric label="Pay not covered by liner" value={`${payAboveLiner} m`} sub={`${ft(payAboveLiner)} ft above liner top`} kind="calc" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex justify-between">Completion vs. pay intervals <SrcBadge kind="doc" /></CardTitle></CardHeader>
          <CardContent>
            <div style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={intervals} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" domain={[0, 320]} tickFormatter={(v) => `${4200 + v}`} stroke="hsl(var(--muted-foreground))" fontSize={11} label={{ value: "MD, m", position: "insideBottom", offset: -2, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip formatter={(_v: any, _n: any, p: any) => [`${p.payload.from}–${p.payload.to} m (${ft(p.payload.from)}–${ft(p.payload.to)} ft)`, "Interval"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="offset" stackId="a" fill="transparent" />
                  <Bar dataKey="len" stackId="a">{intervals.map((i) => <Cell key={i.name} fill={i.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">Main gas inflow sits above the liner top inside the poor-cement zone — gas bypasses the liner through the channel.</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex justify-between">Gas inflow split (PLT) <SrcBadge kind="doc" /></CardTitle></CardHeader>
          <CardContent>
            <div style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={inflow} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} label={(e) => `${e.value}%`}>
                    <Cell fill="hsl(var(--destructive))" />
                    <Cell fill="hsl(var(--primary))" />
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex justify-between">Pressure vs. depth <SrcBadge kind="calc" /></CardTitle></CardHeader>
          <CardContent>
            <div style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={gradientLine} margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="depth" stroke="hsl(var(--muted-foreground))" fontSize={11} unit=" m" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit=" MPa" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="hydrostatic" name="Fresh-water hydrostatic" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 4" dot={false} />
                  <Line dataKey="reservoir" name="Reservoir gradient (from ~71 MPa)" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                  <ReferenceLine x={4500} stroke="hsl(var(--primary))" label={{ value: "Pay", fontSize: 10, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">Overpressured: ~1.65× fresh-water gradient. Kill fluid and surface pressure limits drive SPT design.</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex justify-between">Pay thickness breakdown <SrcBadge kind="calc" /></CardTitle></CardHeader>
          <CardContent>
            <div style={{ minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={petro}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit=" m" />
                  <Tooltip formatter={(v: any) => [`${v} m (${ft(v)} ft)`, "Thickness"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="m" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">SPT applicability screening</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground text-left"><tr><th className="py-2">Criterion</th><th>Value</th><th>Assessment</th></tr></thead>
            <tbody>
              {screening.map((s) => (
                <tr key={s.k} className="border-t border-border/30">
                  <td className="py-2">{s.k}</td><td className="font-mono">{s.v}</td><td className={rc(s.r)}>{s.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex justify-between">Well log curves <SrcBadge kind={logChart.length ? "db" : "none"} /></CardTitle></CardHeader>
          <CardContent>
            {logChart.length ? (
              <div style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={logChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="md" stroke="hsl(var(--muted-foreground))" fontSize={11} unit=" ft" />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line dataKey="gr" name="GR, API" stroke="hsl(var(--success))" dot={false} />
                    <Line dataKey="phi" name="Porosity, %" stroke="hsl(var(--primary))" dot={false} />
                    <Line dataKey="sw" name="Sw" stroke="hsl(var(--warning))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-10 text-center">
                No LAS uploaded yet. Upload the 4,340–4,500 m interval in Data Import → it will appear here automatically.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" />Platform records</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Log points" v={logChart.length ? `${logChart.length}` : null} />
            <Row label="Pressure estimates" v={pressures.length ? `${pressures.length} (last ${Math.round(pressures[pressures.length - 1].p_current_psi ?? 0)} psi)` : null} />
            <Row label="Production months" v={prod.length ? `${prod.length}` : null} />
            <Row label="Formation TDS" v={water?.formation_tds_ppm ? `${water.formation_tds_ppm.toLocaleString()} ppm` : null} />
            <Row label="Reservoir temp" v={water?.reservoir_temp_f ? `${water.reservoir_temp_f} °F` : null} />
            <Row label="Injection share" v={water?.injection_share_pct != null ? `${water.injection_share_pct.toFixed(0)}%` : null} />
            <Row label="Well record" v={well ? "stored" : null} />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {[{ key: "sw", title: "Water saturation by interval (Archie), %", ref: SW_HIGH, scale: "linear" as const }, { key: "k", title: "Permeability by interval (Timur), mD", ref: K_LOW, scale: "log" as const }].map((c) => (
          <Card key={c.key} className="glass-card">
            <CardHeader><CardTitle className="text-base flex justify-between">{c.title} <SrcBadge kind={ivChart.length ? "calc" : "none"} /></CardTitle></CardHeader>
            <CardContent>
              {ivChart.length ? (
                <div style={{ minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ivChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} unit=" ft" />
                      <YAxis scale={c.scale} domain={c.scale === "log" ? [0.01, "auto"] : [0, 100]} allowDataOverflow stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <ReferenceLine y={c.ref} stroke="hsl(var(--destructive))" strokeDasharray="4 3" label={{ value: "risk cutoff", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                      <Bar dataKey={c.key}>{ivChart.map((i) => <Cell key={i.name} fill={i.risk ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="text-sm text-muted-foreground py-10 text-center">Appears after LAS curves are uploaded for this well.</div>}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Red bars = risk intervals (Sw ≥ {SW_HIGH}% or k &lt; {K_LOW} mD). Same solver as Stage 6 and Stage 8{rank?.waterfloodCorrected ? ", corrected for injection water using saved well inputs" : ""}.</p>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Data still required</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
          {["LAS curves 4,340–4,500 m (GR, RT, NPHI, RHOB)", "Confirmed reservoir pressure & bottom-hole temperature", "Gas / water production history", "Gas composition (H₂S, CO₂)", "Liner design: slot width, wall thickness, inner string", "Water & scale analyses"].map((t) => (
            <div key={t} className="flex gap-2"><span className="text-warning">•</span>{t}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const Row = ({ label, v }: { label: string; v: string | null }) => (
  <div className="flex justify-between border-b border-border/30 pb-2">
    <span className="text-muted-foreground">{label}</span>
    <span className={v ? "font-mono" : "text-muted-foreground/60"}>{v ?? "no data"}</span>
  </div>
);
