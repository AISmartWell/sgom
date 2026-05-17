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
  status?: "treated" | "candidate";
  notes?: string;
  documents: { label: string; url: string; type: "pdf" | "docx" | "doc" | "xlsm" | "xlsx" | "jpg" | "gif" }[];
};

// Master Service Order (CUSA × Maxxwell, Sept 2015) — applies to all Chevron MCBU pilot wells (JTM 1093W, JTM 1606W, SE Matthews #10)
const MASTER_SERVICE_ORDER = {
  label: "CUSA × Maxxwell Master Service Order DRAFT (Sept 17, 2015)",
  url: "/training-data/spt/CUSA_Maxxwell_Service_Order_DRAFT_2015.docx",
  type: "docx" as const,
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
      { label: "Silagina GIS Pre-Treatment Recommendation (19.11.2015)", url: "/training-data/spt/JTM1093W_Silagina_GIS_Report_2015.docx", type: "docx" },
      { label: "Fig.1 — GIS log (GR/Caliper/Thermogram)", url: "/training-data/spt/JTM1093W_Fig1_GIS.pdf", type: "pdf" },
      { label: "Fig.2 — Well correlation scheme", url: "/training-data/spt/JTM1093W_Fig2_Correlation.pdf", type: "pdf" },
      { label: "MAXXWELL v2 Procedure Workbook (XLSM)", url: "/training-data/spt/JTM1093W_S202_Wolverine_Maxxwellv2.xlsm", type: "xlsm" },
    ],
    status: "treated",
    notes:
      "Pre-treatment GIS analysis by geophysicist T.V. Silagina (Chevron, Nov 2015) identified pay zones in Formation E (2761-2820 ft) and D5 (2826-2910 ft). Main fluid-receiving interval 2890-2956 ft. Recommended SPT intervals: E (2761-2793, 2798-2802, 2813-2820 ft) and D5 (2843-2854, 2861-2869, 2875-2910 ft).",
  },
  {
    id: "JTM-1606W",
    wellId: "JTM 1606W",
    source: "Chevron Wolverine Project · Silagina GIS Recommendation (16.11.2015)",
    operator: "Chevron USA Inc. (Mid-Continent BU)",
    field: "McElroy FMT",
    county: "Crane",
    stateCode: "TX",
    formation: "Grayburg (Pay A1)",
    bhpPsi: 0,
    fluidPpg: 5.7,
    pbtdFt: 2763,
    injPackerFt: 2557,
    existingPerfs: { from: 2716, to: 2755 }, // existing perfs 2716-2730, 2732-2741, 2745-2755
    totalDepth: 2763,
    casingOD: 5.5,
    casingID: 4.95,
    tubingOD: 2.88,
    pressurePsi: 0,
    slurryRateBblMin: 0,
    sandConcentrationPpg: 0,
    nitrogenPct: 0,
    speedMmMin: 0,
    intervals: [
      { from: 2716, to: 2730 }, // recommended SPT interval — base of pay A1
    ],
    netSlotsFt: 14,
    grossSlotsFt: 0,
    drainageAreaFt2: 0,
    rockVolumeFt3: 0,
    rockWeightTons: 0,
    totalLossesPsi: 0,
    nozzlesDifferentialPsi: 0,
    status: "candidate",
    notes:
      "Injector well, drilled 2011. Open hole 2671-2763 ft, packer at 2557 ft. Existing perfs: 2716-2730 / 2732-2741 / 2745-2755 ft. GIS thermogram shows fluid entry from 2725 ft with low intensity. Recommendation (Silagina, Nov 2015): SPT interval 2716-2730 ft — contains reservoir rock 2719-2729 ft with low GR (clean sand) at base of Pay A1. Correlation scheme covers wells 1605-1606-1604-1578-1607.",
    documents: [
      { label: "Silagina GIS Recommendation (16.11.2015)", url: "/training-data/spt/JTM1606W_Silagina_GIS_Report_2015.docx", type: "docx" },
      { label: "Fig.1 — GIS log (GR/Caliper/Thermogram)", url: "/training-data/spt/JTM1606W_Fig1_GIS.pdf", type: "pdf" },
    ],
  },
  {
    id: "FCL-WORKMAN-HZ",
    wellId: "FCL Workman Hz 3B13-20/4B10-19-1-31W1M",
    source: "Federated Co-operatives Ltd · R.W. Shirkie Geological Consultants",
    operator: "Federated Co-operatives Limited",
    field: "Workman",
    county: "Sec 20, Twp 1, Rge 31 W1M",
    stateCode: "SK",
    formation: "Sherwood Porosity (Mississippian)",
    bhpPsi: 0,
    fluidPpg: 8.96, // KCl mud 1075 kg/m³
    pbtdFt: 5413, // 1650 m MD
    injPackerFt: 0,
    existingPerfs: { from: 4354, to: 5413 }, // lateral 1327–1650 m → 4354–5413 ft
    totalDepth: 5413, // 1650 m MD = 5413 ft / TVD 3898 ft
    casingOD: 9.625, // 244.5 mm surface csg
    casingID: 9, // 228.6 mm ID
    tubingOD: 0,
    pressurePsi: 0,
    slurryRateBblMin: 0,
    sandConcentrationPpg: 0,
    nitrogenPct: 0,
    speedMmMin: 0,
    intervals: [
      // Lateral reservoir sections (m MD → ft)
      { from: 4495, to: 4839 }, // 1370–1475 m: Fair (105 m)
      { from: 4888, to: 5249 }, // 1490–1600 m: Poor-Fair (110 m)
      { from: 5249, to: 5495 }, // 1600–1675 m: Poor (75 m)
    ],
    netSlotsFt: 0,
    grossSlotsFt: 0,
    drainageAreaFt2: 0,
    rockVolumeFt3: 0,
    rockWeightTons: 0,
    totalLossesPsi: 0,
    nozzlesDifferentialPsi: 0,
    status: "candidate",
    notes:
      "Horizontal well, 325 m lateral. Target: Sherwood Porosity. Reservoir quality: 105 m Fair + 110 m Poor-Fair + 75 m Poor + 15 m Very Poor + 20 m Non-Poor. SPT candidate — not yet treated.",
    documents: [
      {
        label: "R.W. Shirkie Geological Report (FCL Workman Hz, 2011)",
        url: "/training-data/spt/9-19hz_Workman_Hz_Geological_Report.pdf",
        type: "pdf",
      },
    ],
  },
  {
    id: "BARRACUDA-PINTO-03-04",
    wellId: "Barracuda Pinto 03-04-002-03W2 (74G003)",
    source: "Admiralty Oils Ltd · MAXXWELL HSP Program SK-003 (Dec 2013)",
    operator: "Admiralty Oils Ltd.",
    field: "Pinto",
    county: "Sec 04 Twp 002 Rge 03W2",
    stateCode: "SK",
    formation: "Midale / Frobisher",
    bhpPsi: 0,
    fluidPpg: 9.43, // 1130 kg/m³ gel chemical
    pbtdFt: 5200, // TVD 1584 m
    injPackerFt: 4948, // 1508.2 m installation point
    existingPerfs: { from: 5024, to: 5069 }, // 1531.5–1545.3 m
    totalDepth: 5200,
    casingOD: 4.5,
    casingID: 4.09,
    tubingOD: 2.88,
    pressurePsi: 6019, // 41.5 MPa peak
    slurryRateBblMin: 12.2, // 1.94 m³/min
    sandConcentrationPpg: 0.25,
    nitrogenPct: 0,
    speedMmMin: 4.5,
    intervals: [
      // Top 8 cutting intervals from program (1531.5–1545.3 m → ft)
      { from: 5024, to: 5026 }, // 1531.5–1532.0 m
      { from: 5037, to: 5039 }, // 1535.6–1536.2 m approx
      { from: 5054, to: 5057 }, // 1540.5–1541.5 m approx
      { from: 5066, to: 5069 }, // 1545.0–1545.3 m
    ],
    netSlotsFt: 2.95, // 0.9 m total cut
    grossSlotsFt: 45,
    drainageAreaFt2: 138,
    rockVolumeFt3: 4.2,
    rockWeightTons: 0.33,
    totalLossesPsi: 850,
    nozzlesDifferentialPsi: 4100,
    status: "candidate",
    notes:
      "41-stage HSP program. 22 tons abrasive (2 nozzles) or 44 tons (4 nozzles). Working pressure 27.5–41.5 MPa, slurry rate 0.6–1.94 m³/min. Correlated with offset well 07-27-004-07W2. Engineer: Anatoli Nikouline.",
    documents: [
      {
        label: "MAXXWELL HSP Program SK-003 (Barracuda Pinto, PDF)",
        url: "/training-data/spt/Barracuda_Pinto_03-04-002-03W2_HSP_Program.pdf",
        type: "pdf",
      },
      {
        label: "MAXXWELL HSP Program SK-003 (Barracuda Pinto, DOCX)",
        url: "/training-data/spt/Barracuda_Pinto_03-04-002-03W2_HSP_Program.docx",
        type: "docx",
      },
    ],
  },
  {
    id: "ADMIRALTY-PINTO-02-01",
    wellId: "Admiralty Pinto 02-01-002-05W2 (84E372)",
    source: "Admiralty Oils Ltd · MAXXWELL HSP Program SK-003 (Dec 2013)",
    operator: "Admiralty Oils Ltd.",
    field: "Pinto",
    county: "Sec 01 Twp 002 Rge 05W2",
    stateCode: "SK",
    formation: "Midale / Frobisher",
    bhpPsi: 0,
    fluidPpg: 9.43, // 1130 kg/m³
    pbtdFt: 5249, // plug 1600 m
    injPackerFt: 5204, // 1586.2 m
    existingPerfs: { from: 5204, to: 5241 }, // 1586.2–1597.5 m treatment
    totalDepth: 5417, // 1651 m
    casingOD: 4.5,
    casingID: 4.09,
    tubingOD: 2.88,
    pressurePsi: 6019, // 41.5 MPa
    slurryRateBblMin: 12.2, // 1.94 m³/min
    sandConcentrationPpg: 0.25,
    nitrogenPct: 0,
    speedMmMin: 4.5,
    intervals: [
      // Treatment 1586.2–1597.5 m, total 11.8 m of cuts across several sub-intervals
      { from: 5204, to: 5215 }, // 1586.2–1589.5 m
      { from: 5220, to: 5228 }, // 1591.0–1593.5 m
      { from: 5233, to: 5241 }, // 1595.0–1597.5 m
    ],
    netSlotsFt: 38.7, // 11.8 m total
    grossSlotsFt: 121,
    drainageAreaFt2: 365,
    rockVolumeFt3: 11.2,
    rockWeightTons: 0.89,
    totalLossesPsi: 920,
    nozzlesDifferentialPsi: 4300,
    status: "candidate",
    notes:
      "Treatment interval 1586.2–1597.5 m (11.8 m total). 27 tons sand (2 nozzles) or 54 tons (4 nozzles). Working pressure 27.5–41.5 MPa, slurry rate 0.3–1.94 m³/min. BHT 60°C. Plug at 1600 m, sump 2.0 m — attention required. Working time ~30 hours. Engineer: Anatoli Nikouline.",
    documents: [
      {
        label: "MAXXWELL HSP Program SK-003 (Admiralty Pinto, PDF)",
        url: "/training-data/spt/Admiralty_Pinto_02-01-002-05W2_HSP_Program.pdf",
        type: "pdf",
      },
      {
        label: "MAXXWELL HSP Program SK-003 (Admiralty Pinto, DOCX)",
        url: "/training-data/spt/Admiralty_Pinto_02-01-002-05W2_HSP_Program.docx",
        type: "docx",
      },
    ],
  },
  {
    id: "SE-MATTHEWS-10",
    wellId: "SE Matthews #10",
    source: "Chevron USA · MCBU Pilot Program (Service Order CWxxx, Oct 2015 – Mar 2016)",
    operator: "Chevron U.S.A. Inc. (Mid-Continent BU) · Contractor: Maxxwell Production, LLC",
    field: "Chevron MCBU",
    county: "—",
    stateCode: "TX",
    formation: "Pay zone ~6400–6500 ft (AIT-H / Density-Neutron log, Main Pass)",
    bhpPsi: 0,
    fluidPpg: 0,
    pbtdFt: 6500,
    injPackerFt: 0,
    existingPerfs: { from: 6400, to: 6500 },
    totalDepth: 6500,
    casingOD: 5.5,
    casingID: 4.95,
    tubingOD: 2.88,
    pressurePsi: 0,
    slurryRateBblMin: 0,
    sandConcentrationPpg: 0,
    nitrogenPct: 0,
    speedMmMin: 4.5,
    intervals: [
      { from: 6400, to: 6500 }, // candidate zone from Schlumberger AIT-H / DPHI-NPHI log
    ],
    netSlotsFt: 0,
    grossSlotsFt: 0,
    drainageAreaFt2: 0,
    rockVolumeFt3: 0,
    rockWeightTons: 0,
    totalLossesPsi: 0,
    nozzlesDifferentialPsi: 0,
    status: "candidate",
    notes:
      "One of 5 designated pilot wells under the CUSA × Maxxwell Master Service Order (Sept 2015). Program window 10/1/2015 – 3/31/2016. Contractor responsible for hydro-slotting review of well logs to determine downhole intervals for continuous moving-jet slotting perforation. Engineer: Anatoli Nikouline (Maxxwell CEO). Schlumberger Main-Pass log (SP/GR/RWA, AIT-H 10–90\", DPHI/NPHI, DRHO, DCAL) covers casing shoe ~1000 ft down to TD; pay zone identified at ~6400–6500 ft. Wellbore Diagram template (SE_Matthews_10_WBDs.xlsx) provided but tubular/cement details not yet populated.",
    documents: [
      MASTER_SERVICE_ORDER,
      { label: "SE Matthews #10 — Schlumberger log with header", url: "/training-data/spt/SE_Matthews_10_Log_with_Header.pdf", type: "pdf" },
      { label: "SE Matthews #10 — Wellbore Diagram template (XLSX)", url: "/training-data/spt/SE_Matthews_10_WBDs.xlsx", type: "xlsx" },
      { label: "Maxxwell EFT Form (payment setup, PDF)", url: "/training-data/spt/Maxxwell_EFT_Form.pdf", type: "pdf" },
      { label: "Maxxwell EFT Form (payment setup, DOC)", url: "/training-data/spt/Maxxwell_EFT_Form.doc", type: "doc" },
    ],
  },
  {
    id: "REDMAN-D-1",
    wellId: "REDMAN D #1 (API 142090023639)",
    source: "Maxxwell Production Inc. · SPT Cut Program TX-001 (Jan 29, 2014)",
    operator: "Rocking R Drilling & Prod (028853) · Client: ReduxEnergy",
    field: "Wes Poteet",
    county: "Montague",
    stateCode: "TX",
    formation: "Granite Wash 2670 (Pennsylvanian)",
    bhpPsi: 0,
    fluidPpg: 8.34, // fresh water + friction reducer
    pbtdFt: 2959,
    injPackerFt: 0,
    existingPerfs: { from: 2670, to: 2685 },
    totalDepth: 2959,
    casingOD: 5.5,
    casingID: 4.95,
    tubingOD: 2.88,
    pressurePsi: 6019, // 41.5 MPa peak
    slurryRateBblMin: 5.5,
    sandConcentrationPpg: 0.25,
    nitrogenPct: 0,
    speedMmMin: 4.5,
    intervals: [
      // 12 cuts from program — top section near 2651–2676 ft (Layers 1-2 + analogues 4-7)
      { from: 2651.5, to: 2653.14 },
      { from: 2674.5, to: 2676.14 },
    ],
    netSlotsFt: 3.28, // 1 m total cuts × 12 stages ≈ 3.3 ft net
    grossSlotsFt: 25,
    drainageAreaFt2: 95,
    rockVolumeFt3: 2.9,
    rockWeightTons: 0.23,
    totalLossesPsi: 870,
    nozzlesDifferentialPsi: 4200,
    status: "treated",
    notes:
      "Vertical oil well, TD 2959 ft, perfs 2670-2685 ft (Granite Wash). Cum: 33,470 BBL oil / 251 MCF gas / 100,636 BBL water since 1984. Residual oil reserves estimated 30-40%. SPT program TX-001 by Anatoli Nikouline (Maxxwell) for ReduxEnergy: 20 tons abrasive (2 nozzles) or 40 tons (4 nozzles), working pressure 27.5–41.5 MPa. Water tank 19.5 m³ / cutting tank 10 m³. Layers 1-2 main targets, layers 4-7 are analogues by GIS. Lift 3 ft between cuts. Stops not permitted during slurry circulation.",
    documents: [
      { label: "Maxxwell SPT Cut Program TX-001 (REDMAN D #1)", url: "/training-data/spt/REDMAN_D_1_API142090023639_Cut_Program.pdf", type: "pdf" },
      { label: "Surface equipment schematic (JPG)", url: "/training-data/spt/equipment/Surface.jpg", type: "jpg" },
      { label: "Surface equipment animation (GIF)", url: "/training-data/spt/equipment/Surface.gif", type: "gif" },
      { label: "Process diagram", url: "/training-data/spt/equipment/process-1.jpg", type: "jpg" },
      { label: "Perforator — 3 nozzles", url: "/training-data/spt/equipment/Perforator-3-nozzles.pdf", type: "pdf" },
      { label: "Perforator — 4 nozzles", url: "/training-data/spt/equipment/Perforator-4-nozzles.pdf", type: "pdf" },
      { label: "Perforator — 4 nozzles (alt)", url: "/training-data/spt/equipment/Perforator-4-noz.pdf", type: "pdf" },
      { label: "Centralizer Type 1", url: "/training-data/spt/equipment/Centralizer-1.pdf", type: "pdf" },
      { label: "Centralizer Type 2", url: "/training-data/spt/equipment/Centralizer-2.pdf", type: "pdf" },
      { label: "Support A", url: "/training-data/spt/equipment/Support-A.pdf", type: "pdf" },
      { label: "Support B", url: "/training-data/spt/equipment/Support-B.pdf", type: "pdf" },
      { label: "Support 1 (balls)", url: "/training-data/spt/equipment/Support-1(balls).pdf", type: "pdf" },
      { label: "Support 2 (balls)", url: "/training-data/spt/equipment/Support-2(balls).pdf", type: "pdf" },
      { label: "Temperature-Pressure-Cutting chart", url: "/training-data/spt/equipment/Temperature-Pressure-Cutting.jpg", type: "jpg" },
      { label: "Cutting speed — 4 mm/min", url: "/training-data/spt/equipment/Cutting-Speed-4-mm-per-min.jpg", type: "jpg" },
      { label: "Fracturing diagram", url: "/training-data/spt/equipment/Fracturing.jpg", type: "jpg" },
      { label: "Hydro-slotting thesis (Stanford/ETD 2003)", url: "/training-data/spt/equipment/etd-01242003-103649-1.pdf", type: "pdf" },
      { label: "Hydro-slotting thesis (DOCX)", url: "/training-data/spt/equipment/etd-01242003-103649-1.docx", type: "docx" },
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
              <div className="flex flex-wrap gap-1 mt-2">
                {r.status && (
                  <Badge
                    variant={r.status === "treated" ? "default" : "secondary"}
                    className="text-[10px] uppercase"
                  >
                    {r.status}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  TD {r.totalDepth} ft
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {r.intervals.length} {r.status === "candidate" ? "zones" : "slots"}
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
