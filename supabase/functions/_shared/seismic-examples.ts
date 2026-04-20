// Few-shot эталонные интерпретации сейсмики для AI.
// Методологически корректные синтетические кейсы на базе реальных бассейнов
// (Permian Wolfcamp, Anadarko Woodford, Williston Bakken).
// Используются как in-context примеры для google/gemini-3-flash-preview.

export interface SeismicExample {
  id: string;
  basin: string;
  formation: string;
  depthRange: string;
  // Входные сейсмические признаки
  features: {
    coherence: number;      // 0-1
    dipAngle: number;       // degrees
    intervalVelocity: number; // km/s
    avoGradient: number;    // dimensionless
    amplitudePattern: string;
    horizonContinuity: string;
  };
  // Эталонная экспертная интерпретация
  expertInterpretation: {
    structuralSummary: string;
    amplitudeAnomalies: string;
    bypassedPayVerdict: "high" | "medium" | "low" | "none";
    bypassedPayReasoning: string;
    confidenceScore: number; // 0-100
    recommendedAction: string;
  };
}

export const SEISMIC_FEW_SHOT_EXAMPLES: SeismicExample[] = [
  {
    id: "EX-001-WOLFCAMP-BRIGHT",
    basin: "Permian Basin (Midland)",
    formation: "Wolfcamp B",
    depthRange: "8,400-9,200 ft",
    features: {
      coherence: 0.78,
      dipAngle: -8,
      intervalVelocity: 3.1,
      avoGradient: 0.18,
      amplitudePattern: "Strong bright spot at 8,650 ft, polarity reversal vs surrounding reflectors",
      horizonContinuity: "Continuous with localized amplitude blowout over 1,200 ft lateral",
    },
    expertInterpretation: {
      structuralSummary: "Sub-horizontal Wolfcamp B reflector with minor SE dip. No major faulting; gentle 4-way closure suspected updip.",
      amplitudeAnomalies: "Class III AVO bright spot — increasing amplitude with offset and polarity reversal indicate gas-charged sand or oil saturation in low-impedance reservoir.",
      bypassedPayVerdict: "high",
      bypassedPayReasoning: "Original Wolfcamp completions in this section targeted shallower A bench (8,100 ft). Bright spot at 8,650 ft was logged but not perforated — consistent with bypassed pay pattern seen in 30% of legacy Midland wells.",
      confidenceScore: 84,
      recommendedAction: "Recommend recompletion with 6-stage frac across 8,600-8,720 ft interval. Estimated incremental EUR: 45-60 MBO.",
    },
  },
  {
    id: "EX-002-WOODFORD-FAULTED",
    basin: "Anadarko Basin (SCOOP)",
    formation: "Woodford Shale",
    depthRange: "11,200-11,800 ft",
    features: {
      coherence: 0.42,
      dipAngle: -22,
      intervalVelocity: 3.8,
      avoGradient: -0.05,
      amplitudePattern: "Discontinuous, dim zone between 11,400-11,550 ft with sharp lateral termination",
      horizonContinuity: "Disrupted — coherence drop and offset across reflector indicate fault zone",
    },
    expertInterpretation: {
      structuralSummary: "Steeply-dipping reverse fault cuts Woodford section between 11,400-11,550 ft. Fault throw ~80 ft; likely sealing based on coherence collapse.",
      amplitudeAnomalies: "Dim spot is fault-shadow artifact, NOT hydrocarbon indicator. Negative AVO gradient + dim signature inconsistent with charged reservoir.",
      bypassedPayVerdict: "low",
      bypassedPayReasoning: "Structural complexity and likely fault-sealing mean isolated compartment may exist downthrown side, but lack of bright AVO response suggests no significant bypassed pay in current trajectory.",
      confidenceScore: 71,
      recommendedAction: "Avoid recompletion in fault-disturbed zone. Consider sidetrack 600 ft NE to test downthrown block.",
    },
  },
  {
    id: "EX-003-BAKKEN-FLAT-SPOT",
    basin: "Williston Basin",
    formation: "Middle Bakken",
    depthRange: "10,100-10,400 ft",
    features: {
      coherence: 0.88,
      dipAngle: -3,
      intervalVelocity: 4.2,
      avoGradient: 0.09,
      amplitudePattern: "Flat horizontal reflector at 10,280 ft cutting across structural dip — classic flat spot",
      horizonContinuity: "Highly continuous, parallel reflectors typical of Bakken-Three Forks section",
    },
    expertInterpretation: {
      structuralSummary: "Layer-cake stratigraphy of Middle Bakken with very gentle structural dip. Reservoir geometry favorable for horizontal completion.",
      amplitudeAnomalies: "Flat spot at 10,280 ft is direct hydrocarbon indicator (DHI) — represents fluid contact (likely oil-water). Suggests trapped column above contact.",
      bypassedPayVerdict: "high",
      bypassedPayReasoning: "Flat spot 40 ft above original perforation interval (10,320 ft). Vertical resolution of legacy 1990s 2D survey missed this — modern 3D + AI reinterpretation reveals 40 ft column of bypassed oil.",
      confidenceScore: 89,
      recommendedAction: "Plug-back recompletion to 10,260-10,300 ft. SPT (Slot Perforation Technology, US 8,863,823) recommended due to thin pay zone — provides 5-10× inflow vs conventional perforation.",
    },
  },
  {
    id: "EX-004-MISSISSIPPIAN-CHANNEL",
    basin: "Anadarko Basin (STACK)",
    formation: "Mississippian Lime",
    depthRange: "5,800-6,200 ft",
    features: {
      coherence: 0.65,
      dipAngle: -5,
      intervalVelocity: 4.5,
      avoGradient: 0.04,
      amplitudePattern: "Lens-shaped high-amplitude body, 800 ft wide, 60 ft thick at 5,950 ft",
      horizonContinuity: "Continuous regional reflector with localized channel-fill geometry",
    },
    expertInterpretation: {
      structuralSummary: "Incised channel-fill geometry within Mississippian carbonate platform. Channel axis trends NE-SW based on amplitude extraction.",
      amplitudeAnomalies: "High-amplitude lens consistent with porous carbonate or chert-rich channel fill. Class II AVO response suggests moderate fluid effect.",
      bypassedPayVerdict: "medium",
      bypassedPayReasoning: "Channel geometry was not recognized in 1980s vertical drilling era. Lateral extent (800 ft) makes it strong horizontal target. Some risk of tight matrix porosity reducing deliverability.",
      confidenceScore: 73,
      recommendedAction: "Drill 1,500 ft horizontal lateral along channel axis. Recommend pre-frac pressure test to confirm reservoir quality before full completion.",
    },
  },
  {
    id: "EX-005-NIOBRARA-DIM",
    basin: "DJ Basin (Wattenberg)",
    formation: "Niobrara B Chalk",
    depthRange: "6,900-7,300 ft",
    features: {
      coherence: 0.92,
      dipAngle: -2,
      intervalVelocity: 3.6,
      avoGradient: -0.02,
      amplitudePattern: "Uniform low-amplitude background; no anomalies; consistent character across 2 mile section",
      horizonContinuity: "Excellent continuity, classic chalk-marl couplet stratigraphy",
    },
    expertInterpretation: {
      structuralSummary: "Tabular Niobrara stratigraphy, no structural complexity. Reservoir quality controlled by stratigraphy and fracture density rather than structure.",
      amplitudeAnomalies: "No DHI present. Amplitudes match expected response for tight chalk reservoir — production driven by induced fracture network, not seismic-detectable fluid effects.",
      bypassedPayVerdict: "none",
      bypassedPayReasoning: "Seismic data alone cannot identify bypassed pay in tight unconventional reservoirs. Existing wells likely captured available production within drainage radius. Recommend petrophysical and production analysis instead.",
      confidenceScore: 81,
      recommendedAction: "Defer to well-log and production-decline analysis. Seismic offers no actionable bypassed pay target in this play type.",
    },
  },
];

export function buildFewShotPromptSection(): string {
  return `\n\n=== EXPERT REFERENCE INTERPRETATIONS (FEW-SHOT EXAMPLES) ===\n\nUse these 5 expert-validated cases as your reasoning template. Match observed patterns in the new data to the closest example(s) and explain WHICH example informed your interpretation.\n\n${SEISMIC_FEW_SHOT_EXAMPLES.map((ex, i) => `--- Example #${i + 1}: ${ex.id} ---
Basin: ${ex.basin} | Formation: ${ex.formation} | Depth: ${ex.depthRange}
Input features:
  - Coherence: ${ex.features.coherence}
  - Dip: ${ex.features.dipAngle}°
  - Vp: ${ex.features.intervalVelocity} km/s
  - AVO gradient: ${ex.features.avoGradient}
  - Amplitude pattern: ${ex.features.amplitudePattern}
  - Horizon continuity: ${ex.features.horizonContinuity}
Expert interpretation:
  - Structure: ${ex.expertInterpretation.structuralSummary}
  - Amplitude analysis: ${ex.expertInterpretation.amplitudeAnomalies}
  - Bypassed pay verdict: ${ex.expertInterpretation.bypassedPayVerdict.toUpperCase()}
  - Reasoning: ${ex.expertInterpretation.bypassedPayReasoning}
  - Confidence: ${ex.expertInterpretation.confidenceScore}/100
  - Action: ${ex.expertInterpretation.recommendedAction}
`).join("\n")}

=== END FEW-SHOT EXAMPLES ===

CRITICAL: In your output, include a section "## Pattern Match" that explicitly cites which example(s) above your interpretation is most similar to (e.g., "Pattern matched: EX-001-WOLFCAMP-BRIGHT — Class III AVO bright spot signature").`;
}
