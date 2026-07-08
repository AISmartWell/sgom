import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Upload, Search, Trash2, Download, Eye, FolderArchive, Tag, Image as ImageIcon, Scan } from "lucide-react";
import sampleThumbCompletion from "@/assets/sample-doc-completion-1978.jpg";
import sampleThumbWellLog from "@/assets/sample-doc-welllog-1982.jpg";
import sampleThumbCore from "@/assets/sample-doc-core-1979.jpg";
import sampleThumbProduction from "@/assets/sample-doc-production-1985.jpg";

type WellDoc = {
  id: string;
  company_id: string;
  well_id: string | null;
  title: string;
  description: string | null;
  doc_type: string;
  tags: string[];
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  notes: string | null;
  uploaded_by: string;
  created_at: string;
};

type Well = { id: string; well_name: string | null; api_number: string | null };

const DOC_TYPES = [
  { value: "well_log", label: "Well Log (scan)" },
  { value: "completion_report", label: "Completion Report" },
  { value: "core_report", label: "Core / Lab Report" },
  { value: "production_report", label: "Production Report" },
  { value: "geology_map", label: "Geology Map" },
  { value: "permit", label: "Permit / Regulatory" },
  { value: "other", label: "Other" },
];

const BUCKET = "well-documents";

export default function DocumentVault() {
  const [docs, setDocs] = useState<WellDoc[]>([]);
  const [wells, setWells] = useState<Well[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterWell, setFilterWell] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<{ doc: WellDoc; url: string } | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // upload form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("other");
  const [tagsInput, setTagsInput] = useState("");
  const [wellId, setWellId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", u.user.id).limit(1).maybeSingle();
      if (uc?.company_id) setCompanyId(uc.company_id);
    })();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    load();
    loadWells();
  }, [companyId]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("well_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data as WellDoc[]) || []);
    setLoading(false);
  }

  async function loadWells() {
    const { data } = await supabase.from("wells").select("id, well_name, api_number").order("well_name");
    setWells((data as Well[]) || []);
  }

  async function handleUpload() {
    if (!file || !title.trim() || !companyId || !userId) {
      toast.error("File and title are required");
      return;
    }
    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${companyId}/${Date.now()}_${cleanName}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const { error: insErr } = await supabase.from("well_documents").insert({
        company_id: companyId,
        well_id: wellId === "none" ? null : wellId,
        title: title.trim(),
        description: description.trim() || null,
        doc_type: docType,
        tags,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        notes: notes.trim() || null,
        uploaded_by: userId,
      });
      if (insErr) throw insErr;

      toast.success("Document uploaded");
      setFile(null); setTitle(""); setDescription(""); setDocType("other");
      setTagsInput(""); setWellId("none"); setNotes("");
      setUploadOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openDoc(doc: WellDoc) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 3600);
    if (error || !data) return toast.error(error?.message || "Cannot open file");
    setViewDoc({ doc, url: data.signedUrl });
  }

  async function downloadDoc(doc: WellDoc) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 300, { download: doc.file_name });
    if (error || !data) return toast.error(error?.message || "Cannot download");
    window.open(data.signedUrl, "_blank");
  }

  async function deleteDoc(doc: WellDoc) {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error } = await supabase.from("well_documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return docs.filter((d) => {
      if (filterType !== "all" && d.doc_type !== filterType) return false;
      if (filterWell !== "all" && d.well_id !== filterWell) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q) ||
        (d.notes || "").toLowerCase().includes(q) ||
        d.file_name.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [docs, search, filterType, filterWell]);

  const wellLabel = (id: string | null) => {
    if (!id) return "—";
    const w = wells.find((x) => x.id === id);
    return w ? `${w.well_name || "Well"}${w.api_number ? ` · ${w.api_number}` : ""}` : "—";
  };

  const isPdf = (m?: string | null) => (m || "").includes("pdf");
  const isImage = (m?: string | null) => (m || "").startsWith("image/");

  const SAMPLE_DOCS = [
    {
      file: "sample-completion-report-1978.pdf",
      thumb: sampleThumbCompletion,
      title: "1978 Brawner 10-15 Completion Report",
      description: "Legacy completion report retyped from original field ticket. Scanned as-is, no OCR.",
      doc_type: "completion_report",
      tags: ["sample", "legacy", "mississippian", "1978"],
      badge: "Completion Report",
      basin: "Kansas · 1978",
      features: "Perforations, Depth",
    },
    {
      file: "sample-well-log-1982.pdf",
      thumb: sampleThumbWellLog,
      title: "1982 Brawner 10-15 Gamma Ray / Resistivity Log",
      description: "Paper well log strip-chart with GR, SP, Resistivity and Caliper curves over 4,200–4,900 ft.",
      doc_type: "well_log",
      tags: ["sample", "well log", "gamma ray", "resistivity", "1982"],
      badge: "Well Log (scan)",
      basin: "Kansas · 1982",
      features: "GR, SP, Resistivity",
    },
    {
      file: "sample-core-report-1979.pdf",
      thumb: sampleThumbCore,
      title: "1979 Brawner 10-15 Core Analysis Report",
      description: "Core Labs report — porosity, permeability, Sw/So across the Mississippian Chat pay.",
      doc_type: "core_report",
      tags: ["sample", "core", "porosity", "permeability", "1979"],
      badge: "Core / Lab Report",
      basin: "Tulsa OK · 1979",
      features: "Porosity, Permeability",
    },
    {
      file: "sample-production-report-1985.pdf",
      thumb: sampleThumbProduction,
      title: "Jan 1985 Brawner 10-15 Monthly Production",
      description: "Monthly production ticket — daily oil, gas, water, hours and remarks.",
      doc_type: "production_report",
      tags: ["sample", "production", "monthly", "1985"],
      badge: "Production Report",
      basin: "Haskell Field · 1985",
      features: "BOPD, Water Cut",
    },
  ];

  async function loadSample(sample: typeof SAMPLE_DOCS[number]) {
    if (!companyId || !userId) {
      toast.error("No company context");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`/samples/${sample.file}`);
      if (!res.ok) throw new Error("Sample file not found");
      const blob = await res.blob();
      const path = `${companyId}/${Date.now()}_${sample.file}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
        upsert: false,
        contentType: "application/pdf",
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("well_documents").insert({
        company_id: companyId,
        well_id: null,
        title: `${sample.title} (Sample)`,
        description: sample.description,
        doc_type: sample.doc_type,
        tags: sample.tags,
        storage_path: path,
        file_name: sample.file,
        mime_type: "application/pdf",
        file_size: blob.size,
        notes: "Demo document loaded from the built-in Sample Document Gallery. Delete any time.",
        uploaded_by: userId,
      });
      if (insErr) throw insErr;
      toast.success(`Added: ${sample.title}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to load sample");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-primary/30">Vault</Badge>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderArchive className="w-8 h-8 text-primary" />
              Document Vault
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Upload scanned old-format documents (PDF, images, DOC) as-is — no OCR required.
            Organize by well, type, and tags. View, download, and annotate later.
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button className="gap-2"><Upload className="w-4 h-4" /> Upload document</Button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>File *</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.name} · {(file.size / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 1978 Brawner 10-15 Completion Report" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Well (optional)</Label>
                  <Select value={wellId} onValueChange={setWellId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— none —</SelectItem>
                      {wells.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.well_name || "Well"} {w.api_number ? `· ${w.api_number}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary" />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="mississippian, legacy, scan" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any manual notes about this document" />
              </div>
              <Button className="w-full" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title, tags, notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterWell} onValueChange={setFilterWell}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Well" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All wells</SelectItem>
              {wells.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.well_name || "Well"} {w.api_number ? `· ${w.api_number}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-primary" /> Sample Document Gallery
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Click a pre-loaded legacy document to add it to your Vault instantly — no OCR, stored as scanned.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SAMPLE_DOCS.map((s) => (
              <button
                key={s.file}
                onClick={() => loadSample(s)}
                disabled={uploading}
                className="text-left rounded-lg border border-border bg-card/60 hover:border-primary/50 hover:bg-card transition-colors p-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.era}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{s.description}</p>
                <Badge variant="outline" className="text-[10px]">{s.badge}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FolderArchive className="w-12 h-12 mx-auto mb-3 opacity-50" />
          No documents yet. Upload your first scanned report or archive.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <Card key={d.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="line-clamp-2">{d.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {DOC_TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {d.description && <p className="text-muted-foreground line-clamp-2">{d.description}</p>}
                <div className="text-xs text-muted-foreground">
                  <div>Well: {wellLabel(d.well_id)}</div>
                  <div>File: {d.file_name}{d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ""}</div>
                  <div>Added: {new Date(d.created_at).toLocaleDateString()}</div>
                </div>
                {d.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {d.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]"><Tag className="w-2.5 h-2.5 mr-1" />{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openDoc(d)} className="gap-1">
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadDoc(d)} className="gap-1">
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  {d.uploaded_by === userId && (
                    <Button size="sm" variant="ghost" onClick={() => deleteDoc(d)} className="text-destructive ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>{viewDoc?.doc.title}</DialogTitle></DialogHeader>
          {viewDoc && (
            <div className="flex-1 min-h-0 overflow-hidden rounded border border-border bg-muted/20">
              {isPdf(viewDoc.doc.mime_type) ? (
                <iframe src={viewDoc.url} className="w-full h-full" title={viewDoc.doc.title} />
              ) : isImage(viewDoc.doc.mime_type) ? (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                  <img src={viewDoc.url} alt={viewDoc.doc.title} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Inline preview not supported for this file type.</p>
                  <Button className="mt-4" onClick={() => downloadDoc(viewDoc.doc)}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              )}
            </div>
          )}
          {viewDoc?.doc.notes && (
            <div className="text-sm bg-muted/40 p-3 rounded border border-border">
              <div className="font-medium mb-1">Notes</div>
              <p className="text-muted-foreground whitespace-pre-wrap">{viewDoc.doc.notes}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
