import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, ScanText, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  companyId?: string | null;
  onWellCreated?: (wellId: string) => void;
}

export default function OCRQuickIngest({ companyId, onWellCreated }: Props) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ocr, setOcr] = useState<any | null>(null);
  const [createdWell, setCreatedWell] = useState<any | null>(null);

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    setOcr(null); setCreatedWell(null);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }, []);

  const runOcr = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ocr-well-log", {
        body: { image: preview, mime: preview.split(";")[0].replace("data:", "") || "image/png" },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "OCR failed");
      setOcr(data.result);
      toast.success("OCR complete — review before ingest");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  const ingest = async () => {
    if (!ocr) return;
    setIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ocr-ingest-analyze", {
        body: { ocrResult: ocr, companyId: companyId || undefined, sourceLabel: "spt_advisor_ocr" },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Ingest failed");
      setCreatedWell(data.well);
      onWellCreated?.(data.well.id);
      toast.success(`Well "${data.well.well_name}" added — available to advisor`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setIngesting(false); }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanText className="w-5 h-5 text-primary" /> OCR — Paper Well Log Recognition
          <Badge className="bg-primary/20 text-primary border-primary/30">Gemini 2.5 Pro Vision</Badge>
        </CardTitle>
        <CardDescription>
          Upload a scanned paper log — the advisor will extract header, tops, perforations, and log readings,
          then create the well so it can be ranked immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
            <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/40 text-sm">
              <Upload className="w-4 h-4" />
              {fileName || "Choose scanned log image (JPG / PNG)"}
            </div>
          </label>
          <Button onClick={runOcr} disabled={!preview || loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanText className="w-4 h-4 mr-2" />}
            Run OCR
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/ocr")}>
            Full OCR page <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {preview && (
          <div className="flex gap-3">
            <img src={preview} alt="scan" className="max-h-40 rounded-md border border-border" />
            {ocr && (
              <div className="flex-1 text-xs space-y-1">
                <div><span className="text-muted-foreground">Well:</span> <span className="font-mono">{ocr.well_name ?? "—"}</span></div>
                <div><span className="text-muted-foreground">API:</span> <span className="font-mono">{ocr.api_number ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Operator:</span> <span className="font-mono">{ocr.operator ?? "—"}</span></div>
                <div><span className="text-muted-foreground">County / State:</span> <span className="font-mono">{ocr.county ?? "—"} / {ocr.state ?? "—"}</span></div>
                <div><span className="text-muted-foreground">Depth:</span> <span className="font-mono">{ocr.depth_range_ft?.top ?? "?"}–{ocr.depth_range_ft?.bottom ?? "?"} ft</span></div>
                <div><span className="text-muted-foreground">Tops:</span> <span className="font-mono">{ocr.formation_tops?.map((t: any) => t.name).join(", ") || "—"}</span></div>
                <div><span className="text-muted-foreground">Curves:</span> <span className="font-mono">{ocr.logged_curves?.join(", ") || "—"}</span></div>
                <div><span className="text-muted-foreground">Confidence:</span> <span className="font-mono">{ocr.confidence != null ? Math.round(ocr.confidence * 100) + "%" : "—"}</span></div>
              </div>
            )}
          </div>
        )}

        {ocr && !createdWell && (
          <div className="flex items-center justify-between p-2 rounded-md border border-primary/20 bg-primary/5">
            <div className="text-xs text-muted-foreground">
              Ingest creates the well + well_logs + perforations and triggers Stage 8 analysis.
            </div>
            <Button size="sm" onClick={ingest} disabled={ingesting}>
              {ingesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Ingest & add to advisor
            </Button>
          </div>
        )}

        {createdWell && (
          <div className="p-2 rounded-md border border-primary/40 bg-primary/10 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Added <span className="font-mono">{createdWell.well_name}</span> · id{" "}
            <span className="font-mono text-xs">{createdWell.id.slice(0, 8)}</span>. Run the advisor to include it.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
