// Labeled benchmark pool for SPT candidate scoring (training / validation examples).
// Each entry is a REAL well with a ground-truth label used to anchor the 0-100 score
// produced by spt-advisor. Add new cases here when a program is executed or rejected.

export type SPTBenchmarkCase = {
  id: string;
  well: string;
  split: "validation" | "train";
  label: "treated" | "candidate";
  groundTruthScore: number; // expert-assigned SPT suitability (0-100)
  features: {
    totalDepthFt: number;
    casingOD: number;
    formation: string;
    lithology: "carbonate" | "sandstone";
    payIntervalFt: [number, number];
    bhpPsi?: number;
    fluidPpg?: number;
  };
  program?: {
    pressurePsi: number;
    slurryRateBblMin: number;
    sandPpg: number;
    nitrogenPct?: number;
    speedMmMin: number;
    netSlotsFt: number;
    grossSlotsFt: number;
    drainageAreaFt2: number;
    dpNozzlesPsi: number;
  };
  rationale: string;
  source: string;
};

export const SPT_SCORING_BENCHMARK: SPTBenchmarkCase[] = [
  {
    id: "JTM-1093W-S202",
    well: "JTM 1093W S202 (Chevron Wolverine, McElroy TX)",
    split: "validation",
    label: "treated",
    groundTruthScore: 88,
    features: {
      totalDepthFt: 3150,
      casingOD: 5.5,
      formation: "Grayburg",
      lithology: "carbonate",
      payIntervalFt: [2766, 2951],
      bhpPsi: 800,
      fluidPpg: 5.7,
    },
    program: {
      pressurePsi: 5000,
      slurryRateBblMin: 5.54,
      sandPpg: 0.25,
      nitrogenPct: 15,
      speedMmMin: 4.5,
      netSlotsFt: 12.5,
      grossSlotsFt: 74.5,
      drainageAreaFt2: 226,
      dpNozzlesPsi: 4393,
    },
    rationale:
      "Shallow depleted carbonate (BHP 800 psi) with a thick logged pay column and clean low-GR sand streaks; slots placed above packer at 2600 ft. Executed program — use as the reference anchor for shallow (<3500 ft) carbonate candidates.",
    source: "/training-data/spt/JTM1093W_S202_Wolverine_Maxxwellv2.xlsm",
  },
  {
    id: "JTM-1606W",
    well: "JTM 1606W (Chevron Wolverine, McElroy TX)",
    split: "train",
    label: "candidate",
    groundTruthScore: 64,
    features: {
      totalDepthFt: 2763,
      casingOD: 5.5,
      formation: "Grayburg Pay A1",
      lithology: "carbonate",
      payIntervalFt: [2716, 2755],
    },
    rationale:
      "Injector with weak fluid entry from 2725 ft; only 14 ft of clean sand qualifies for slotting — moderate score, needs GIS confirmation before execution.",
    source: "/training-data/spt/JTM1606W_Silagina_GIS_Report_2015.docx",
  },
  {
    id: "REDMAN-D-1",
    well: "REDMAN D #1 (ReduxEnergy, Montague TX, Granite Wash)",
    split: "train",
    label: "treated",
    groundTruthScore: 72,
    features: {
      totalDepthFt: 2959,
      casingOD: 5.5,
      formation: "Granite Wash",
      lithology: "sandstone",
      payIntervalFt: [2670, 2685],
      fluidPpg: 8.34,
    },
    program: {
      pressurePsi: 6019,
      slurryRateBblMin: 5.5,
      sandPpg: 0.25,
      speedMmMin: 4.5,
      netSlotsFt: 3.28,
      grossSlotsFt: 25,
      drainageAreaFt2: 95,
      dpNozzlesPsi: 4200,
    },
    rationale:
      "Long-life shallow sandstone producer with high cumulative water (100 MBBL); short net slot length limits uplift — anchor for mature high-water-cut sandstone.",
    source: "/training-data/spt/REDMAN_D_1_API142090023639_Cut_Program.pdf",
  },
  {
    id: "JTM-1093W-HSP-CALC-5225",
    well: "JTM 1093W · HSP parameter calculation (deep-interval design run, 5,225 ft)",
    split: "validation",
    label: "candidate",
    groundTruthScore: 76,
    features: {
      totalDepthFt: 5225,
      casingOD: 5.5,
      formation: "Grayburg (deep design run)",
      lithology: "carbonate",
      payIntervalFt: [4875, 4916],
      fluidPpg: 8.5,
    },
    program: {
      pressurePsi: 5000,
      slurryRateBblMin: 5.45,
      sandPpg: 0.35, // 4.5 oz/gal working concentration (~2.67 oz/gal at nozzles)
      speedMmMin: 5.08, // 0.2 in/min
      netSlotsFt: 18.69,
      grossSlotsFt: 23.36,
      drainageAreaFt2: 334,
      dpNozzlesPsi: 4434,
    },
    rationale:
      "12 cuts of 1.31 ft over 4,875–4,916 ft; BHT 180 °F, hydrostatic 2,202 psi, total losses 566 psi, abrasive 22.3 t (2 nozzles) / 43.2 t (4 nozzles), rock removed 0.68 t, open area 334 ft² (2 noz) / 652 ft² (4 noz). Engineering design run — anchor for deep (>4,500 ft) carbonate intervals with 5.5\" casing and 2.38\" tubing.",
    source: "/training-data/spt/199JTM1093W_HSP_Calculation.xlsx",
  },
];


export const SPT_BENCHMARK_PROMPT = `## SPT SCORING BENCHMARK — labeled examples (calibrate your 0-100 score against these)
${SPT_SCORING_BENCHMARK.map(
  (c) =>
    `- [${c.split.toUpperCase()} · ${c.label}] ${c.well} → score ${c.groundTruthScore}/100. ${c.features.totalDepthFt} ft ${c.features.lithology} (${c.features.formation}), pay ${c.features.payIntervalFt[0]}–${c.features.payIntervalFt[1]} ft${
      c.program
        ? `, program ${c.program.pressurePsi} psi / ${c.program.slurryRateBblMin} bbl/min / net slots ${c.program.netSlotsFt} ft / drainage ${c.program.drainageAreaFt2} ft²`
        : ""
    }. ${c.rationale} (source: ${c.source})`
).join("\n")}

Calibration rules:
- A well matching an executed (treated) analogue on depth ±20%, casing OD and lithology should score within ±10 of that analogue's ground-truth score.
- Never score a candidate above 88 unless it beats JTM 1093W S202 on both pay thickness and reservoir pressure.
- State the anchor you used: **"Benchmark anchor: <id> (score N) — adjusted to M because ..."**`;
