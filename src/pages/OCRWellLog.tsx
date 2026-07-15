import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, ScanText, Loader2, FileImage, CheckCircle2, Sparkles, Activity, ArrowRight, Database, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import demoPaperLog from "@/assets/demo-paper-well-log.jpg";
import { OCRCurvePreview } from "@/components/ocr/OCRCurvePreview";
import { OCRQualityCheck } from "@/components/ocr/OCRQualityCheck";

type OcrResult = {
  well_name?: string | null;
  api_number?: string | null;
  operator?: string | null;
  field?: string | null;
  county?: string | null;
  state?: string | null;
  log_date?: string | null;
  depth_range_ft?: { top?: number | null; bottom?: number | null };
  logged_curves?: string[];
  formation_tops?: { name: string; depth_ft: number }[];
  perforations?: { top_ft: number; bottom_ft: number; date?: string | null }[];
  log_readings?: Record<string, number | null>[];
  raw_text?: string;
  confidence?: number;
  notes?: string;
};

const OCRWellLog = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineOut, setPipelineOut] = useState<any | null>(null);

  const runFullPipeline = useCallback(async () => {
    if (!result) return;
    setPipelineLoading(true);
    setPipelineOut(null);
    try {
      const { data, error } = await supabase.functions.invoke("ocr-ingest-analyze", {
        body: { ocrResult: result, sourceLabel: "ocr_paper_log" },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Pipeline failed");
      setPipelineOut(data);
      toast.success(
        `Well created · ${data.logsInserted} log points · Stage 8 ${data.stageAnalysis ? "complete" : "skipped"}`
      );
    } catch (e: any) {
      toast.error(e?.message || "Pipeline failed");
    } finally {
      setPipelineLoading(false);
    }
  }, [result]);

  const onFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Upload an image (PNG / JPG). PDF support coming soon.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image too large (>12 MB). Please downscale.");
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const loadDemo = useCallback(async () => {
    setFileName("BRAWNER 10-15 — 1962 paper log (demo)");
    setResult(null);
    const resp = await fetch(demoPaperLog);
    const blob = await resp.blob();
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(blob);
  }, []);

  const recognize = useCallback(async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ocr-well-log", {
        body: { image: preview },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Recognition failed");
      setResult(data.result);
      toast.success("Scan recognised");
    } catch (e: any) {
      toast.error(e?.message || "OCR failed");
    } finally {
      setLoading(false);
    }
  }, [preview]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <ScanText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">OCR — Paper Well Log Recognition</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Upload a scanned or photographed paper log (GR, SP, resistivity, neutron, density strip-chart
            or header sheet). AI extracts well metadata, formation tops, perforations and digitises
            readable curve values into structured JSON.
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <FileImage className="mr-1 h-3 w-3" /> Stage 2 · Data Ingest
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Upload className="h-4 w-4" /> Source scan
          </h2>

          <label
            className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drop a PNG / JPG here or click to select
            </div>
            {fileName && <div className="text-xs mt-2 text-primary">{fileName}</div>}
          </label>

          <Button variant="outline" size="sm" onClick={loadDemo} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Load demo: 1962 paper log (Brawner 10-15)
          </Button>

          {preview && (
            <div className="rounded-lg overflow-hidden border border-border bg-black/40">
              <img src={preview} alt="scan preview" className="w-full max-h-[500px] object-contain" />
            </div>
          )}

          <Button onClick={recognize} disabled={!preview || loading} className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recognising…</>
            ) : (
              <><ScanText className="mr-2 h-4 w-4" /> Run OCR (Gemini Vision)</>
            )}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Extracted data
          </h2>

          {result && (() => {
            const wn = (result.well_name || "").toLowerCase();
            const isBrawner = wn.includes("brawner") || fileName.toLowerCase().includes("brawner");
            if (!isBrawner) return null;
            return (
              <Button
                onClick={() => navigate("/dashboard/digital-twin/brawner-10-15")}
                className="w-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                variant="outline"
              >
                <Activity className="mr-2 h-4 w-4" />
                Open Digital Twin for {result.well_name || "Brawner 10-15"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            );
          })()}

          {!result && (
            <div className="text-sm text-muted-foreground italic">
              Result will appear here. Confidence, raw text and parsed fields are returned as JSON.
            </div>
          )}

          {result && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Well" value={result.well_name} />
                <Field label="API #" value={result.api_number} />
                <Field label="Operator" value={result.operator} />
                <Field label="Field" value={result.field} />
                <Field label="County" value={result.county} />
                <Field label="State" value={result.state} />
                <Field label="Log date" value={result.log_date} />
                <Field
                  label="Depth (ft)"
                  value={
                    result.depth_range_ft
                      ? `${result.depth_range_ft.top ?? "?"} – ${result.depth_range_ft.bottom ?? "?"}`
                      : null
                  }
                />
              </div>

              {result.logged_curves?.length ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Curves detected</div>
                  <div className="flex flex-wrap gap-1">
                    {result.logged_curves.map((c) => (
                      <Badge key={c} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {result.formation_tops?.length ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Formation tops</div>
                  <table className="w-full text-xs">
                    <tbody>
                      {result.formation_tops.map((t, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="py-1">{t.name}</td>
                          <td className="py-1 text-right font-mono">{t.depth_ft} ft</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {result.perforations?.length ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Perforations</div>
                  <table className="w-full text-xs">
                    <tbody>
                      {result.perforations.map((p, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="py-1 font-mono">{p.top_ft} – {p.bottom_ft} ft</td>
                          <td className="py-1 text-right text-muted-foreground">{p.date ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {typeof result.confidence === "number" && (
                <div className="text-xs">
                  Overall confidence:{" "}
                  <span className="font-mono text-primary">
                    {(result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {result.notes && (
                <div className="text-xs text-muted-foreground italic">{result.notes}</div>
              )}

              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">Raw JSON</summary>
                <pre className="mt-2 p-3 bg-muted/40 rounded text-[10px] overflow-auto max-h-72">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </Card>
      </div>

      {result && (result.log_readings?.length || result.perforations?.length) ? (
        <div className="mt-6">
          <OCRCurvePreview
            readings={(result.log_readings || []) as any}
            perforations={(result.perforations || []) as any}
            formationTops={result.formation_tops || []}
          />
        </div>
      ) : null}

      {result && (
        <Card className="mt-6 p-6 space-y-4 border-primary/40">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Full pipeline · Create well → Save logs → Run Stage 8 (Geophysical)
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Creates a new well record from the OCR metadata, persists digitised curve points
                into <code className="text-primary">well_logs</code>, then invokes the geophysical
                petrophysics engine (Vsh · φ · Sw · Timur k · pay flags).
              </p>
            </div>
            <Button
              onClick={runFullPipeline}
              disabled={pipelineLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {pipelineLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…</>
              ) : (
                <><Brain className="mr-2 h-4 w-4" /> Save + Attach + Analyze</>
              )}
            </Button>
          </div>

          {pipelineOut && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground">New Well</div>
                  <div className="font-medium truncate">{pipelineOut.well?.well_name}</div>
                  <div className="text-[10px] font-mono text-primary truncate">
                    {pipelineOut.well?.id}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground">Log points</div>
                  <div className="font-medium">{pipelineOut.logsInserted}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-[10px] uppercase text-muted-foreground">Perforations</div>
                  <div className="font-medium">{pipelineOut.perfsInserted}</div>
                </div>
              </div>

              {pipelineOut.stageAnalysis ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                      Stage 8 · {pipelineOut.stageAnalysis.dataSource}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {pipelineOut.stageAnalysis.title}
                    </span>
                  </div>

                  {pipelineOut.stageAnalysis.metrics?.length > 0 && (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {pipelineOut.stageAnalysis.metrics.map((m: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-muted/20 text-xs">
                          <div className="text-muted-foreground">{m.label ?? m.name}</div>
                          <div className="font-mono text-primary">
                            {m.value} {m.unit ?? ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-[10px] uppercase text-primary mb-1">
                      Petrophysicist verdict
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {pipelineOut.stageAnalysis.verdict}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/modules/geophysical-expertise?wellId=${pipelineOut.well?.id}`)}
                  >
                    Open in Geophysical Expertise <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-amber-400">
                  Stage 8 unavailable: {pipelineOut.stageError || "no analysis returned"}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};


const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="font-medium">{value ?? <span className="text-muted-foreground">—</span>}</div>
  </div>
);

export default OCRWellLog;
