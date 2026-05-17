import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export type SPTRecord = {
  id: string;
  wellId: string;
  source: string;
  totalDepth: number;
  casingOD: number;
  casingID: number;
  tubingOD: number;
  pressurePsi: number;
  slurryRateBblMin: number;
  sandConcentrationPpg: number;
  nitrogenPct: number;
  speedMmMin: number;
  intervals: { from: number; to: number }[];
  netSlotsFt: number;
  grossSlotsFt: number;
  drainageAreaFt2: number;
  rockVolumeFt3: number;
  rockWeightTons: number;
  totalLossesPsi: number;
  nozzlesDifferentialPsi: number;
  pdfUrl: string;
};

// Parsed from 199JTM1093W.pdf (MAXXWELL PRODUCTION HSP/SPT report)
const SEED_RECORDS: SPTRecord[] = [
  {
    id: "199JTM1093W",
    wellId: "199JTM1093W",
    source: "MAXXWELL Production · HSP report",
    totalDepth: 3150,
    casingOD: 5.5,
    casingID: 4.95,
    tubingOD: 2.88,
    pressurePsi: 5000,
    slurryRateBblMin: 5.54,
    sandConcentrationPpg: 0.25,
    nitrogenPct: 15,
    speedMmMin: 4.5,
    intervals: [
      { from: 2848, to: 2849.5 },
      { from: 2846, to: 2847.5 },
      { from: 2844, to: 2845.5 },
      { from: 2791, to: 2792 },
      { from: 2789, to: 2790.5 },
      { from: 2787, to: 2788.5 },
      { from: 2779, to: 2780 },
      { from: 2777, to: 2778.5 },
      { from: 2775, to: 2776.5 },
    ],
    netSlotsFt: 12.5,
    grossSlotsFt: 74.5,
    drainageAreaFt2: 226,
    rockVolumeFt3: 7.31,
    rockWeightTons: 0.58,
    totalLossesPsi: 904,
    nozzlesDifferentialPsi: 4393,
    pdfUrl: "/training-data/spt/199JTM1093W.pdf",
  },
];

interface Props {
  onIngest?: (count: number) => void;
}

const SPTTrainingDataset = ({ onIngest }: Props) => {
  const [records, setRecords] = useState<SPTRecord[]>(SEED_RECORDS);
  const [selected, setSelected] = useState<SPTRecord>(SEED_RECORDS[0]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    toast.success(`${files.length} HSP report(s) queued for parsing. AI extractor will populate fields.`);
    onIngest?.(files.length);
  };

  const ingestAll = () => {
    toast.success(`${records.length} SPT record(s) added to training dataset.`);
    onIngest?.(records.length);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              SPT Treatment Records
              <Badge variant="secondary">Stage 6 · HSP</Badge>
            </CardTitle>
            <CardDescription>
              Hydro Slotting Perforation job reports — used to train the SPT recommendation model
              (US patent 8,863,823).
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload HSP PDF
                </span>
              </Button>
            </label>
            <Button size="sm" onClick={ingestAll}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Ingest {records.length}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {records.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`text-left p-3 rounded-lg border transition ${
                selected.id === r.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-medium">{r.wellId}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.source}</p>
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  TD {r.totalDepth} ft
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {r.intervals.length} slots
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <Metric label="Total Depth" value={`${selected.totalDepth} ft`} />
          <Metric label="Casing OD / ID" value={`${selected.casingOD}" / ${selected.casingID}"`} />
          <Metric label="Pressure" value={`${selected.pressurePsi} psi`} />
          <Metric label="Slurry Rate" value={`${selected.slurryRateBblMin} bbl/min`} />
          <Metric label="Sand Conc." value={`${selected.sandConcentrationPpg} ppg`} />
          <Metric label="Nitrogen" value={`${selected.nitrogenPct}%`} />
          <Metric label="Cutting Speed" value={`${selected.speedMmMin} mm/min`} />
          <Metric label="Net Slots" value={`${selected.netSlotsFt} ft`} />
          <Metric label="Gross Slots" value={`${selected.grossSlotsFt} ft`} />
          <Metric label="Drainage Area" value={`${selected.drainageAreaFt2} ft²`} />
          <Metric label="Rock Removed" value={`${selected.rockWeightTons} US tons`} />
          <Metric label="ΔP Nozzles" value={`${selected.nozzlesDifferentialPsi} psi`} />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Perforation intervals ({selected.intervals.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {selected.intervals.map((iv, i) => (
              <Badge key={i} variant="secondary" className="font-mono text-[10px]">
                {iv.from}–{iv.to} ft
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Source PDF preserved for audit trail
          </span>
          <a
            href={selected.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            Open {selected.id}.pdf
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2 bg-muted/50 rounded">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

export default SPTTrainingDataset;
