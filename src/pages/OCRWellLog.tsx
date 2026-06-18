import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, ScanText, Loader2, FileImage, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
