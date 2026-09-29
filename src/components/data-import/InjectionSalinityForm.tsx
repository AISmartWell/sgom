import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Upload } from "lucide-react";
import { toast } from "sonner";

export const WATERFLOOD_STORAGE_KEY = "sgom.waterflood.inputs";

/** Arps/Bateman-Konen: NaCl-equivalent TDS (ppm) + temperature (°F) -> Rw (Ohm-m). */
export function tdsToRw(ppm: number, tempF: number): number | null {
  if (!(ppm > 0) || !(tempF > 0)) return null;
  const rw75 = 0.0123 + 3647.5 / Math.pow(ppm, 0.955);
  return rw75 * (75 + 6.77) / (tempF + 6.77);
}

export function InjectionSalinityForm() {
  const [fTds, setFTds] = useState("");
  const [iTds, setITds] = useState("");
  const [temp, setTemp] = useState("");
  const [injected, setInjected] = useState("");
  const [produced, setProduced] = useState("");

  const rwF = tdsToRw(parseFloat(fTds), parseFloat(temp));
  const rwI = tdsToRw(parseFloat(iTds), parseFloat(temp));
  const share = useMemo(() => {
    const inj = parseFloat(injected), prod = parseFloat(produced);
    if (!(inj > 0) || !(prod > 0)) return null;
    return Math.min(100, (inj / prod) * 100);
  }, [injected, produced]);

  const save = () => {
    if (rwF == null) { toast.error("Enter formation TDS and reservoir temperature"); return; }
    localStorage.setItem(WATERFLOOD_STORAGE_KEY, JSON.stringify({
      rwFormation: rwF.toFixed(4),
      rwInjection: rwI != null ? rwI.toFixed(4) : "",
      injShare: share != null ? share.toFixed(1) : "0",
    }));
    toast.success("Saved. Stage 8 Waterflood correction will use these values.");
  };

  const field = (id: string, label: string, v: string, set: (s: string) => void, ph: string) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="number" min={0} placeholder={ph} value={v} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Droplets className="h-4 w-4 text-primary" />Injection &amp; Water Salinity</CardTitle>
        <CardDescription>Client water analyses and injection volumes. Salinity is converted to Rw (Arps, NaCl-equivalent) and passed to the Stage 8 waterflood correction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {field("f-tds", "Formation water TDS (ppm)", fTds, setFTds, "e.g. 120000")}
          {field("i-tds", "Injected water TDS (ppm)", iTds, setITds, "e.g. 20000")}
          {field("t-res", "Reservoir temperature (°F)", temp, setTemp, "e.g. 140")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("inj", "Cumulative water injected (bbl)", injected, setInjected, "offset injectors")}
          {field("prod", "Cumulative liquid produced (bbl)", produced, setProduced, "oil + water")}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">Rw formation: {rwF != null ? `${rwF.toFixed(3)} Ω·m` : "—"}</Badge>
          <Badge variant="outline">Rw injected: {rwI != null ? `${rwI.toFixed(3)} Ω·m` : "—"}</Badge>
          <Badge variant="outline">Injection share: {share != null ? `${share.toFixed(1)}%` : "—"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Injection share is a screening estimate (injected ÷ produced liquid, capped at 100%); it does not model injector distance or connectivity.</p>
        <Button size="sm" onClick={save}>Apply to Stage 8</Button>
      </CardContent>
    </Card>
  );
}
