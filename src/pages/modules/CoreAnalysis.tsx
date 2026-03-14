import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Scan,
  Loader2,
  ImageIcon,
  FileText,
  Layers,
  Droplets,
  Mountain,
  Eye,
  History,
  Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { CVDemoVisualization } from "@/components/core-analysis/CVDemoVisualization";
import { SampleGallery } from "@/components/core-analysis/SampleGallery";
import { AdvancedAnalysisPanel } from "@/components/core-analysis/AdvancedAnalysisPanel";
import { AnalysisHistory } from "@/components/core-analysis/AnalysisHistory";
import { CoreImageGallery } from "@/components/core-analysis/CoreImageGallery";
import { ValidationPanel } from "@/components/core-analysis/ValidationPanel";
import { DeviationReport } from "@/components/core-analysis/DeviationReport";

const CoreAnalysis = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setImageFile(file);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const saveAnalysis = async (analysisText: string, sampleName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;

      let imageUrl: string | null = null;
      if (image) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("core-images")
          .upload(fileName, Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), {
            contentType: "image/jpeg",
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("core-images")
            .getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      }

      const rockTypeMatch = analysisText.match(/(?:Rock Type|Primary rock type)[:\s]*\**([^*\n,]+)/i);
      const rockType = rockTypeMatch ? rockTypeMatch[1].trim().substring(0, 100) : null;

      await supabase.from("core_analyses" as any).insert({
        user_id: user.id,
        company_id: membership.company_id,
        sample_name: sampleName || imageFile?.name || "Core Sample",
        image_url: imageUrl,
        analysis: analysisText,
        rock_type: rockType,
      });
    } catch (err) {
      console.error("Failed to save analysis:", err);
    }
  };

  const analyzeCore = async () => {
    if (!image) {
      toast.error("Please upload a core sample image first");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-core", {
        body: { imageBase64: image },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast.success("Core analysis complete!");
      await saveAnalysis(data.analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setAnalysis(null);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔬</span>
            <h1 className="text-3xl font-bold">Core Sample Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered computer vision for geological core interpretation
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Scan className="mr-1 h-3 w-3" />
          Stage 3
        </Badge>
      </div>

      <Tabs defaultValue="analyze" className="space-y-6">
        <TabsList className="grid w-full max-w-5xl grid-cols-7">
          <TabsTrigger value="analyze" className="gap-2">
            <Scan className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <Mountain className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="core-library" className="gap-2">
            <Database className="h-4 w-4" />
            Core Library
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Samples
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Layers className="h-4 w-4" />
            Advanced CV
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="demo" className="gap-2">
            <Eye className="h-4 w-4" />
            Demo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Upload */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Core Sample
              </CardTitle>
              <CardDescription>
                Upload a core sample image for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!image ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Drag and drop a core sample image here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="core-upload"
                  />
                  <label htmlFor="core-upload">
                    <Button variant="outline" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported: JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={image}
                      alt="Core sample"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {imageFile?.name} ({(imageFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearImage}>
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={analyzeCore}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Scan className="mr-2 h-4 w-4" />
                            Analyze Core
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Analysis Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <Mountain className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Rock Types</p>
                  <p className="text-xs text-muted-foreground">Classification</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                <Droplets className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Porosity</p>
                  <p className="text-xs text-muted-foreground">Estimation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                <Layers className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium">Fractures</p>
                  <p className="text-xs text-muted-foreground">Detection</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                <FileText className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">Minerals</p>
                  <p className="text-xs text-muted-foreground">Composition</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analysis Results */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              AI-generated geological interpretation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing core sample...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take 10-30 seconds
                </p>
                <Progress value={33} className="w-48 mt-4" />
              </div>
            ) : analysis ? (
              <div className="space-y-0">
                <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[500px]">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
                <DeviationReport analysisText={analysis} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Scan className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No analysis yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a core sample image and click "Analyze Core" to get
                  started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="validation">
          <div className="max-w-6xl mx-auto">
            <ValidationPanel />
          </div>
        </TabsContent>

        <TabsContent value="core-library">
          <CoreImageGallery />
        </TabsContent>

        <TabsContent value="gallery">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SampleGallery
              onSelectSample={(dataUrl, name) => {
                setImage(dataUrl);
                setImageFile(new File([], name));
                setAnalysis(null);
              }}
            />
            {/* Right column: same analysis results card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Select a sample, then click "Analyze Core" on the Analysis tab
                </CardDescription>
              </CardHeader>
              <CardContent>
                {image ? (
                  <div className="space-y-4">
                    <img src={image} alt="Selected sample" className="w-full h-48 object-cover rounded-lg border border-border" />
                    <Button onClick={() => { analyzeCore(); }} disabled={isAnalyzing} className="w-full">
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Scan className="mr-2 h-4 w-4" />
                          Analyze Selected Sample
                        </>
                      )}
                    </Button>
                    {analysis && (
                      <div className="space-y-0">
                        <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[400px]">
                          <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                        <DeviationReport analysisText={analysis} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm">Click a sample image to select it</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="max-w-3xl mx-auto">
            <AdvancedAnalysisPanel />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="max-w-4xl mx-auto">
            <AnalysisHistory />
          </div>
        </TabsContent>

        <TabsContent value="demo">
          <div className="max-w-3xl mx-auto">
            <CVDemoVisualization />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoreAnalysis;
