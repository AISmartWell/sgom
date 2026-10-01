import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { sptScreening, wellVerdictLabel, type SptVerdict } from "@/lib/spt-sandbox-verdict";

type Well = {
  id: string; company_id: string; well_name: string | null; api_number: string | null; state: string;
  well_type: string | null; total_depth: number | null; water_cut: number | null;
  production_oil: number | null; production_gas: number | null;
};
type Review = { well_id: string; decision: string; final_verdict: string; notes: string | null; reviewed_at: string };

const VALIDATED_STATES = ["OK", "OKLAHOMA", "KS", "KANSAS"];

// Automatic risk filters: any flag => result is "preliminary" and needs a geophysicist.
function riskFlags(w: Well, r: ReturnType<typeof sptScreening>): string[] {
  const f: string[] = [];
  if (r.confidence === "low") f.push("Low confidence");
  if (r.missing_data.length) f.push(`Missing: ${r.missing_data.join(", ")}`);
  if (r.verdict === "conditional") f.push("Conditional verdict");
  if (!VALIDATED_STATES.includes((w.state || "").toUpperCase())) f.push("Outside validated basins");
  if (w.water_cut != null && (w.water_cut < 0 || w.water_cut > 100)) f.push("Anomalous water cut");
  if (w.total_depth != null && w.total_depth <= 0) f.push("Anomalous depth");
  return f;
}

const PreliminaryVerdicts = () => {
  const { toast } = useToast();
  const [wells, setWells] = useState<Well[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"pending" | "reviewed" | "all">("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [finalV, setFinalV] = useState<SptVerdict>("candidate");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [w, r] = await Promise.all([
      supabase.from("wells").select("id, company_id, well_name, api_number, state, well_type, total_depth, water_cut, production_oil, production_gas").order("well_name").limit(2000),
      supabase.from("verdict_reviews").select("well_id, decision, final_verdict, notes, reviewed_at"),
    ]);
    setWells((w.data as Well[]) ?? []);
    const map: Record<string, Review> = {};
    ((r.data as Review[]) ?? []).forEach((x) => (map[x.well_id] = x));
    setReviews(map);
  };
  useEffect(() => { load(); }, []);

  const prelim = useMemo(() => wells
    .map((w) => { const r = sptScreening(w); return { w, r, flags: riskFlags(w, r) }; })
    .filter((x) => x.flags.length > 0), [wells]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return prelim
      .filter((x) => show === "all" || (show === "pending" ? !reviews[x.w.id] : !!reviews[x.w.id]))
      .filter((x) => !s || (x.w.well_name ?? "").toLowerCase().includes(s) || (x.w.api_number ?? "").includes(s))
      .slice(0, 300);
  }, [prelim, reviews, q, show]);

  const stats = useMemo(() => {
    const rs = Object.values(reviews);
    return {
      pending: prelim.filter((x) => !reviews[x.w.id]).length,
      approved: rs.filter((r) => r.decision === "approved").length,
      corrected: rs.filter((r) => r.decision === "corrected").length,
      rejected: rs.filter((r) => r.decision === "rejected").length,
    };
  }, [prelim, reviews]);

  const open = (id: string, v: SptVerdict) => {
    setOpenId(openId === id ? null : id);
    setFinalV((reviews[id]?.final_verdict as SptVerdict) ?? v);
    setNotes(reviews[id]?.notes ?? "");
  };

  const save = async (w: Well, original: SptVerdict, decision: "approved" | "corrected" | "rejected") => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const final = decision === "approved" ? original : decision === "rejected" ? "not_recommended" : finalV;
    const { error } = await supabase.from("verdict_reviews").upsert({
      well_id: w.id, company_id: w.company_id, original_verdict: original, decision,
      final_verdict: final, notes: notes || null, reviewer_id: u.user!.id, reviewed_at: new Date().toISOString(),
    }, { onConflict: "well_id" });
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Verdict ${decision}`, description: w.well_name ?? w.api_number ?? "" });
    setOpenId(null);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <Badge variant="outline" className="mb-2">Stage 6 · Expert review</Badge>
        <h1 className="text-3xl font-bold">Preliminary Verdicts</h1>
        <p className="text-muted-foreground mt-1">
          Verdicts flagged by automatic risk filters (low confidence, missing data, anomalies, outside validated basins). A geophysicist approves, corrects or rejects each one; reviewed results become expert-verified.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["Pending review", stats.pending], ["Approved", stats.approved], ["Corrected", stats.corrected], ["Rejected", stats.rejected]].map(([l, n]) => (
          <Card key={l as string}><CardContent className="pt-6"><div className="text-sm text-muted-foreground">{l}</div><div className="text-2xl font-bold">{n}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Review queue</CardTitle>
          <div className="flex gap-2">
            <Select value={show} onValueChange={(v) => setShow(v as typeof show)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Search well or API…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Well</TableHead><TableHead>State</TableHead><TableHead>AI verdict</TableHead>
                <TableHead>Risk flags</TableHead><TableHead>Status</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ w, r, flags }) => {
                const rev = reviews[w.id];
                return (
                  <>
                    <TableRow key={w.id}>
                      <TableCell><div className="font-medium">{w.well_name ?? "—"}</div><div className="text-xs text-muted-foreground">{w.api_number}</div></TableCell>
                      <TableCell>{w.state}</TableCell>
                      <TableCell>{wellVerdictLabel(r.verdict)}<div className="text-xs text-muted-foreground">confidence: {r.confidence}</div></TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{flags.map((f) => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}</div></TableCell>
                      <TableCell>
                        {rev ? <Badge>expert_verified · {rev.decision}</Badge> : <Badge variant="secondary">preliminary</Badge>}
                        {rev && <div className="text-xs text-muted-foreground mt-1">→ {wellVerdictLabel(rev.final_verdict as SptVerdict)}</div>}
                      </TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => open(w.id, r.verdict)}>{rev ? "Edit" : "Review"}</Button></TableCell>
                    </TableRow>
                    {openId === w.id && (
                      <TableRow key={w.id + "-r"}>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="text-sm space-y-1">
                              {r.factors_for.map((f) => <div key={f}>+ {f}</div>)}
                              {r.risks.map((f) => <div key={f} className="text-destructive">− {f}</div>)}
                              {r.missing_data.length > 0 && <div className="text-muted-foreground">Missing data: {r.missing_data.join(", ")}</div>}
                            </div>
                            <div className="space-y-2">
                              <Select value={finalV} onValueChange={(v) => setFinalV(v as SptVerdict)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="candidate">SPT candidate</SelectItem>
                                  <SelectItem value="conditional">Conditional SPT candidate</SelectItem>
                                  <SelectItem value="not_recommended">Not recommended</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea placeholder="Geophysicist notes (reason for correction, log observations…)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                              <div className="flex gap-2">
                                <Button size="sm" disabled={saving} onClick={() => save(w, r.verdict, "approved")}>Approve AI verdict</Button>
                                <Button size="sm" variant="secondary" disabled={saving || finalV === r.verdict} onClick={() => save(w, r.verdict, "corrected")}>Save correction</Button>
                                <Button size="sm" variant="destructive" disabled={saving} onClick={() => save(w, r.verdict, "rejected")}>Reject</Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nothing in this view.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreliminaryVerdicts;
