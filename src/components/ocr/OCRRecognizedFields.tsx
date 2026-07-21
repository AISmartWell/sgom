import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Layers, MapPin, ScanLine, CheckCircle2 } from "lucide-react";

type OcrResult = {
  well_name?: string | null;
  api_number?: string | null;
  operator?: string | null;
  service_company?: string | null;
  field?: string | null;
  county?: string | null;
  state?: string | null;
  log_date?: string | null;
  depth_range_ft?: { top?: number | null; bottom?: number | null };
  logged_curves?: string[];
  formation_tops?: { name: string; depth_ft: number }[];
  perforations?: { top_ft: number; bottom_ft: number; date?: string | null }[];
  confidence?: number;
};

type Impact = "high" | "medium" | "low";
type Row = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  impact: Impact;
  note: string;
};

function fmtDepth(d?: { top?: number | null; bottom?: number | null }) {
  if (!d) return "—";
  return `${d.top ?? "?"} – ${d.bottom ?? "?"} ft`;
}

function present(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function Bar({ v }: { v: number }) {
  return (
    <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.round(v * 100)}%`,
          background: v > 0.9 ? "#22c55e" : v > 0.7 ? "#1A9FFF" : v > 0.4 ? "#f59e0b" : "#ef4444",
        }}
      />
    </div>
  );
}

export function OCRRecognizedFields({ result }: { result: OcrResult }) {
  const rows = useMemo<Row[]>(() => {
    const base = result.confidence ?? 0.85;
    const c = (present_: boolean, boost = 0) =>
      Math.max(0.2, Math.min(0.99, present_ ? base + boost : base - 0.35));

    const list: Row[] = [
      {
        key: "operator",
        label: "Operator",
        value: result.operator || "—",
        confidence: c(present(result.operator), 0.05),
        impact: "low",
        note: "Operator name — used for tenant scoping, not for formation.",
      },
      {
        key: "well",
        label: "Well name",
        value: result.well_name || "—",
        confidence: c(present(result.well_name), 0.07),
        impact: "low",
        note: "Well identifier only.",
      },
      {
        key: "api",
        label: "API number",
        value: result.api_number || "—",
        confidence: c(present(result.api_number), 0.03),
        impact: "high",
        note: "State-county prefix drives formation_codes registry lookup.",
      },
      {
        key: "county",
        label: "County / State",
        value: [result.county, result.state].filter(Boolean).join(", ") || "—",
        confidence: c(present(result.county) || present(result.state), 0.02),
        impact: "high",
        note: "Direct key for regional formation registry.",
      },
      {
        key: "run_date",
        label: "Log date",
        value: result.log_date || "—",
        confidence: c(present(result.log_date), -0.05),
        impact: "low",
        note: "Vintage flag — triggers legacy calibration presets when pre-1980.",
      },
      {
        key: "depth_range",
        label: "Depth range (ft)",
        value: fmtDepth(result.depth_range_ft),
        confidence: c(
          present(result.depth_range_ft?.top) && present(result.depth_range_ft?.bottom),
          0.05,
        ),
        impact: "medium",
        note: "Constrains which formations from the county stack are plausible.",
      },
      {
        key: "curves",
        label: "Curves",
        value: (result.logged_curves || []).join(", ") || "—",
        confidence: c(present(result.logged_curves), 0),
        impact: "medium",
        note: "Curve suite anchors Vsh / Sw workflow (GR-based vs SP-fallback).",
      },
      {
        key: "tops",
        label: "Formation tops",
        value:
          (result.formation_tops || [])
            .slice(0, 3)
            .map((t) => `${t.name} ${t.depth_ft}`)
            .join(" · ") || "—",
        confidence: c(present(result.formation_tops), -0.1),
        impact: "high",
        note: "Handwritten annotations parsed as formation_tops rows.",
      },
      {
        key: "perforations",
        label: "Perforations",
        value:
          (result.perforations || [])
            .slice(0, 3)
            .map((p) => `${p.top_ft}-${p.bottom_ft}`)
            .join(" · ") || "—",
        confidence: c(present(result.perforations), -0.1),
        impact: "medium",
        note: "Constrains pay-zone hypothesis in Stage 8.",
      },
    ];
    return list;
  }, [result]);

  const highCount = rows.filter((r) => r.impact === "high").length;
  const avg = rows.reduce((s, r) => s + r.confidence, 0) / rows.length;

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Recognised fields</span>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {rows.length} fields · avg {(avg * 100).toFixed(0)}% conf · {highCount} high-impact
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y divide-white/5">
          {rows.map((f) => (
            <div key={f.key} className="py-2.5 grid grid-cols-[140px_1fr_auto] gap-3 items-start">
              <div>
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Bar v={f.confidence} />
                  <span className="text-[10px] text-muted-foreground">
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-mono break-words">{f.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{f.note}</div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase tracking-wide ${
                  f.impact === "high"
                    ? "border-[#1A9FFF]/40 text-[#1A9FFF]"
                    : f.impact === "medium"
                      ? "border-amber-400/40 text-amber-300"
                      : "border-white/10 text-muted-foreground"
                }`}
              >
                {f.impact} impact
              </Badge>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        <div>
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#1A9FFF]" />
            How OCR fields drive formation detection
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#1A9FFF]" />
                <span className="font-medium">1. Regional key</span>
              </div>
              API{" "}
              <span className="font-mono">{result.api_number || "?"}</span> + County{" "}
              <span className="font-mono">
                {[result.county, result.state].filter(Boolean).join(", ") || "?"}
              </span>{" "}
              → <span className="text-[#1A9FFF]">formation_codes</span> registry returns candidate
              formations for that county.
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ScanLine className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-medium">2. Depth window</span>
              </div>
              {fmtDepth(result.depth_range_ft)} filters the county stack — only formations whose top
              depth falls inside are kept.
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="font-medium">3. Curve signature</span>
              </div>
              {(result.logged_curves || []).join(", ") || "no curves"} — SP/GR + resistivity are
              scored against expected Vsh/Rt for each candidate.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
