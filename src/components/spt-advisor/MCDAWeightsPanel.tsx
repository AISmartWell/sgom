import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sliders, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Well = {
  id: string;
  well_name: string;
  formation: string | null;
  total_depth: number | null;
  production_oil: number | null;
  water_cut: number | null;
  status: string | null;
  company_id: string | null;
};

type Weights = {
  waterCut: number;
  production: number;
  formation: number;
  depth: number;
  status: number;
};

const DEFAULT_WEIGHTS: Weights = {
  waterCut: 30,
  production: 25,
  formation: 20,
  depth: 10,
  status: 15,
};

const KEYS: (keyof Weights)[] = ["waterCut", "production", "formation", "depth", "status"];
const LABELS: Record<keyof Weights, string> = {
  waterCut: "Water cut",
  production: "Production",
  formation: "Formation",
  depth: "Depth",
  status: "Status",
};

function subScores(w: Well) {
  const wc = w.water_cut ?? 50;
  const prod = w.production_oil ?? 0;
  const depth = w.total_depth ?? 5000;
  const formation = (w.formation ?? "").toLowerCase();
  return {
    waterCut: wc >= 20 && wc <= 60 ? 1 - Math.abs(wc - 40) / 40 : Math.max(0, 1 - Math.abs(wc - 40) / 60),
    production: Math.min(1, prod / 100),
    formation: /sand|carbonate|lime|dolomite/.test(formation) ? 1 : 0.4,
    depth: depth >= 2000 && depth <= 10000 ? 1 : 0.6,
    status: (w.status ?? "").toLowerCase().includes("active") ? 1 : 0.5,
  };
}

export default function MCDAWeightsPanel() {
  const [wells, setWells] = useState<Well[]>([]);
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  const total = KEYS.reduce((s, k) => s + weights[k], 0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: uc } = await supabase
          .from("user_companies")
          .select("company_id")
          .eq("user_id", user?.id ?? "")
          .limit(1)
          .maybeSingle();
        let q = supabase
          .from("wells")
          .select("id,well_name,formation,total_depth,production_oil,water_cut,status,company_id")
          .order("production_oil", { ascending: false, nullsFirst: false })
          .limit(200);
        if (uc?.company_id) q = q.eq("company_id", uc.company_id);
        const { data, error } = await q;
        if (error) throw error;
        setWells((data ?? []) as Well[]);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ranked = useMemo(() => {
    const norm = total > 0 ? total : 1;
    return wells
      .map((w) => {
        const s = subScores(w);
        const composite =
          (s.waterCut * weights.waterCut +
            s.production * weights.production +
            s.formation * weights.formation +
            s.depth * weights.depth +
            s.status * weights.status) /
          norm;
        return { well: w, score: Math.round(composite * 100), sub: s };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [wells, weights, total]);

  const setW = (k: keyof Weights, v: number) => setWeights((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" /> MCDA weights playground
            <Badge variant="outline">live recompute</Badge>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Adjust criterion weights and see the SPT ranking recompute instantly across{" "}
          <span className="font-mono">{wells.length}</span> wells. Weights are auto-normalized (sum = {total}).
        </p>

        <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
          {KEYS.map((k) => (
            <div key={k} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{LABELS[k]}</span>
                <span className="font-mono">
                  {weights[k]} · {total > 0 ? Math.round((weights[k] / total) * 100) : 0}%
                </span>
              </div>
              <Slider
                value={[weights[k]]}
                onValueChange={(v) => setW(k, v[0])}
                min={0}
                max={60}
                step={1}
              />
            </div>
          ))}
        </div>

        <div className="border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_60px_60px_60px_60px_60px] text-[10px] uppercase text-muted-foreground bg-muted/40 px-3 py-2">
            <div>Well</div>
            <div className="text-right">WC</div>
            <div className="text-right">Prod</div>
            <div className="text-right">Form</div>
            <div className="text-right">Depth</div>
            <div className="text-right">Status</div>
            <div className="text-right font-semibold text-primary">Score</div>
          </div>
          {loading && (
            <div className="p-4 flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading wells…
            </div>
          )}
          {!loading && ranked.length === 0 && (
            <div className="p-4 text-xs text-muted-foreground text-center">No wells found.</div>
          )}
          {ranked.map((r, i) => (
            <div
              key={r.well.id}
              className="grid grid-cols-[1fr_60px_60px_60px_60px_60px_60px] px-3 py-2 text-xs border-t border-border/60 items-center hover:bg-muted/20"
            >
              <div className="truncate">
                <span className="text-muted-foreground mr-2">#{i + 1}</span>
                {r.well.well_name}
              </div>
              <div className="text-right font-mono">{Math.round(r.sub.waterCut * 100)}</div>
              <div className="text-right font-mono">{Math.round(r.sub.production * 100)}</div>
              <div className="text-right font-mono">{Math.round(r.sub.formation * 100)}</div>
              <div className="text-right font-mono">{Math.round(r.sub.depth * 100)}</div>
              <div className="text-right font-mono">{Math.round(r.sub.status * 100)}</div>
              <div className="text-right font-bold text-primary">{r.score}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
