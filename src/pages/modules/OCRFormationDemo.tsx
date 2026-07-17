import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScanLine, Upload, ArrowRight, CheckCircle2, AlertTriangle, MapPin, Layers, TrendingUp, TrendingDown, Ruler, Activity } from "lucide-react";
import demoLogUrl from "@/assets/demo-paper-log.jpg";

type Field = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  formationImpact: "high" | "medium" | "low";
  note: string;
};

const OCR_FIELDS: Field[] = [
  { key: "company", label: "Company", value: "DEMO OIL", confidence: 0.97, formationImpact: "low", note: "Operator name — used for tenant scoping, not for formation." },
  { key: "well", label: "Well name", value: "DEMO-01", confidence: 0.98, formationImpact: "low", note: "Identifier only." },
  { key: "api", label: "API number", value: "15-007-20134", confidence: 0.95, formationImpact: "high", note: "State 15 = Kansas, county 007 = Barber. Drives Kansas KID lookup in formation_codes." },
  { key: "county", label: "County / State", value: "Barber, KS", confidence: 0.94, formationImpact: "high", note: "Direct key for regional formation registry." },
  { key: "run_date", label: "Run date", value: "1978-06-14", confidence: 0.91, formationImpact: "low", note: "Vintage log flag — triggers legacy calibration presets." },
  { key: "depth_range", label: "Depth range (ft)", value: "3200 – 3800", confidence: 0.99, formationImpact: "medium", note: "Constrains which formations from the county stack are plausible." },
  { key: "curves", label: "Curves", value: "SP, RILD, RLL3, CILD", confidence: 0.93, formationImpact: "medium", note: "SP + Res-only ⇒ Vsh from SP fallback (no GR track available)." },
  { key: "tops", label: "Formation tops", value: "TOP SHALE 3225 · BASE SHALE 3390 · TOP SAND 3505 · BASE SAND 3670", confidence: 0.88, formationImpact: "high", note: "Handwritten annotations parsed as formation_tops rows." },
  { key: "sp_baseline", label: "SP shale baseline", value: "≈ +15 mV", confidence: 0.82, formationImpact: "medium", note: "Anchors SP depression → Vsh transform used for reservoir screening." },
  { key: "res_range", label: "Resistivity scale", value: "0.2 – 20 ohm·m (log)", confidence: 0.9, formationImpact: "low", note: "Determines cutoff for pay flag (Rt > 5 ohm·m clean sand)." },
];

const CANDIDATES = [
  { name: "Cherokee Sandstone", basin: "Cherokee Basin, KS", match: 0.86, why: "Barber county at 3.2–3.8 kft matches Cherokee stack; SP depression 60–90 mV in clean sand track." },
  { name: "Mississippian Limestone", basin: "Anadarko Shelf, KS", match: 0.42, why: "Depth OK but no carbonate resistivity signature (RILD spikes >50 ohm·m absent)." },
  { name: "Woodford Shale", basin: "Anadarko, OK/KS", match: 0.11, why: "Would require hot GR + very low porosity; no GR curve on this log." },
];

function Bar({ v }: { v: number }) {
  return (
    <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.round(v * 100)}%`,
          background: v > 0.9 ? "#22c55e" : v > 0.75 ? "#1A9FFF" : "#f59e0b",
        }}
      />
    </div>
  );
}

export default function OCRFormationDemo() {
  const [revealed, setRevealed] = useState(false);
  const summary = useMemo(() => {
    const hi = OCR_FIELDS.filter((f) => f.formationImpact === "high").length;
    const avg =
      OCR_FIELDS.reduce((s, f) => s + f.confidence, 0) / OCR_FIELDS.length;
    return { hi, avg };
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-[#1A9FFF]/20 text-[#1A9FFF] border-[#1A9FFF]/30">Stage 2 · Demo</Badge>
            <Badge variant="outline" className="text-xs">Read-only walkthrough</Badge>
          </div>
          <h1 className="text-2xl font-semibold">OCR × Formation — Live Example</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            See exactly which fields the OCR pipeline reads from a paper wireline log and how each one steers
            formation detection. No upload required — the sample below is a real synthetic scan bundled with the app.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/ocr">
              <Upload className="w-4 h-4 mr-2" /> Try with your own scan
            </Link>
          </Button>
          <Button onClick={() => setRevealed(true)} disabled={revealed}>
            <ScanLine className="w-4 h-4 mr-2" />
            {revealed ? "OCR complete" : "Run OCR on demo"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
        <Card className="glass-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Demo scan · ADMYR WIRELINE</span>
              <Badge variant="outline" className="text-xs">1978 · Barber, KS</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
              <img
                src={demoLogUrl}
                alt="Demo paper well log ADMYR WIRELINE, DEMO-01, Barber KS, 3200-3800 ft"
                loading="lazy"
                width={912}
                height={1408}
                className="w-full h-auto"
              />
              {revealed && (
                <>
                  <div className="absolute left-[3%] right-[3%] top-[2%] h-[7%] border-2 border-[#1A9FFF] rounded-sm animate-pulse" />
                  <div className="absolute left-[3%] right-[52%] top-[15%] bottom-[8%] border border-[#22c55e]/70 rounded-sm" />
                  <div className="absolute left-[50%] right-[3%] top-[15%] bottom-[8%] border border-[#f59e0b]/70 rounded-sm" />
                </>
              )}
            </div>
            {revealed && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#1A9FFF]" /> Header block</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#22c55e]" /> SP track</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f59e0b]" /> Resistivity track</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Recognised fields</span>
                {revealed ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {OCR_FIELDS.length} fields · avg {(summary.avg * 100).toFixed(0)}% conf
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Awaiting OCR</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!revealed ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Press <span className="text-foreground">Run OCR on demo</span> to see how Gemini Vision parses each region of the scan.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {OCR_FIELDS.map((f) => (
                    <div key={f.key} className="py-2.5 grid grid-cols-[140px_1fr_auto] gap-3 items-start">
                      <div>
                        <div className="text-xs text-muted-foreground">{f.label}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Bar v={f.confidence} />
                          <span className="text-[10px] text-muted-foreground">{(f.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-mono">{f.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{f.note}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wide ${
                          f.formationImpact === "high"
                            ? "border-[#1A9FFF]/40 text-[#1A9FFF]"
                            : f.formationImpact === "medium"
                            ? "border-amber-400/40 text-amber-300"
                            : "border-white/10 text-muted-foreground"
                        }`}
                      >
                        {f.formationImpact} impact
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {revealed && (
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1A9FFF]" /> How OCR fields drive formation detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-md border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1A9FFF]" />
                      <span className="font-medium">1. Regional key</span>
                    </div>
                    API <span className="font-mono">15-007</span> + County <span className="font-mono">Barber, KS</span> → <span className="text-[#1A9FFF]">formation_codes</span> registry returns 3 candidate formations for that county.
                  </div>
                  <div className="rounded-md border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ScanLine className="w-3.5 h-3.5 text-amber-300" />
                      <span className="font-medium">2. Depth window</span>
                    </div>
                    3200–3800 ft filters the county stack — only formations whose top depth falls inside are kept.
                  </div>
                  <div className="rounded-md border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="font-medium">3. Curve signature</span>
                    </div>
                    SP depression pattern + resistivity magnitude are scored against expected Vsh/Rt for each candidate.
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Candidate formations after scoring</div>
                  <div className="space-y-2">
                    {CANDIDATES.map((c, i) => (
                      <div key={c.name} className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-md border border-white/10 p-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {i === 0 ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Selected</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Rejected</Badge>
                            )}
                            <span className="font-medium text-sm">{c.name}</span>
                            <span className="text-xs text-muted-foreground">· {c.basin}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{c.why}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">match</div>
                          <div className="font-mono text-sm">{(c.match * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-amber-400/30 bg-amber-400/5 p-3 flex gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    No GR curve on this vintage log ⇒ Vsh is derived from SP with lower confidence. Uploading a
                    modern LAS with GR/NPHI/RHOB in <Link className="text-[#1A9FFF] underline" to="/dashboard/geophysical">Geophysical Expertise</Link> raises formation confidence from ~86% to ~97%.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" asChild>
                    <Link to="/dashboard/ocr">
                      Run pipeline on real scan <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/dashboard/formation-codes">Open formation registry</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/dashboard/geophysical">Go to Stage 8</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
