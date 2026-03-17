import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  ImageIcon,
  Loader2,
  Search,
  Link2,
  Trash2,
  ExternalLink,
  Database,
  X,
} from "lucide-react";

interface CoreImage {
  id: string;
  well_id: string | null;
  file_path: string;
  file_name: string;
  description: string | null;
  source: string;
  depth_from: number | null;
  depth_to: number | null;
  rock_type: string | null;
  formation: string | null;
  api_number: string | null;
  created_at: string;
  well_name?: string;
}

interface WellOption {
  id: string;
  well_name: string | null;
  api_number: string | null;
  county: string | null;
  state: string;
}

const ROCK_TYPES = ["Sandstone", "Limestone", "Dolomite", "Shale", "Granite", "Basalt", "Conglomerate", "Other"];

const EXTERNAL_SOURCES = [
  { label: "USGS Core Research Center", url: "https://my.usgs.gov/crcwc/query", icon: "🇺🇸" },
  { label: "BEG Texas Core Facility", url: "https://www.beg.utexas.edu/research/programs/core-research-center", icon: "🤠" },
  { label: "Kansas Geological Survey", url: "https://www.kgs.ku.edu/Magellan/CoreLibrary/index.html", icon: "🌾" },
];

export const CoreImageGallery = () => {
  const [images, setImages] = useState<CoreImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showBindDialog, setShowBindDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CoreImage | null>(null);
  const [wellSearch, setWellSearch] = useState("");
  const [wellResults, setWellResults] = useState<WellOption[]>([]);
  const [searchingWells, setSearchingWells] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({ description: "", rock_type: "", api_number: "", depth_from: "", depth_to: "" });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<CoreImage | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("core_images" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      // Enrich with well names
      const wellIds = [...new Set((data as any[]).filter((d: any) => d.well_id).map((d: any) => d.well_id))];
      let wellMap: Record<string, string> = {};
      if (wellIds.length > 0) {
        const { data: wells } = await supabase
          .from("wells")
          .select("id, well_name, api_number")
          .in("id", wellIds);
        if (wells) {
          wellMap = Object.fromEntries(wells.map((w) => [w.id, w.well_name || w.api_number || w.id.slice(0, 8)]));
        }
      }
      setImages((data as any[]).map((d: any) => ({ ...d, well_name: wellMap[d.well_id] || undefined })));
    }
    if (error) console.error("Failed to fetch core images:", error);
    setLoading(false);
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // Well search for binding
  useEffect(() => {
    if (!wellSearch.trim()) { setWellResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearchingWells(true);
      const s = `%${wellSearch.trim()}%`;
      const { data } = await supabase
        .from("wells")
        .select("id, well_name, api_number, county, state")
        .or(`well_name.ilike."${s}",api_number.ilike."${s}"`)
        .limit(20);
      setWellResults(data || []);
      setSearchingWells(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [wellSearch]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be < 10MB"); return; }
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPendingPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploadMeta({ description: "", rock_type: "", api_number: "", depth_from: "", depth_to: "" });
    setShowUploadDialog(true);
  };

  const uploadImage = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: membership } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (!membership) throw new Error("No company membership");

      // Upload file to storage
      const ext = pendingFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("core-images")
        .upload(filePath, pendingFile, { contentType: pendingFile.type });
      if (storageError) throw storageError;

      // Auto-bind by API number if provided
      let wellId: string | null = null;
      if (uploadMeta.api_number.trim()) {
        const { data: well } = await supabase
          .from("wells")
          .select("id")
          .ilike("api_number", `%${uploadMeta.api_number.trim()}%`)
          .limit(1)
          .single();
        if (well) wellId = well.id;
      }

      // Insert record
      await supabase.from("core_images" as any).insert({
        user_id: user.id,
        company_id: membership.company_id,
        well_id: wellId,
        file_path: filePath,
        file_name: pendingFile.name,
        description: uploadMeta.description || null,
        source: "upload",
        rock_type: uploadMeta.rock_type || null,
        api_number: uploadMeta.api_number || null,
        depth_from: uploadMeta.depth_from ? parseFloat(uploadMeta.depth_from) : null,
        depth_to: uploadMeta.depth_to ? parseFloat(uploadMeta.depth_to) : null,
      } as any);

      toast.success(wellId ? "Image uploaded & linked to well!" : "Image uploaded successfully!");
      setShowUploadDialog(false);
      setPendingFile(null);
      setPendingPreview(null);
      fetchImages();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const bindToWell = async (wellId: string) => {
    if (!selectedImage) return;
    const { error } = await supabase
      .from("core_images" as any)
      .update({ well_id: wellId } as any)
      .eq("id", selectedImage.id);
    if (error) { toast.error("Failed to bind"); return; }
    toast.success("Image linked to well!");
    setShowBindDialog(false);
    setSelectedImage(null);
    setWellSearch("");
    fetchImages();
  };

  const unbindFromWell = async (img: CoreImage) => {
    const { error } = await supabase
      .from("core_images" as any)
      .update({ well_id: null } as any)
      .eq("id", img.id);
    if (error) { toast.error("Failed to unbind"); return; }
    toast.success("Unlinked from well");
    fetchImages();
  };

  const deleteImage = async (img: CoreImage) => {
    await supabase.storage.from("core-images").remove([img.file_path]);
    await supabase.from("core_images" as any).delete().eq("id", img.id);
    toast.success("Image deleted");
    fetchImages();
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from("core-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Core Photos
            </CardTitle>
            <CardDescription>Upload photos from any core laboratory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="core-img-upload" />
            <label htmlFor="core-img-upload">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload core image</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP (max 10MB)</p>
              </div>
            </label>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Tip: Add API # to auto-link to well</p>
            </div>
          </CardContent>
        </Card>

        {/* External Sources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Core Repositories
            </CardTitle>
            <CardDescription>Search public core databases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXTERNAL_SOURCES.map((src) => (
              <a
                key={src.label}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
              >
                <span className="text-xl">{src.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{src.label}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Library Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold">{images.length}</p>
                <p className="text-xs text-muted-foreground">Total Images</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg text-center">
                <p className="text-2xl font-bold">{images.filter((i) => i.well_id).length}</p>
                <p className="text-xs text-muted-foreground">Linked to Wells</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold">{new Set(images.map((i) => i.rock_type).filter(Boolean)).size}</p>
                <p className="text-xs text-muted-foreground">Rock Types</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg text-center">
                <p className="text-2xl font-bold">{images.filter((i) => !i.well_id).length}</p>
                <p className="text-xs text-muted-foreground">Unlinked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Grid */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Core Image Library</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No core images yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first core sample photo above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <div key={img.id} className="group relative rounded-lg border border-border overflow-hidden bg-muted/30">
                  <img
                    src={getPublicUrl(img.file_path)}
                    alt={img.description || img.file_name}
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                  />
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-medium truncate">{img.file_name}</p>
                    {img.rock_type && <Badge variant="outline" className="text-[10px] px-1 py-0">{img.rock_type}</Badge>}
                    {img.well_name ? (
                      <div className="flex items-center gap-1">
                        <Link2 className="h-3 w-3 text-success" />
                        <span className="text-[10px] text-success truncate">{img.well_name}</span>
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                        onClick={() => { setSelectedImage(img); setShowBindDialog(true); }}
                      >
                        <Link2 className="h-3 w-3" /> Link to well
                      </button>
                    )}
                  </div>
                  {/* Actions overlay */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {img.well_id && (
                      <button onClick={() => unbindFromWell(img)} className="p-1 bg-background/80 rounded text-xs hover:bg-background" title="Unlink">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <button onClick={() => deleteImage(img)} className="p-1 bg-destructive/80 rounded text-xs hover:bg-destructive text-destructive-foreground" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Core Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingPreview && (
              <img src={pendingPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            )}
            <Input
              placeholder="Description (optional)"
              value={uploadMeta.description}
              onChange={(e) => setUploadMeta((m) => ({ ...m, description: e.target.value }))}
            />
            <Input
              placeholder="API Number (auto-links to well)"
              value={uploadMeta.api_number}
              onChange={(e) => setUploadMeta((m) => ({ ...m, api_number: e.target.value }))}
            />
            <Select value={uploadMeta.rock_type} onValueChange={(v) => setUploadMeta((m) => ({ ...m, rock_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Rock Type (optional)" /></SelectTrigger>
              <SelectContent>
                {ROCK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Depth from (ft)"
                type="number"
                value={uploadMeta.depth_from}
                onChange={(e) => setUploadMeta((m) => ({ ...m, depth_from: e.target.value }))}
              />
              <Input
                placeholder="Depth to (ft)"
                type="number"
                value={uploadMeta.depth_to}
                onChange={(e) => setUploadMeta((m) => ({ ...m, depth_to: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={uploadImage} disabled={uploading}>
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bind to Well Dialog */}
      <Dialog open={showBindDialog} onOpenChange={setShowBindDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Well</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search by well name or API #..."
              value={wellSearch}
              onChange={(e) => setWellSearch(e.target.value)}
              autoFocus
            />
            <ScrollArea className="max-h-64">
              {searchingWells ? (
                <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
              ) : wellResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {wellSearch.trim() ? "No wells found" : "Type to search"}
                </p>
              ) : (
                wellResults.map((w) => (
                  <button
                    key={w.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors rounded"
                    onClick={() => bindToWell(w.id)}
                  >
                    <span className="font-medium">{w.well_name || w.api_number || w.id.slice(0, 8)}</span>
                    <span className="text-muted-foreground"> — {w.county}, {w.state}</span>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.file_name}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <img src={getPublicUrl(previewImage.file_path)} alt={previewImage.file_name} className="w-full max-h-[60vh] object-contain rounded-lg" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {previewImage.rock_type && <div><span className="text-muted-foreground">Rock Type:</span> <span className="font-medium">{previewImage.rock_type}</span></div>}
                {previewImage.formation && <div><span className="text-muted-foreground">Formation:</span> <span className="font-medium">{previewImage.formation}</span></div>}
                {previewImage.api_number && <div><span className="text-muted-foreground">API #:</span> <span className="font-medium">{previewImage.api_number}</span></div>}
                {previewImage.depth_from != null && <div><span className="text-muted-foreground">Depth:</span> <span className="font-medium">{previewImage.depth_from}–{previewImage.depth_to} ft</span></div>}
                {previewImage.well_name && <div><span className="text-muted-foreground">Well:</span> <span className="font-medium text-success">{previewImage.well_name}</span></div>}
                <div><span className="text-muted-foreground">Source:</span> <span className="font-medium">{previewImage.source}</span></div>
              </div>
              {previewImage.description && <p className="text-sm">{previewImage.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
