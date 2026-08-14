import { useCallback, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, Play, Loader2, CheckCircle2, XCircle, Clock, Trash2, Merge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PageStatus = "queued" | "running" | "done" | "error";

interface PageJob {
  id: string;
  name: string;
  dataUrl: string;
  status: PageStatus;
  ms?: number;
  error?: string;
  result?: any;
}

interface Props {
  quality?: "auto" | "digitize";
  /** Called with the merged multi-page OCR result */
  onMerged?: (merged: any, pages: number) => void;
}

const MAX_FILES = 24;
const CONCURRENCY_OPTIONS = [1, 2, 3, 4, 6];

const readAsDataUrl = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error(`Cannot read ${f.name}`));
    r.readAsDataURL(f);
  });

const uniq = (arr: any[]) => Array.from(new Set(arr.filter((v) => v != null && v !== "")));

/** Merge per-page OCR payloads into a single document-level result */
export function mergeOcrPages(results: any[]): any {
  const ok = results.filter(Boolean);
  if (!ok.length) return null;
  const firstOf = (k: string) => ok.map((r) => r?.[k]).find((v) => v != null && v !== "") ?? null;

  const tops = ok.flatMap((r) => r.formation_tops ?? []);
  const topsDedup = Array.from(
    new Map(tops.map((t: any) => [`${(t.name ?? "").toLowerCase()}|${t.depth_ft}`, t])).values(),
  ).sort((a: any, b: any) => (a.depth_ft ?? 0) - (b.depth_ft ?? 0));

  const perfs = ok.flatMap((r) => r.perforations ?? []);
  const perfsDedup = Array.from(
    new Map(perfs.map((p: any) => [`${p.top_ft}|${p.bottom_ft}`, p])).values(),
  ).sort((a: any, b: any) => (a.top_ft ?? 0) - (b.top_ft ?? 0));

  const readings = ok
    .flatMap((r) => r.log_readings ?? [])
    .sort((a: any, b: any) => (a?.depth ?? a?.DEPT ?? 0) - (b?.depth ?? b?.DEPT ?? 0));

  const depths = ok.map((r) => r.depth_range_ft).filter(Boolean);
  const tops_ft = depths.map((d: any) => d?.top).filter((v: any) => typeof v === "number");
  const bots_ft = depths.map((d: any) => d?.bottom).filter((v: any) => typeof v === "number");

  const confs = ok.map((r) => r.confidence).filter((v) => typeof v === "number");

  return {
    document_title: firstOf("document_title"),
    well_name: firstOf("well_name"),
    api_number: firstOf("api_number"),
    operator: firstOf("operator"),
    service_company: firstOf("service_company"),
    field: firstOf("field"),
    county: firstOf("county"),
    state: firstOf("state"),
    log_date: firstOf("log_date"),
    depth_range_ft: {
      top: tops_ft.length ? Math.min(...tops_ft) : null,
      bottom: bots_ft.length ? Math.max(...bots_ft) : null,
    },
    logged_curves: uniq(ok.flatMap((r) => r.logged_curves ?? [])),
    curve_tracks: ok.flatMap((r) => r.curve_tracks ?? []),
    visible_depth_markers_ft: uniq(ok.flatMap((r) => r.visible_depth_markers_ft ?? [])).sort(
      (a: any, b: any) => a - b,
    ),
    formation_tops: topsDedup,
    perforations: perfsDedup,
    log_readings: readings,
    visible_text_tokens: uniq(ok.flatMap((r) => r.visible_text_tokens ?? [])),
    raw_text: ok.map((r, i) => `--- page ${i + 1} ---\n${r.raw_text ?? ""}`).join("\n"),
    confidence: confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : undefined,
    notes: `Merged from ${ok.length} page(s) processed in parallel.`,
    _meta: { model: ok[0]?._meta?.model, pages: ok.length },
  };
}

export default function OCRBatchQueue({ quality = "auto", onMerged }: Props) {
  const [jobs, setJobs] = useState<PageJob[]>([]);
  const [concurrency, setConcurrency] = useState(1);
  const [running, setRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const done = jobs.filter((j) => j.status === "done").length;
  const failed = jobs.filter((j) => j.status === "error").length;
  const pct = jobs.length ? Math.round(((done + failed) / jobs.length) * 100) : 0;
  const totalMs = useMemo(() => jobs.reduce((s, j) => s + (j.ms ?? 0), 0), [jobs]);
  const avgMs = done ? totalMs / done : 0;
  const etaS = avgMs
    ? Math.round(((jobs.length - done - failed) * avgMs) / Math.max(1, concurrency) / 1000)
    : null;

  const addFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) {
      toast.error("Only images (PNG / JPG) — one file per page");
      return;
    }
    const next: PageJob[] = [];
    for (const f of imgs.slice(0, MAX_FILES)) {
      if (f.size > 30 * 1024 * 1024) {
        toast.error(`${f.name}: >30 MB, downscale first`);
        continue;
      }
      const raw = await readAsDataUrl(f);
      const dataUrl = await downscaleDataUrl(raw, MAX_EDGE_PX);
      next.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        dataUrl,
        status: "queued",
      });
    }
    setJobs((p) => [...p, ...next].slice(0, MAX_FILES));
  }, []);

  const patch = (id: string, upd: Partial<PageJob>) =>
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, ...upd } : j)));

  const runQueue = useCallback(async () => {
    const all = jobs;
    const pending = all.filter((j) => j.status === "queued" || j.status === "error");
    if (!pending.length) return;
    cancelRef.current = false;
    setRunning(true);
    const started = performance.now();

    let cursor = 0;
    // keep already-recognised pages so partial merges stay complete
    const results: any[] = all.filter((j) => j.status === "done" && j.result).map((j) => j.result);

    const worker = async () => {
      while (!cancelRef.current) {
        const job = pending[cursor++];
        if (!job) return;
        patch(job.id, { status: "running", error: undefined });
        setCurrentPage(job.name);
        const t0 = performance.now();
        try {
          const { data, error } = await supabase.functions.invoke("ocr-well-log", {
            body: { image: job.dataUrl, quality },
          });
          if (error) throw error;
          if (!data?.ok) throw new Error(data?.error || "Recognition failed");
          patch(job.id, { status: "done", ms: performance.now() - t0, result: data.result });
          results.push(data.result);
          // incremental merge — results appear after every finished page
          onMerged?.(mergeOcrPages(results), results.length);
        } catch (e: any) {
          patch(job.id, { status: "error", ms: performance.now() - t0, error: e?.message || "OCR failed" });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
    setRunning(false);
    setCurrentPage(null);

    const wall = Math.round((performance.now() - started) / 1000);
    if (results.length) {
      toast.success(
        `${results.length} page(s) merged in ${wall}s (${concurrency === 1 ? "sequential" : `×${concurrency} parallel`})`,
      );
    } else {
      toast.error("No pages recognised");
    }
  }, [jobs, concurrency, quality, onMerged]);

  return (
    <Card className="p-6 space-y-4 border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Batch queue — page-by-page parallel OCR
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Split a heavy scan into single pages and upload them together. Pages run as independent
            edge-function calls with a configurable parallelism, then merge into one document result —
            total time drops roughly by the concurrency factor and each call stays under the runtime limit.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">{jobs.length} / {MAX_FILES} pages</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }}
          />
          <div className="px-3 py-2 text-sm border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/40">
            Add pages (multi-select)
          </div>
        </label>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          Parallel:
          {CONCURRENCY_OPTIONS.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={concurrency === c ? "default" : "outline"}
              className="h-7 px-2"
              disabled={running}
              onClick={() => setConcurrency(c)}
            >
              ×{c}
            </Button>
          ))}
        </div>

        <Button onClick={runQueue} disabled={running || !jobs.some((j) => j.status !== "done")}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Run queue
        </Button>
        {running && (
          <Button variant="outline" onClick={() => { cancelRef.current = true; }}>Stop</Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={running || !jobs.length}
          onClick={() => setJobs([])}
        >
          <Trash2 className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      {jobs.length > 0 && (
        <>
          <Progress value={pct} className="h-2" />
          <div className="text-xs text-muted-foreground flex gap-4">
            <span>{done} done</span>
            <span>{failed} failed</span>
            <span>CPU-time sum {(totalMs / 1000).toFixed(1)}s</span>
          </div>

          <div className="space-y-1 max-h-64 overflow-auto">
            {jobs.map((j, i) => (
              <div key={j.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded border border-border/60">
                <span className="font-mono text-muted-foreground w-8">p{i + 1}</span>
                {j.status === "queued" && <Clock className="h-3 w-3 text-muted-foreground" />}
                {j.status === "running" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                {j.status === "done" && <CheckCircle2 className="h-3 w-3 text-primary" />}
                {j.status === "error" && <XCircle className="h-3 w-3 text-destructive" />}
                <span className="flex-1 truncate">{j.name}</span>
                {j.ms != null && <span className="font-mono text-muted-foreground">{(j.ms / 1000).toFixed(1)}s</span>}
                {j.error && <span className="text-destructive truncate max-w-[40%]">{j.error}</span>}
              </div>
            ))}
          </div>

          {done > 0 && !running && (
            <div className="flex items-center gap-2 text-xs p-2 rounded-md border border-primary/30 bg-primary/5">
              <Merge className="h-3 w-3 text-primary" />
              Merged result of {done} page(s) loaded into the panels below (tops, perforations and curve
              samples are concatenated and de-duplicated).
            </div>
          )}
        </>
      )}
    </Card>
  );
}
