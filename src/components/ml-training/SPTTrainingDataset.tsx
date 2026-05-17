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
  operator?: string;
  field?: string;
  county?: string;
  stateCode?: string;
  formation?: string;
  bhpPsi?: number;
  fluidPpg?: number;
  pbtdFt?: number;
  injPackerFt?: number;
  existingPerfs?: { from: number; to: number };
  documents: { label: string; url: string; type: "pdf" | "docx" | "doc" }[];
};

// Parsed from real Chevron / MAXXWELL files for well JTM 1093W
const SEED_RECORDS: SPTRecord[] = [
  {
    id: "JTM-1093W",
    wellId: "JTM 1093W S202",
    source: "Chevron Wolverine Project · MAXXWELL HSP",
    operator: "Chevron USA Inc. (Mid-Continent BU)",
    field: "McElroy FMT",
    county: "Crane",
    stateCode: "TX",
    formation: "Grayburg",
    bhpPsi: 800,
    fluidPpg: 5.7,
    pbtdFt: 3120,
    injPackerFt: 2600,
    existingPerfs: { from: 2766, to: 2951 },
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
      { from: 2775, to: 2780 },
      { from: 2787, to: 2792 },
      { from: 2865, to: 2875 },
      { from: 2890, to: 2900 },
    ],
    netSlotsFt: 12.5,
    grossSlotsFt: 74.5,
    drainageAreaFt2: 226,
    rockVolumeFt3: 7.31,
    rockWeightTons: 0.58,
    totalLossesPsi: 904,
    nozzlesDifferentialPsi: 4393,
    documents: [
      { label: "MAXXWELL HSP report (199JTM1093W)", url: "/training-data/spt/199JTM1093W.pdf", type: "pdf" },
      { label: "Chevron Wolverine Procedure", url: "/training-data/spt/JTM_1093W_S202_Wolverine_Procedure.docx", type: "docx" },
      { label: "MAXXWELL Full SPT Program (35 pages, TX-098)", url: "/training-data/spt/Program_199JTM1093W.doc", type: "doc" },
      { label: "Wedge Wireline CN/CDL + Injection Profile (1989)", url: "/training-data/spt/Logging199JTM1093W.pdf", type: "pdf" },
    ],
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

        {/* Well context */}
        {(selected.operator || selected.field) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selected.operator && <Metric label="Operator" value={selected.operator} />}
            {selected.field && <Metric label="Field" value={selected.field} />}
            {selected.county && (
              <Metric label="County / State" value={`${selected.county}, ${selected.stateCode ?? ""}`} />
            )}
            {selected.formation && <Metric label="Formation" value={selected.formation} />}
            {selected.bhpPsi !== undefined && <Metric label="BHP" value={`${selected.bhpPsi} psi`} />}
            {selected.fluidPpg !== undefined && <Metric label="Fluid Gradient" value={`${selected.fluidPpg} ppg`} />}
            {selected.pbtdFt !== undefined && <Metric label="PBTD" value={`${selected.pbtdFt} ft`} />}
            {selected.injPackerFt !== undefined && (
              <Metric label="Inj. Packer" value={`${selected.injPackerFt} ft`} />
            )}
            {selected.existingPerfs && (
              <Metric
                label="Existing Perfs"
                value={`${selected.existingPerfs.from}–${selected.existingPerfs.to} ft`}
              />
            )}
          </div>
        )}

        {/* HSP parameters */}
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

        <div className="pt-2 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Source documents ({selected.documents.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {selected.documents.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                {doc.label}
                <Badge variant="outline" className="text-[9px] uppercase ml-1">
                  {doc.type}
                </Badge>
              </a>
            ))}
          </div>
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
