import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Layers, Gauge } from "lucide-react";

const wellSpecs = [
  { label: "Total Depth", value: "3,150 ft" },
  { label: "Casing OD / ID", value: '5.5" / 4.95"' },
  { label: "Tubing", value: '2.88"' },
  { label: "Pay Interval", value: "2,766 – 2,951 ft" },
  { label: "Bottomhole Pressure", value: "800 psi" },
  { label: "Fluid Density", value: "5.7 ppg" },
  { label: "Packer Depth", value: "2,600 ft" },
];

const treatmentParams = [
  { label: "Surface Pressure", value: "5,000 psi" },
  { label: "Slurry Rate", value: "5.54 bbl/min" },
  { label: "Sand Concentration", value: "0.25 ppg" },
  { label: "Nitrogen Content", value: "15 %" },
  { label: "Cutting Speed", value: "4.5 mm/min" },
  { label: "Pressure Losses", value: "904 psi" },
  { label: "ΔP Across Nozzles", value: "4,393 psi" },
];

const cutIntervals = [
  { from: 2775, to: 2780 },
  { from: 2787, to: 2792 },
  { from: 2865, to: 2875 },
  { from: 2890, to: 2900 },
];

const results = [
  { label: "Net Slots", value: "12.5 ft" },
  { label: "Gross Interval", value: "74.5 ft" },
  { label: "Drainage Area", value: "226 ft²" },
  { label: "Rock Removed", value: "0.58 t" },
];

const RealSPTCaseCard = () => {
  const minDepth = 2760;
  const maxDepth = 2960;
  const span = maxDepth - minDepth;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Real Case — JTM 1093W S202
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="status-high">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Treated
            </Badge>
            <Badge variant="outline">REAL DATA</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Chevron Wolverine · McElroy Field, TX · Grayburg formation · Program executed by Maxxwell Production
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Well specs + treatment params */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              Wellbore Configuration
            </div>
            <div className="space-y-2">
              {wellSpecs.map((s) => (
                <div key={s.label} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-sm font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <Gauge className="h-4 w-4 text-primary" />
              Treatment Parameters
            </div>
            <div className="space-y-2">
              {treatmentParams.map((s) => (
                <div key={s.label} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-sm font-medium text-primary">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cut intervals visualization */}
        <div>
          <div className="text-sm font-semibold mb-3">Slot Cut Intervals (ft MD)</div>
          <div className="relative h-14 rounded-lg bg-muted/30 overflow-hidden border border-border/40">
            {cutIntervals.map((c) => (
              <div
                key={c.from}
                className="absolute top-0 h-full bg-primary/50 border-x border-primary"
                style={{
                  left: `${((c.from - minDepth) / span) * 100}%`,
                  width: `${((c.to - c.from) / span) * 100}%`,
                }}
                title={`${c.from} – ${c.to} ft`}
              />
            ))}
            <div className="absolute inset-x-0 bottom-1 flex justify-between px-2 text-[10px] text-muted-foreground">
              <span>{minDepth} ft</span>
              <span>{maxDepth} ft</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {cutIntervals.map((c) => (
              <Badge key={c.from} variant="outline" className="text-xs">
                {c.from} – {c.to} ft
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {results.map((r) => (
            <div key={r.label} className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-lg font-bold text-success">{r.value}</p>
              <p className="text-xs text-muted-foreground">{r.label}</p>
            </div>
          ))}
        </div>

        {/* Geology note */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Pre-treatment GIS interpretation:</span> pay zones
            Fm E 2,761–2,820 ft and D5 2,826–2,910 ft. Slot placement targets the cleanest sand intervals
            with the lowest gamma-ray response, avoiding shale streaks and the existing packer setting depth.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealSPTCaseCard;
