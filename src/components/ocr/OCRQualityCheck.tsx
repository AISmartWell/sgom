import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Wand2, Plus, Trash2, MoveVertical, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Reading = Record<string, number | null | undefined> & { depth_ft: number };

type Perf = { top_ft: number; bottom_ft: number; date?: string | null };
type Top = { name: string; depth_ft: number };

export type OcrEditableResult = {
  well_name?: string | null;
  api_number?: string | null;
  operator?: string | null;
  field?: string | null;
  county?: string | null;
  state?: string | null;
  log_date?: string | null;
  depth_range_ft?: { top?: number | null; bottom?: number | null };
  logged_curves?: string[];
  formation_tops?: Top[];
  perforations?: Perf[];
  log_readings?: Reading[];
  confidence?: number;
  notes?: string;
  [k: string]: any;
};

// Canonical curve keys used downstream (well_logs schema + preview)
const CANONICAL_CURVES: { key: string; label: string; unit: string }[] = [
  { key: "gr_api", label: "GR", unit: "API" },
  { key: "sp_mv", label: "SP", unit: "mV" },
  { key: "res_ohmm", label: "RES", unit: "Ω·m" },
  { key: "nphi_pu", label: "NPHI", unit: "p.u." },
  { key: "rhob_gcc", label: "RHOB", unit: "g/cc" },
  { key: "dt_us_ft", label: "DT", unit: "µs/ft" },
  { key: "cali_in", label: "CALI", unit: "in" },
];

interface Props {
  result: OcrEditableResult;
  previewSrc?: string | null;
  onChange: (next: OcrEditableResult) => void;
}

export const OCRQualityCheck = ({ result, previewSrc, onChange }: Props) => {
  const [depthShift, setDepthShift] = useState<number>(0);
  const [remapFrom, setRemapFrom] = useState<string>("");
  const [remapTo, setRemapTo] = useState<string>("");

  const readings = result.log_readings || [];
  const perfs = result.perforations || [];
  const tops = result.formation_tops || [];

  const detectedKeys = useMemo(() => {
    const keys = new Set<string>();
    readings.forEach((r) => {
      Object.entries(r).forEach(([k, v]) => {
        if (k === "depth_ft") return;
        if (typeof v === "number" && !Number.isNaN(v)) keys.add(k);
      });
    });
    return Array.from(keys);
  }, [readings]);

  const depthMinMax = useMemo(() => {
    if (!readings.length) return { min: 0, max: 0 };
    const ds = readings.map((r) => r.depth_ft).filter((d) => Number.isFinite(d));
    return { min: Math.min(...ds), max: Math.max(...ds) };
  }, [readings]);

  const patch = (p: Partial<OcrEditableResult>) => onChange({ ...result, ...p });

  const applyDepthShift = () => {
    if (!depthShift) return;
    const shifted = readings.map((r) => ({ ...r, depth_ft: r.depth_ft + depthShift }));
    const shiftedPerfs = perfs.map((p) => ({
      ...p,
      top_ft: p.top_ft + depthShift,
      bottom_ft: p.bottom_ft + depthShift,
    }));
    const shiftedTops = tops.map((t) => ({ ...t, depth_ft: t.depth_ft + depthShift }));
    patch({
      log_readings: shifted,
      perforations: shiftedPerfs,
      formation_tops: shiftedTops,
      depth_range_ft: {
        top: (result.depth_range_ft?.top ?? depthMinMax.min) + depthShift,
        bottom: (result.depth_range_ft?.bottom ?? depthMinMax.max) + depthShift,
      },
    });
    toast.success(`Depths shifted by ${depthShift > 0 ? "+" : ""}${depthShift} ft`);
    setDepthShift(0);
  };

  const renameCurve = () => {
    if (!remapFrom || !remapTo || remapFrom === remapTo) {
      toast.error("Pick source and target curve keys");
      return;
    }
    const next = readings.map((r) => {
      const { [remapFrom]: v, ...rest } = r as any;
      return { ...rest, [remapTo]: v ?? null };
    });
    const nextCurves = (result.logged_curves || []).map((c) =>
      c === remapFrom ? remapTo : c
    );
    patch({ log_readings: next, logged_curves: nextCurves });
    toast.success(`Renamed ${remapFrom} → ${remapTo}`);
    setRemapFrom("");
    setRemapTo("");
  };

  const dropCurve = (key: string) => {
    const next = readings.map((r) => {
      const { [key]: _drop, ...rest } = r as any;
      return rest;
    });
    patch({
      log_readings: next,
      logged_curves: (result.logged_curves || []).filter((c) => c !== key),
    });
  };

  const updatePerf = (i: number, field: keyof Perf, val: string) => {
    const num = field === "date" ? val : Number(val);
    const next = perfs.map((p, idx) => (idx === i ? { ...p, [field]: num } : p));
    patch({ perforations: next });
  };
  const addPerf = () =>
    patch({ perforations: [...perfs, { top_ft: depthMinMax.min, bottom_ft: depthMinMax.min + 10 }] });
  const removePerf = (i: number) => patch({ perforations: perfs.filter((_, idx) => idx !== i) });

  const updateTop = (i: number, field: keyof Top, val: string) => {
    const v = field === "depth_ft" ? Number(val) : val;
    const next = tops.map((t, idx) => (idx === i ? { ...t, [field]: v } : t));
    patch({ formation_tops: next });
  };
  const addTop = () =>
    patch({ formation_tops: [...tops, { name: "New top", depth_ft: depthMinMax.min }] });
  const removeTop = (i: number) => patch({ formation_tops: tops.filter((_, idx) => idx !== i) });

  const depthSpan = Math.max(1, depthMinMax.max - depthMinMax.min);
  const conf = typeof result.confidence === "number" ? result.confidence : null;

  return (
    <Card className="p-6 space-y-5 border-primary/40">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            QC · Review &amp; correct before saving
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Verify auto-detected depths, curve labels, perforations and formation tops.
            Changes apply immediately to the pipeline input.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {conf !== null && (
            <Badge
              variant="outline"
              className={
                conf >= 0.8
                  ? "border-emerald-500/50 text-emerald-400"
                  : conf >= 0.6
                  ? "border-amber-500/50 text-amber-400"
                  : "border-red-500/50 text-red-400"
              }
            >
              OCR confidence {(conf * 100).toFixed(0)}%
            </Badge>
          )}
          <Badge variant="secondary">{readings.length} samples</Badge>
          <Badge variant="secondary">{detectedKeys.length} curves</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Preview with depth bands */}
        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground">Source overlay</div>
          {previewSrc ? (
            <div className="relative rounded-lg overflow-hidden border border-border bg-black/40">
              <img src={previewSrc} alt="scan" className="w-full object-contain max-h-[420px]" />
              {/* Depth-band overlays (right edge ruler) */}
              <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-b from-transparent to-transparent">
                {perfs.map((p, i) => {
                  const top =
                    ((p.top_ft - depthMinMax.min) / depthSpan) * 100;
                  const height =
                    ((p.bottom_ft - p.top_ft) / depthSpan) * 100;
                  return (
                    <div
                      key={`p-${i}`}
                      title={`Perf ${p.top_ft}–${p.bottom_ft} ft`}
                      className="absolute right-0 w-3 bg-red-500/70 border-y border-red-300"
                      style={{ top: `${Math.max(0, Math.min(100, top))}%`, height: `${Math.max(0.5, height)}%` }}
                    />
                  );
                })}
                {tops.map((t, i) => {
                  const y = ((t.depth_ft - depthMinMax.min) / depthSpan) * 100;
                  return (
                    <div
                      key={`t-${i}`}
                      title={`${t.name} @ ${t.depth_ft} ft`}
                      className="absolute right-0 w-3 h-[2px] bg-cyan-400"
                      style={{ top: `${Math.max(0, Math.min(100, y))}%` }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs italic text-muted-foreground">No preview available</div>
          )}
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-2 bg-red-500/70" /> Perforation bands
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-[2px] bg-cyan-400" /> Formation tops
            </div>
            <div>
              Depth window:{" "}
              <span className="font-mono text-primary">
                {depthMinMax.min.toFixed(0)} – {depthMinMax.max.toFixed(0)} ft
              </span>
            </div>
          </div>
        </div>

        {/* Editors */}
        <div className="space-y-5">
          {/* Metadata */}
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldEdit label="Well name" value={result.well_name ?? ""} onChange={(v) => patch({ well_name: v })} />
            <FieldEdit label="API #" value={result.api_number ?? ""} onChange={(v) => patch({ api_number: v })} />
            <FieldEdit label="Operator" value={result.operator ?? ""} onChange={(v) => patch({ operator: v })} />
            <FieldEdit label="Field" value={result.field ?? ""} onChange={(v) => patch({ field: v })} />
            <FieldEdit label="County" value={result.county ?? ""} onChange={(v) => patch({ county: v })} />
            <FieldEdit label="State" value={result.state ?? ""} onChange={(v) => patch({ state: v })} />
          </div>

          {/* Depth shift */}
          <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
            <div className="text-xs uppercase text-muted-foreground flex items-center gap-2">
              <MoveVertical className="h-3 w-3" /> Depth calibration
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-[10px]">Shift all depths (ft)</Label>
                <Input
                  type="number"
                  step={1}
                  value={depthShift}
                  onChange={(e) => setDepthShift(Number(e.target.value))}
                  className="h-8 w-32"
                />
              </div>
              <Button size="sm" onClick={applyDepthShift} disabled={!depthShift}>
                <Wand2 className="h-3 w-3 mr-1" /> Apply shift
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDepthShift(0)}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Applies to readings, perforations and tops.
              </span>
            </div>
          </div>

          {/* Curve remap */}
          <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
            <div className="text-xs uppercase text-muted-foreground">Curve labels</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {detectedKeys.map((k) => {
                const canon = CANONICAL_CURVES.find((c) => c.key === k);
                return (
                  <Badge
                    key={k}
                    variant="outline"
                    className={canon ? "border-primary/50 text-primary" : "border-amber-500/50 text-amber-400"}
                  >
                    {canon ? `${canon.label} (${k})` : `⚠ ${k}`}
                    <button
                      className="ml-2 opacity-60 hover:opacity-100"
                      onClick={() => dropCurve(k)}
                      title="Drop curve"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              {detectedKeys.length === 0 && (
                <span className="text-xs italic text-muted-foreground">No curves detected</span>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-[10px]">Rename from</Label>
                <Select value={remapFrom} onValueChange={setRemapFrom}>
                  <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Detected key" /></SelectTrigger>
                  <SelectContent>
                    {detectedKeys.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Rename to</Label>
                <Select value={remapTo} onValueChange={setRemapTo}>
                  <SelectTrigger className="h-8 w-48"><SelectValue placeholder="Canonical curve" /></SelectTrigger>
                  <SelectContent>
                    {CANONICAL_CURVES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label} — {c.key} ({c.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={renameCurve} disabled={!remapFrom || !remapTo}>
                <Wand2 className="h-3 w-3 mr-1" /> Rename
              </Button>
            </div>
          </div>

          {/* Perforations */}
          <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase text-muted-foreground">Perforations ({perfs.length})</div>
              <Button size="sm" variant="outline" onClick={addPerf}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {perfs.length === 0 && (
              <div className="text-xs italic text-muted-foreground">No perforations detected</div>
            )}
            <div className="space-y-1">
              {perfs.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={p.top_ft}
                    onChange={(e) => updatePerf(i, "top_ft", e.target.value)}
                    className="h-8 w-24 font-mono"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    value={p.bottom_ft}
                    onChange={(e) => updatePerf(i, "bottom_ft", e.target.value)}
                    className="h-8 w-24 font-mono"
                  />
                  <Input
                    placeholder="date (optional)"
                    value={p.date ?? ""}
                    onChange={(e) => updatePerf(i, "date", e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removePerf(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tops */}
          <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase text-muted-foreground">Formation tops ({tops.length})</div>
              <Button size="sm" variant="outline" onClick={addTop}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {tops.length === 0 && (
              <div className="text-xs italic text-muted-foreground">No tops detected</div>
            )}
            <div className="space-y-1">
              {tops.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={t.name}
                    onChange={(e) => updateTop(i, "name", e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Input
                    type="number"
                    value={t.depth_ft}
                    onChange={(e) => updateTop(i, "depth_ft", e.target.value)}
                    className="h-8 w-28 font-mono"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeTop(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const FieldEdit = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8" />
  </div>
);

export default OCRQualityCheck;
