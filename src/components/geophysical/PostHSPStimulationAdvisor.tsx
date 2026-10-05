import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Droplets, Hammer, Waves, Zap, FlaskConical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isInjectionWell, haversineMiles } from "@/lib/spt-interval-conditions";
import type { InterpretationSummary } from "@/lib/petrophysics";

/**
 * Post-HSP stimulation advisor — translates the Maxxwell Production 2011–2016
 * decision slides (cement sheath problems, additional stimulation ladder,
 * injector re-completion) into rule-based hints driven by the selected well's
 * real data. All dollar figures and uplift ranges are reference minimums from
 * those slides, not a quote.
 */

interface WellFacts {
  water_cut: number | null;
  production_oil: number | null;
  status: string | null;
  well_type: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface InjectorNear {
  name: string;
  distanceMi: number;
}

const fmt$ = (n: number) => `$${n.toLocaleString("en-US")}`;

const PostHSPStimulationAdvisor = ({
  wellId,
  interpretation,
}: {
  wellId: string;
  interpretation: InterpretationSummary | null;
}) => {
  const [facts, setFacts] = useState<WellFacts | null>(null);
  const [injectors, setInjectors] = useState<InjectorNear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: well } = await supabase
        .from("wells")
        .select("water_cut, production_oil, status, well_type, latitude, longitude, company_id")
        .eq("id", wellId)
        .maybeSingle();
      if (cancelled) return;
      if (!well) { setLoading(false); return; }
      setFacts(well);

      if (well.latitude != null && well.longitude != null && well.company_id) {
        const { data: others } = await supabase
          .from("wells")
          .select("well_name, api_number, well_type, latitude, longitude")
          .eq("company_id", well.company_id)
          .neq("id", wellId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(1000);
        if (cancelled) return;
        const found = (others ?? [])
          .filter((w) => isInjectionWell(w.well_type))
          .map((w) => ({
            name: w.well_name || w.api_number || "Unnamed",
            distanceMi: haversineMiles(well.latitude!, well.longitude!, w.latitude!, w.longitude!),
          }))
          .filter((w) => w.distanceMi <= 25)
          .sort((a, b) => a.distanceMi - b.distanceMi)
          .slice(0, 5);
        setInjectors(found);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [wellId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stimulation advisor…
        </CardContent>
      </Card>
    );
  }
  if (!facts) return null;

  const waterCut = facts.water_cut;
  const highWaterCut = waterCut != null && waterCut > 70;
  const oilDominant = interpretation?.dominantFluid === "oil";
  const hasPay = (interpretation?.netPay ?? 0) > 0;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge variant="outline" className="text-[10px]">Post-HSP Advisor</Badge>
          <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
            Reference figures — Maxxwell 2011–2016 slides, minimum estimates, not a quote
          </Badge>
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
          <Hammer className="h-5 w-5 text-primary" />
          Additional stimulation after HSP — what the analysis suggests
        </CardTitle>
        <CardDescription>
          Rule-based hints from the well's own data (water cut, interpreted pay, nearby injectors).
          Final decision and work program belong to the service company engineer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 1. Cement sheath / water flooding problem (slide 48) */}
        <div className={`rounded-lg border p-4 space-y-2 ${highWaterCut ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <Droplets className={`h-4 w-4 ${highWaterCut ? "text-destructive" : "text-muted-foreground"}`} />
            <p className="text-sm font-semibold">Cement ring condition &amp; water flooding risk</p>
            {waterCut == null ? (
              <Badge variant="outline" className="text-[10px]">No water cut data — to confirm</Badge>
            ) : highWaterCut ? (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                <AlertTriangle className="h-3 w-3 mr-1" /> Water cut {waterCut.toFixed(0)}% — risk active
              </Badge>
            ) : (
              <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                Water cut {waterCut.toFixed(0)}% — below 70% threshold
              </Badge>
            )}
          </div>
          {highWaterCut && (
            <>
              <div className="grid gap-1.5 text-xs text-muted-foreground md:grid-cols-2">
                <p><span className="font-semibold text-foreground">Cause:</span> bad cement composition, or cement cracked from long exploitation, cumulative perforation and subsequent hydraulic fracturing.</p>
                <p><span className="font-semibold text-foreground">Affect:</span> cracks and micro cracks form capillary water movement from water reservoirs to the productive layer — very rapid water flooding of the producing formation.</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="text-[10px]">Repair cement sheath — {fmt$(11250)}</Badge>
                <Badge variant="secondary" className="text-[10px]">Isolate watered interval (packers / cementation) — {fmt$(12375)}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Recommended before any stimulation: treat the water source first, then stimulate the productive interval.
              </p>
            </>
          )}
        </div>

        {/* 2. Stimulation ladder (slide 49) */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Stimulation ladder (minimum uplift, bbl/day)</p>
            {!interpretation && <Badge variant="outline" className="text-[10px]">No log interpretation — generic sequence</Badge>}
            {interpretation && !oilDominant && (
              <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                Dominant fluid: {interpretation.dominantFluid} — verify saturation before treatment
              </Badge>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              {
                icon: Hammer,
                name: "HSP re-completion (base)",
                before: "5–10", after: "30–40", cost: null as number | null,
                note: "Opens the whole productive zone, unloads stress near the wellbore, improves permeability and porosity. Lasting effect 10–15 years.",
                show: true,
              },
              {
                icon: FlaskConical,
                name: "Acid chemical treatment",
                before: "30–40", after: "40–45", cost: 3570,
                note: "5,000 gallon acetic acid job. Most effective in carbonate / low-permeability rock.",
                show: true,
              },
              {
                icon: Zap,
                name: "Pulsed electric hydraulic shocks",
                before: "40–45", after: "50–60", cost: 20730,
                note: "Performed after complete HSP and flushing. Forms more micro cracks, increases hydrodynamic contact area. Statistics: +30% inflow.",
                show: true,
              },
              {
                icon: Waves,
                name: "Gentle hydraulic fracturing (4000 psi)",
                before: "50–60", after: "75–80", cost: 40095,
                note: "HSP sets a good geometry for subsequent fracturing. Statistics: +60% inflow.",
                show: true,
              },
            ].filter(s => s.show).map((s) => (
              <div key={s.name} className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <s.icon className="h-3.5 w-3.5 text-primary" /> {s.name}
                  </p>
                  {s.cost != null && <span className="text-xs font-mono text-muted-foreground">{fmt$(s.cost)}</span>}
                </div>
                <p className="text-sm">
                  <span className="font-mono">{s.before}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-mono font-semibold text-success">{s.after}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">bbl/day</span>
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{s.note}</p>
              </div>
            ))}
          </div>
          {interpretation && hasPay && oilDominant && (
            <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
              <CheckCircle2 className="h-3 w-3 mt-0.5 text-success shrink-0" />
              This well has {interpretation.netPay} ft of net pay with dominant oil — the base HSP scenario applies. Additional steps are sequential: each "before" assumes the previous step was done.
            </p>
          )}
        </div>

        {/* 3. Injector re-completion (slide 47) */}
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Waves className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Nearby injector re-completion with HSP</p>
            {injectors.length > 0 ? (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                {injectors.length} injector{injectors.length > 1 ? "s" : ""} within 25 mi
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">No injectors found nearby in company records</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Restoring an injection well raises formation pressure and pushes oil toward producers:
            injection wells increase productive inflow in nearby oil wells up to 20%; usually 3–4 low-productivity
            oil wells use one injection well. Injector HSP re-completion reference cost: {fmt$(134602)}.
          </p>
          {injectors.length > 0 && (
            <ul className="text-xs space-y-1">
              {injectors.map((inj) => (
                <li key={inj.name} className="flex items-center justify-between gap-3">
                  <span className="font-medium">{inj.name}</span>
                  <span className="font-mono text-muted-foreground">{inj.distanceMi.toFixed(1)} mi</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostHSPStimulationAdvisor;
