import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Layers,
  ScanText,
  Database,
  Activity,
  Upload,
  Microscope,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import docWellLog1982 from "@/assets/sample-doc-welllog-1982.jpg";
import docCompletion1978 from "@/assets/sample-doc-completion-1978.jpg";
import demoPaperLog from "@/assets/demo-paper-well-log.jpg";
import coreLimestone from "@/assets/sample-core-limestone.jpg";
import coreDolomite from "@/assets/sample-core-dolomite.jpg";
import coreShale from "@/assets/sample-core-shale.jpg";

type SampleKind = "log" | "core";

interface Sample {
  id: string;
  kind: SampleKind;
  title: string;
  subtitle: string;
  src: string;
}

const SAMPLES: Sample[] = [
  { id: "paper-log-1962", kind: "log", title: "Paper well log — 1962", subtitle: "BRAWNER 10-15 · GR / SP / RES strip chart", src: demoPaperLog },
  { id: "well-log-1982", kind: "log", title: "Well log report — 1982", subtitle: "Header sheet · tops & logged curves", src: docWellLog1982 },
  { id: "completion-1978", kind: "log", title: "Completion report — 1978", subtitle: "Perforation intervals & casing record", src: docCompletion1978 },
  { id: "core-limestone", kind: "core", title: "Core photo — limestone", subtitle: "Vuggy carbonate section", src: coreLimestone },
  { id: "core-dolomite", kind: "core", title: "Core photo — dolomite", subtitle: "Intercrystalline porosity", src: coreDolomite },
  { id: "core-shale", kind: "core", title: "Core photo — shale", subtitle: "Laminated seal interval", src: coreShale },
];

type StepState = "idle" | "running" | "done" | "error";

interface Step {
  key: string;
  label: string;
  agent: string;
  state: StepState;
  detail?: string;
}

const LOG_STEPS: Step[] = [
  { key: "load", label: "Load archive document", agent: "Ingest", state: "idle" },
  { key: "ocr", label: "Vision OCR — read scan", agent: "OCR Well Log Agent", state: "idle" },
  { key: "ingest", label: "Write well + curves + perforations", agent: "Ingest Pipeline", state: "idle" },
  { key: "stage8", label: "Stage 8 — Geophysical digital output", agent: "Geophysical AI Agent", state: "idle" },
];

const CORE_STEPS: Step[] = [
  { key: "load", label: "Load archive core photo", agent: "Ingest", state: "idle" },
  { key: "cv", label: "Computer vision — core interpretation", agent: "Core Vision Agent", state: "idle" },
  { key: "stage8", label: "Stage 8 — digital petrophysical values", agent: "Geophysical AI Agent", state: "idle" },
];

async function toDataUrl(src: string): Promise<string> {
  const resp = await fetch(src);
  const blob = await resp.blob();
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

interface Props {
  onLoadIntoUploader?: (dataUrl: string, name: string) => void;
}

export default function SampleArchiveStage8Demo({ onLoadIntoUploader }: Props) {
  const [active, setActive] = useState<Sample>(SAMPLES[0]);
  const [steps, setSteps] = useState<Step[]>(LOG_STEPS);
  const [running, setRunning] = useState(false);
  const [digitalRows, setDigitalRows] = useState<{ label: string; value: string; unit?: string }[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  const pick = useCallback((s: Sample) => {
    setActive(s);
    setSteps(s.kind === "log" ? LOG_STEPS : CORE_STEPS);
    setDigitalRows([]);
    setVerdict(null);
    setDataSource(null);
  }, []);

  const mark = (key: string, state: StepState, detail?: string) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, state, detail } : s)));

  const loadToUploader = useCallback(async () => {
    const dataUrl = await toDataUrl(active.src);
    onLoadIntoUploader?.(dataUrl, `${active.title} (platform sample)`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Sample loaded into the uploader above");
  }, [active, onLoadIntoUploader]);

  const runChain = useCallback(async () => {
    setRunning(true);
    setDigitalRows([]);
    setVerdict(null);
    setDataSource(null);
    const base = active.kind === "log" ? LOG_STEPS : CORE_STEPS;
    setSteps(base.map((s) => ({ ...s, state: "idle", detail: undefined })));

    try {
      mark("load", "running");
      const dataUrl = await toDataUrl(active.src);
      mark("load", "done", active.title);

      if (active.kind === "log") {
        mark("ocr", "running");
        const { data: ocr, error: ocrErr } = await supabase.functions.invoke("ocr-well-log", {
          body: { image: dataUrl, quality: "auto" },
        });
        if (ocrErr) throw new Error(ocrErr.message);
        if (!ocr?.ok) throw new Error(ocr?.error || "OCR failed");
        const r = ocr.result || {};
        mark("ocr", "done", `${r.logged_curves?.length ?? 0} curves · ${r.formation_tops?.length ?? 0} tops`);

        mark("ingest", "running");
        const { data: pipe, error: pipeErr } = await supabase.functions.invoke("ocr-ingest-analyze", {
          body: { ocrResult: r, sourceLabel: "sample_archive_demo" },
        });
        if (pipeErr) throw new Error(pipeErr.message);
        if (!pipe?.ok) throw new Error(pipe?.error || "Ingest failed");
        mark("ingest", "done", `${pipe.logsInserted ?? 0} log points · ${pipe.perfsInserted ?? 0} perforations`);

        mark("stage8", "running");
        const stage = pipe.stageAnalysis;
        const rows: { label: string; value: string; unit?: string }[] = [
          { label: "Well", value: fmt(pipe.well?.well_name) },
          { label: "API number", value: fmt(r.api_number) },
          { label: "Operator", value: fmt(r.operator) },
          { label: "Depth interval", value: `${fmt(r.depth_range_ft?.top)} – ${fmt(r.depth_range_ft?.bottom)}`, unit: "ft" },
          { label: "Digitized log points", value: fmt(pipe.logsInserted) },
          { label: "Perforations recorded", value: fmt(pipe.perfsInserted) },
          { label: "Formation tops", value: fmt(r.formation_tops?.length ?? 0) },
        ];
        const metrics = stage?.metrics;
        if (metrics && typeof metrics === "object") {
          for (const [k, v] of Object.entries(metrics)) {
            rows.push({ label: k.replace(/_/g, " "), value: fmt(v) });
          }
        }
        setDigitalRows(rows);
        setVerdict(stage?.verdict ?? pipe.stageError ?? null);
        setDataSource(stage?.dataSource ?? null);
        mark("stage8", stage ? "done" : "error", stage ? "Stage 8 metrics returned" : pipe.stageError || "Stage 8 skipped");
      } else {
        mark("cv", "running");
        const { data: cv, error: cvErr } = await supabase.functions.invoke("analyze-core-cv", {
          body: { imageBase64: dataUrl, analysisType: "full" },
        });
        if (cvErr) throw new Error(cvErr.message);
        if (cv?.error) throw new Error(cv.error);
        const a = cv?.analysis ?? {};
        mark("cv", "done", cv?.model ? `model: ${cv.model}` : "interpretation returned");

        mark("stage8", "running");
        const rows: { label: string; value: string; unit?: string }[] = [];
        const flatten = (obj: any, prefix = "") => {
          for (const [k, v] of Object.entries(obj || {})) {
            if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, `${prefix}${k} · `);
            else rows.push({ label: `${prefix}${k}`.replace(/_/g, " "), value: fmt(v) });
          }
        };
        flatten(a);
        setDigitalRows(rows.slice(0, 24));
        setVerdict(typeof a.raw_analysis === "string" ? a.raw_analysis.slice(0, 900) : null);
        setDataSource("REAL IMAGE — core photo");
        mark("stage8", "done", `${rows.length} digital values extracted`);
      }
      toast.success("Agent chain complete — digital values ready");
    } catch (e: any) {
      const msg = e?.message || "Agent chain failed";
      setSteps((prev) => prev.map((s) => (s.state === "running" ? { ...s, state: "error", detail: msg } : s)));
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }, [active]);

  return (
    <Card className="p-6 space-y-5 border-primary/30">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Archive samples → Stage 8 digital output
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Pick a platform sample (paper log, completion report or core photo) and watch the agent chain
            turn a scanned page into structured numbers used by Stage 8 — Geophysical analysis.
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Activity className="mr-1 h-3 w-3" /> Live agent chain
        </Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            onClick={() => pick(s)}
            className={`text-left rounded-lg border overflow-hidden transition-colors ${
              active.id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <img src={s.src} alt={s.title} className="w-full h-24 object-cover" loading="lazy" />
            <div className="p-2">
              <div className="text-xs font-medium flex items-center gap-1">
                {s.kind === "core" ? <Microscope className="h-3 w-3" /> : <ScanText className="h-3 w-3" />}
                {s.title}
              </div>
              <div className="text-[11px] text-muted-foreground">{s.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={runChain} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          Run agent chain on “{active.title}”
        </Button>
        <Button variant="outline" onClick={loadToUploader} disabled={running}>
          <Upload className="mr-2 h-4 w-4" /> Load this sample into the uploader
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          {steps.map((s) => (
            <div key={s.key} className="flex items-start gap-3 p-2 rounded-md border border-border/60">
              {s.state === "done" && <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />}
              {s.state === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />}
              {s.state === "error" && <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />}
              {s.state === "idle" && <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />}
              <div className="min-w-0">
                <div className="text-sm">{s.label}</div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {s.agent}
                  {s.detail ? ` · ${s.detail}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Digital values in Stage 8
            {dataSource && (
              <Badge variant="outline" className="text-[10px]">
                {dataSource}
              </Badge>
            )}
          </div>
          {digitalRows.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              Run the chain — extracted numbers will appear here as structured Stage 8 inputs.
            </div>
          ) : (
            <div className="rounded-md border border-border divide-y divide-border/60 max-h-80 overflow-auto">
              {digitalRows.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground capitalize">{r.label}</span>
                  <span className="font-mono">
                    {r.value}
                    {r.unit ? ` ${r.unit}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          {verdict && (
            <div className="p-3 rounded-md border border-primary/30 bg-primary/5 text-xs whitespace-pre-wrap">
              {verdict}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
