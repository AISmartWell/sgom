import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Loader2, Trash2, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TrainingRow = {
  id: string;
  label: string;
  doc_type: string;
  curve_hints: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  verified: any;
};

interface Props {
  result: any | null;
  fileName?: string;
  docType?: string;
}

/**
 * Operator-verified scans become calibration examples for the OCR agent.
 * The recognition function loads the latest active examples and uses them
 * as few-shot ground truth for real curve labels, scales and formation names.
 */
export function OCRTrainingPanel({ result, fileName, docType = "well_log" }: Props) {
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [hints, setHints] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ocr_training_examples")
      .select("id,label,doc_type,curve_hints,notes,is_active,created_at,verified")
      .order("created_at", { ascending: false })
      .limit(30);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as TrainingRow[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (result && !label) {
      setLabel(result.well_name || result.document_title || fileName || "Verified scan");
      setHints((result.logged_curves ?? []).join(", "));
    }
  }, [result, fileName, label]);

  const teach = async () => {
    if (!result) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      toast.error("Sign in to add verified examples");
      return;
    }
    setSaving(true);
    const verified = {
      well_name: result.well_name ?? null,
      api_number: result.api_number ?? null,
      operator: result.operator ?? null,
      service_company: result.service_company ?? null,
      field: result.field ?? null,
      county: result.county ?? null,
      state: result.state ?? null,
      log_date: result.log_date ?? null,
      depth_range_ft: result.depth_range_ft ?? null,
      logged_curves: result.logged_curves ?? [],
      curve_tracks: (result.curve_tracks ?? []).slice(0, 8),
      formation_tops: (result.formation_tops ?? []).slice(0, 20),
      perforations: (result.perforations ?? []).slice(0, 20),
      log_readings_sample: (result.log_readings ?? []).slice(0, 8),
    };
    const { error } = await supabase.from("ocr_training_examples").insert({
      label: label || fileName || "Verified scan",
      doc_type: docType,
      verified,
      curve_hints: hints.split(",").map((h) => h.trim()).filter(Boolean),
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Added to the OCR agent training set");
    setNotes("");
    load();
  };

  const toggle = async (row: TrainingRow) => {
    const { error } = await supabase
      .from("ocr_training_examples")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (row: TrainingRow) => {
    const { error } = await supabase.from("ocr_training_examples").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <Card className="p-5 space-y-4 border-primary/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Agent training set
        </h3>
        <Badge variant="outline" className="font-mono text-[10px]">
          {activeCount} active / {rows.length} total
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Verify an extraction, then add it here. The OCR agent loads the latest active examples as
        ground truth on every run, so it learns your real curve labels, scales, vintages and
        formation naming instead of relying on generic samples.
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Example label (well / vintage)"
        />
        <Input
          value={hints}
          onChange={(e) => setHints(e.target.value)}
          placeholder="Curve conventions, e.g. GR 0-150 API, RES 0.2-2000 ohm-m"
        />
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reviewer notes: what the model got wrong and what the correct reading is"
        rows={2}
      />
      <Button onClick={teach} disabled={!result || saving} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
        Teach agent on this verified scan
      </Button>
      {!result && (
        <p className="text-[11px] text-muted-foreground italic">
          Run a recognition first, correct the fields above, then add it to the training set.
        </p>
      )}

      <div className="space-y-2">
        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-xs text-muted-foreground italic">No verified examples yet.</div>
        )}
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm truncate">{row.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                {row.doc_type} · {new Date(row.created_at).toLocaleDateString()} ·{" "}
                {row.curve_hints?.length ? row.curve_hints.join(", ") : "no curve hints"}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant={row.is_active ? "default" : "outline"} className="text-[10px]">
                {row.is_active ? "active" : "paused"}
              </Badge>
              <Button size="icon" variant="ghost" onClick={() => toggle(row)}>
                <Power className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(row)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default OCRTrainingPanel;
