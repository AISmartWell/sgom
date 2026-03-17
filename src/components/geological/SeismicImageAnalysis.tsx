import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, Loader2, Eye, Layers, AlertTriangle, X, Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type SelectedWell } from "./WellSelector";
import { SeismicSampleGallery } from "./SeismicSampleGallery";

type AnalysisMode = "full" | "faults" | "horizons" | "anomalies";

interface SeismicImageAnalysisProps {
  selectedWell: SelectedWell | null;
}

const SeismicImageAnalysis = ({ selectedWell }: SeismicImageAnalysisProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("full");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, TIFF)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Max file size: 20 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setFileName(file.name);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const clearImage = () => {
    setImagePreview(null);
    setFileName(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadImageToStorage = async (dataUrl: string, name: string): Promise<{ filePath: string; imageId: string } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).limit(1).single();
      if (!uc) return null;

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] || "jpg";
      const filePath = `${uc.company_id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("seismic-images").upload(filePath, blob, { contentType: blob.type });
      if (uploadErr) throw uploadErr;

      // Save metadata to seismic_images table
      const { data: imgRecord, error: insertErr } = await supabase.from("seismic_images").insert({
        company_id: uc.company_id,
        user_id: user.id,
        file_path: filePath,
        file_name: name || "seismic-section",
        well_id: selectedWell?.id || null,
        api_number: selectedWell?.api_number || null,
        formation: selectedWell?.formation || null,
        image_type: "2d_section",
      }).select("id").single();
      if (insertErr) throw insertErr;

      return { filePath, imageId: imgRecord.id };
    } catch (err) {
      console.error("Image upload error:", err);
      return null;
    }
  };

  const saveAnalysisResults = async (analysis: any, model: string, imageId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).limit(1).single();
      if (!uc) return;

      await supabase.from("seismic_analyses").insert({
        company_id: uc.company_id,
        user_id: user.id,
        seismic_image_id: imageId,
        well_id: selectedWell?.id || null,
        analysis_mode: analysisMode,
        model: model || null,
        results: analysis,
      });
    } catch (err) {
      console.error("Save analysis error:", err);
    }
  };

  const runCVAnalysis = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      // Upload image to storage in parallel with analysis
      const uploadPromise = uploadImageToStorage(imagePreview, fileName || "seismic-section");

      const { data, error } = await supabase.functions.invoke("analyze-seismic-cv", {
        body: {
          imageBase64: imagePreview,
          analysisMode,
          wellContext: selectedWell
            ? {
                name: selectedWell.well_name,
                formation: selectedWell.formation,
                depth: selectedWell.total_depth,
                oil: selectedWell.production_oil,
              }
            : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.analysis);

      // Save results to DB
      const uploaded = await uploadPromise;
      await saveAnalysisResults(data.analysis, data.model, uploaded?.imageId || null);

      toast.success(`Seismic CV analysis complete (${analysisMode}) — saved to database`);
    } catch (err: any) {
      console.error("Seismic CV error:", err);
      toast.error(err.message || "CV analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confidenceColor = (c: number) =>
    c >= 0.8 ? "text-success" : c >= 0.5 ? "text-warning" : "text-destructive";

  const confidenceBadge = (c: number) => (
    <Badge variant={c >= 0.8 ? "default" : c >= 0.5 ? "secondary" : "destructive"} className="text-xs">
      {(c * 100).toFixed(0)}%
    </Badge>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          Seismic Image CV Analysis
          <Badge variant="outline" className="text-xs ml-auto">NVIDIA NIM</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        {!imagePreview ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Upload 2D Seismic Section Image</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, TIFF — drag & drop or click to browse
              </p>
            </div>
            <SeismicSampleGallery
              onSelectSample={(dataUrl, name) => {
                setImagePreview(dataUrl);
                setFileName(name);
                setResult(null);
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image preview */}
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={imagePreview}
                alt="Seismic section"
                className="w-full max-h-64 object-contain bg-muted/30"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 bg-background/80"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 rounded text-xs">
                {fileName}
              </div>
            </div>

            {/* Analysis mode selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Mode:</span>
              {(
                [
                  { key: "full", label: "Full Analysis", icon: Eye },
                  { key: "faults", label: "Faults", icon: Layers },
                  { key: "horizons", label: "Horizons", icon: Layers },
                  { key: "anomalies", label: "Anomalies", icon: AlertTriangle },
                ] as const
              ).map((m) => (
                <Button
                  key={m.key}
                  variant={analysisMode === m.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => { setAnalysisMode(m.key); setResult(null); }}
                >
                  <m.icon className="h-3 w-3 mr-1" />
                  {m.label}
                </Button>
              ))}
            </div>

            {/* Run button */}
            <Button onClick={runCVAnalysis} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing ? "NVIDIA NIM analyzing..." : "Run CV Analysis"}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="border border-border rounded-lg p-4 bg-card space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              CV Interpretation Results
              <Badge variant="outline" className="text-xs">{analysisMode}</Badge>
            </h4>

            {/* Faults */}
            {result.faults && result.faults.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Faults ({result.faults.length})
                </h5>
                <div className="space-y-2">
                  {result.faults.map((f: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-destructive/5 rounded-md border border-destructive/10">
                      <Badge variant="destructive" className="text-xs shrink-0">{f.id || `F${i + 1}`}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{f.type} fault</p>
                        <p className="text-xs text-muted-foreground">
                          {f.dip_angle_deg && `Dip: ${f.dip_angle_deg}°`}
                          {f.throw_m && ` • Throw: ${f.throw_m} ft`}
                          {f.depth_range && ` • ${f.depth_range}`}
                        </p>
                        {f.description && <p className="text-xs text-muted-foreground mt-1">{f.description}</p>}
                      </div>
                      {f.confidence != null && confidenceBadge(f.confidence)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horizons */}
            {result.horizons && result.horizons.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Horizons ({result.horizons.length})
                </h5>
                <div className="space-y-2">
                  {result.horizons.map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                      <Badge className="text-xs shrink-0">{h.id || `H${i + 1}`}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.depth_m && `Depth: ${h.depth_m} ft`}
                          {h.twt_ms && ` • TWT: ${h.twt_ms}ms`}
                          {h.continuity && ` • ${h.continuity}`}
                          {h.amplitude && ` • Amp: ${h.amplitude}`}
                        </p>
                        {h.description && <p className="text-xs text-muted-foreground mt-1">{h.description}</p>}
                      </div>
                      {h.confidence != null && confidenceBadge(h.confidence)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anomalies */}
            {result.anomalies && result.anomalies.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Anomalies ({result.anomalies.length})
                </h5>
                <div className="space-y-2">
                  {result.anomalies.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-warning/5 rounded-md border border-warning/10">
                      <Badge variant="secondary" className="text-xs shrink-0">{a.id || `A${i + 1}`}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{a.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.depth_m && `Depth: ${a.depth_m} ft`}
                          {a.lateral_extent_m && ` • Extent: ${a.lateral_extent_m} ft`}
                          {a.dhi_class && ` • ${a.dhi_class}`}
                        </p>
                        {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                      </div>
                      {a.confidence != null && confidenceBadge(a.confidence)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unconformities */}
            {result.unconformities && result.unconformities.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Unconformities</h5>
                {result.unconformities.map((u: any, i: number) => (
                  <div key={i} className="text-xs p-2 bg-muted/30 rounded-md mb-1">
                    <span className="font-medium">{u.type}</span> at {u.depth_m} ft — {u.description}
                  </div>
                ))}
              </div>
            )}

            {/* Fluid contacts */}
            {result.fluid_contacts && result.fluid_contacts.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Fluid Contacts</h5>
                <div className="flex gap-2 flex-wrap">
                  {result.fluid_contacts.map((fc: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {fc.type}: {fc.depth_m}m ({(fc.confidence * 100).toFixed(0)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Summary badges */}
            <div className="flex gap-2 flex-wrap pt-2 border-t border-border">
              {result.structural_style && (
                <Badge variant="outline" className="text-xs">🏗️ {result.structural_style}</Badge>
              )}
              {result.reservoir_potential && (
                <Badge variant="outline" className="text-xs">🎯 Reservoir: {result.reservoir_potential}</Badge>
              )}
              {result.bypassed_reserves_potential && (
                <Badge variant="outline" className="text-xs">💎 Bypassed: {result.bypassed_reserves_potential}</Badge>
              )}
              {result.seal_risk && (
                <Badge variant="outline" className="text-xs">🔒 Seal Risk: {result.seal_risk}</Badge>
              )}
              {result.risk_assessment && (
                <Badge variant="outline" className="text-xs">⚠️ Risk: {result.risk_assessment}</Badge>
              )}
            </div>

            {/* Interpretation text */}
            {result.interpretation && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1">AI Interpretation</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.interpretation}</p>
              </div>
            )}

            {/* Key observations & recommendations */}
            {result.key_observations && (
              <div>
                <p className="text-xs font-semibold mb-1">Key Observations</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                  {result.key_observations.map((o: string, i: number) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            {result.recommendations && (
              <div>
                <p className="text-xs font-semibold mb-1">Recommendations</p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
                  {result.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeismicImageAnalysis;
