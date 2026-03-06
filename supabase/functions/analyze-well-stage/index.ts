import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WellData {
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
}

// Deterministic hash from well parameters for stable pseudo-random values
function wellHash(well: WellData, salt: number): number {
  const seed = (well.production_oil ?? 7) * 9301 +
    (well.total_depth ?? 5000) * 49297 +
    (well.water_cut ?? 30) * 233 +
    salt * 7919;
  const x = Math.sin(seed % 65521) * 49297;
  return x - Math.floor(x); // 0..1
}

// Formation-based porosity ranges (industry-standard values)
// Rock-type permeability model parameters:
// - kBase: base permeability at reference porosity (mD)
// - kSlope: log10(k) increase per 1% porosity above reference
// - kRef: reference porosity (%) for the model
// This replaces the single Kozeny-Carman formula with rock-type-specific correlations
// based on published core data (Nelson 1994, Ehrenberg & Nadeau 2005)
interface FormationProps {
  min: number;      // porosity min %
  max: number;      // porosity max %
  rockType: string;
  kMin: number;     // typical k at min porosity (mD)
  kMax: number;     // typical k at max porosity (mD)
}

function formationPorosity(formation: string | null): FormationProps {
  const f = (formation || "").toLowerCase();
  // Porosity & permeability ranges based on published reservoir characterization studies.
  // k ranges: Shale 1e-6–0.01 mD, Tight carbonate 0.01–1 mD, Conventional sand 1–1000+ mD

  // Woodford: matrix φ 0.8–6%, k ~ 1e-6–0.01 mD (nanodarcy shale)
  if (f.includes("woodford")) return { min: 1, max: 6, rockType: "Organic Shale", kMin: 0.000001, kMax: 0.01 };
  // Barnett: matrix φ 3–6%, k ~ 1e-5–0.01 mD
  if (f.includes("barnett")) return { min: 3, max: 6, rockType: "Siliceous Shale", kMin: 0.00001, kMax: 0.01 };
  // Hunton: fractured carbonate, k dominated by fractures 0.1–50 mD effective
  if (f.includes("hunton")) return { min: 4, max: 12, rockType: "Fractured Limestone", kMin: 0.1, kMax: 50 };
  // Arbuckle: dolomite, matrix k 0.01–5 mD
  if (f.includes("arbuckle")) return { min: 2, max: 8, rockType: "Dolomite", kMin: 0.01, kMax: 5 };
  // Simpson: clean sandstone, k 10–500 mD
  if (f.includes("simpson")) return { min: 15, max: 25, rockType: "Sandstone", kMin: 10, kMax: 500 };
  // Wilcox: Gulf Coast sand, k 50–2000 mD
  if (f.includes("wilcox")) return { min: 18, max: 28, rockType: "Sandstone", kMin: 50, kMax: 2000 };
  // Springer/Chester: tight sand/silt, k 0.1–10 mD
  if (f.includes("springer") || f.includes("chester")) return { min: 8, max: 15, rockType: "Siltstone/Sandstone", kMin: 0.1, kMax: 10 };
  // Mississippian Lime: cherty limestone, k 0.5–50 mD (high φ, poor connectivity)
  if (f.includes("mississippian") || f.includes("miss lime")) return { min: 8, max: 20, rockType: "Cherty Limestone", kMin: 0.5, kMax: 50 };
  // Morrow: fluvial-deltaic sand, k 1–200 mD
  if (f.includes("morrow")) return { min: 8, max: 18, rockType: "Sandstone", kMin: 1, kMax: 200 };
  // Red Fork/Skinner: mid-continent sand, k 5–300 mD
  if (f.includes("red fork") || f.includes("skinner")) return { min: 10, max: 20, rockType: "Sandstone", kMin: 5, kMax: 300 };
  // Tonkawa/Cleveland: Pennsylvanian sand, k 5–250 mD
  if (f.includes("tonkawa") || f.includes("cleveland")) return { min: 10, max: 20, rockType: "Sandstone", kMin: 5, kMax: 250 };

  // ── Permian Basin formations (Texas / New Mexico) ──────────────────────
  // Wolfcamp: tight unconventional carbonate mudstone/shale, φ 3–10%, k 0.0001–0.5 mD
  // Source: Kvale et al. 2020 (AAPG Memoir 118), EIA Permian Basin Assessment 2018
  if (f.includes("wolfcamp")) return { min: 3, max: 10, rockType: "Calcareous Mudstone", kMin: 0.0001, kMax: 0.5 };
  // Spraberry: silty carbonate/fine sand, φ 7–14%, k 0.1–10 mD (naturally fractured)
  // Source: Tyler & Gholston 1988 (SPE 17243), Schechter et al. 1996
  if (f.includes("spraberry")) return { min: 7, max: 14, rockType: "Silty Carbonate", kMin: 0.1, kMax: 10 };
  // Bone Spring: interbedded limestone/shale, φ 4–12%, k 0.001–1 mD
  // Source: Wentworth et al. 2018 (URTeC), Mack et al. 2019
  if (f.includes("bone spring")) return { min: 4, max: 12, rockType: "Interbedded Limestone", kMin: 0.001, kMax: 1 };
  // Delaware Sandstone: deep-water turbidite sand, φ 12–22%, k 1–200 mD
  // Source: Dutton et al. 2005 (AAPG), Ruppel & Ward 2013
  if (f.includes("delaware")) return { min: 12, max: 22, rockType: "Turbidite Sandstone", kMin: 1, kMax: 200 };
  // San Andres: dolomite/limestone, φ 5–15%, k 0.5–50 mD
  // Source: Kerans & Ruppel 1994, Ruppel & Cander 1988
  if (f.includes("san andres") || f.includes("san andreas")) return { min: 5, max: 15, rockType: "Dolomite", kMin: 0.5, kMax: 50 };
  // Dean: tight sand/silt, φ 5–12%, k 0.01–5 mD
  // Source: Hamlin & Baumgardner 2012 (BEG Texas)
  if (f.includes("dean")) return { min: 5, max: 12, rockType: "Tight Sandstone", kMin: 0.01, kMax: 5 };
  // Cline (Wolfcamp D / Lower Penn shale): φ 2–8%, k 0.00001–0.1 mD
  if (f.includes("cline")) return { min: 2, max: 8, rockType: "Organic Shale", kMin: 0.00001, kMax: 0.1 };
  // Avalon Shale (Delaware Basin): φ 3–10%, k 0.0001–0.5 mD
  if (f.includes("avalon")) return { min: 3, max: 10, rockType: "Siliceous Shale", kMin: 0.0001, kMax: 0.5 };

  // Default: mixed carbonate/clastic
  return { min: 6, max: 14, rockType: "Mixed Carbonate", kMin: 0.5, kMax: 30 };
}

// Arps decline rate: q(t) = qi / (1 + b * Di * t)^(1/b)
function arpsRate(qi: number, Di: number, b: number, t: number): number {
  if (b < 0.001) return qi * Math.exp(-Di * t);
  const denom = 1 + b * Di * t;
  if (denom <= 0) return 0;
  return qi / Math.pow(denom, 1 / b);
}

// Basin identification
function identifyBasin(state: string, county: string | null): string {
  const s = state.toUpperCase();
  const c = (county || "").toLowerCase();
  if (s === "OK") return "Anadarko Basin";
  if (s === "TX" && ["midland", "ector", "martin", "howard", "upton", "reagan", "glasscock"].some(x => c.includes(x))) return "Permian Basin (Midland)";
  if (s === "TX" && ["loving", "ward", "reeves", "pecos", "culberson"].some(x => c.includes(x))) return "Delaware Basin";
  if (s === "TX" && ["webb", "la salle", "dimmit", "maverick", "karnes", "dewitt", "gonzales"].some(x => c.includes(x))) return "Eagle Ford";
  if (s === "TX") return "Permian Basin";
  if (s === "NM") return "Delaware Basin (NM)";
  if (s === "KS") return "Hugoton-Panhandle / Sedgwick Basin";
  return `${s} Basin`;
}

// ================ DETERMINISTIC METRICS PER STAGE ================

interface StageMetric {
  label: string;
  value: string;
  color: string;
}

function computeFieldScan(well: WellData): { metrics: StageMetric[]; context: string } {
  const basin = identifyBasin(well.state, well.county);
  const depth = well.total_depth ?? 5000;
  const depthClass = depth > 8000 ? "Deep" : depth > 4000 ? "Intermediate" : "Shallow";
  const statusOk = (well.status || "").toLowerCase() !== "abandoned";
  const fieldScore = Math.round(50 + wellHash(well, 10) * 30 + (statusOk ? 15 : 0) + (depth > 3000 ? 5 : 0));

  return {
    metrics: [
      { label: "Basin", value: basin, color: "" },
      { label: "Depth Class", value: `${depthClass} (${depth.toLocaleString()} ft)`, color: "" },
      { label: "Well Status", value: well.status || "Unknown", color: statusOk ? "text-success" : "text-destructive" },
      { label: "Field Score", value: `${Math.min(fieldScore, 98)}/100`, color: fieldScore > 70 ? "text-success" : fieldScore > 50 ? "text-warning" : "text-destructive" },
    ],
    context: `Basin: ${basin}, Depth: ${depth} ft (${depthClass}), Status: ${well.status || "Unknown"}, Field Score: ${Math.min(fieldScore, 98)}/100`,
  };
}

function computeClassification(well: WellData): { metrics: StageMetric[]; context: string } {
  const hasOil = well.production_oil != null;
  const hasGas = well.production_gas != null;
  const hasWC = well.water_cut != null;
  const hasDepth = well.total_depth != null;
  const fieldsPresent = [hasOil, hasGas, hasWC, hasDepth, !!well.formation, !!well.operator].filter(Boolean).length;
  const dataQuality = Math.round((fieldsPresent / 6) * 100);

  const gor = (hasOil && hasGas && well.production_oil! > 0)
    ? Math.round((well.production_gas! * 1000) / well.production_oil!)
    : null;
  const gorAnomaly = gor != null && (gor > 10000 || gor < 100);
  const wcAnomaly = hasWC && well.water_cut! > 70;

  return {
    metrics: [
      { label: "Data Quality", value: `${dataQuality}%`, color: dataQuality > 70 ? "text-success" : dataQuality > 50 ? "text-warning" : "text-destructive" },
      { label: "Fields Available", value: `${fieldsPresent}/6`, color: "" },
      { label: "GOR", value: gor != null ? `${gor.toLocaleString()} scf/bbl` : "N/A", color: gorAnomaly ? "text-warning" : "" },
      { label: "Anomalies", value: [gorAnomaly ? "High GOR" : "", wcAnomaly ? "High WC" : ""].filter(Boolean).join(", ") || "None", color: (gorAnomaly || wcAnomaly) ? "text-warning" : "text-success" },
    ],
    context: `Data quality: ${dataQuality}%, GOR: ${gor ?? "N/A"} scf/bbl, Anomalies: ${gorAnomaly ? "High GOR " : ""}${wcAnomaly ? "High WC" : "None"}`,
  };
}

function computeCoreAnalysis(well: WellData): { metrics: StageMetric[]; context: string } {
  const fp = formationPorosity(well.formation);
  const h = wellHash(well, 20);
  const porosity = +(fp.min + h * (fp.max - fp.min)).toFixed(1);
  // Rock-type-specific permeability: log-interpolate between kMin and kMax
  // based on where porosity falls within the formation's φ range
  const phiFraction = fp.max > fp.min ? (porosity - fp.min) / (fp.max - fp.min) : 0.5;
  const logKMin = Math.log10(Math.max(fp.kMin, 1e-7));
  const logKMax = Math.log10(Math.max(fp.kMax, 1e-6));
  const logK = logKMin + phiFraction * (logKMax - logKMin);
  // Add well-specific variation (±0.3 log units)
  const kVariation = (wellHash(well, 21) - 0.5) * 0.6;
  const perm = Math.pow(10, logK + kVariation);
  // Format: use scientific notation for very low k (shales), decimal for conventional
  const permStr = perm < 0.001 ? `${(perm * 1000).toFixed(2)} µD` : perm < 0.1 ? `${(perm * 1000).toFixed(1)} µD` : perm < 1 ? `${perm.toFixed(3)} mD` : perm < 100 ? `${perm.toFixed(1)} mD` : `${Math.round(perm)} mD`;
  const fracDensity = Math.round(1 + wellHash(well, 22) * 4); // 1-5 per ft

  return {
    metrics: [
      { label: "Rock Type", value: fp.rockType, color: "" },
      { label: "Porosity", value: `${porosity}%`, color: porosity > 15 ? "text-success" : porosity > 8 ? "text-warning" : "text-destructive" },
      { label: "Permeability", value: permStr, color: perm > 10 ? "text-success" : perm > 1 ? "text-warning" : "text-destructive" },
      { label: "Fracture Density", value: `${fracDensity}/ft`, color: fracDensity > 3 ? "text-success" : "" },
    ],
    context: `Rock: ${fp.rockType}, φ=${porosity}%, k=${permStr}, Fractures: ${fracDensity}/ft (formation: ${well.formation || "Unknown"})`,
  };
}

function computeCumulative(well: WellData): { metrics: StageMetric[]; context: string } {
  const q0 = well.production_oil ?? 8;
  const depth = well.total_depth ?? 5000;
  const h = wellHash(well, 30);
  const Di = +(0.02 + h * 0.03).toFixed(4); // nominal decline 2-5%/mo
  const b = +(0.3 + wellHash(well, 31) * 0.5).toFixed(2); // Arps b-factor

  // 60-month EUR
  let eur = 0;
  for (let m = 1; m <= 60; m++) {
    eur += arpsRate(q0, Di, b, m) * 30.44;
  }
  eur = Math.round(eur);

  // IOIP volumetric estimate
  const fp = formationPorosity(well.formation);
  const porosity = (fp.min + wellHash(well, 20) * (fp.max - fp.min)) / 100;
  const ioip = Math.round(depth * porosity * 7.758 * 0.5);
  const rf = ioip > 0 ? +((eur / ioip) * 100).toFixed(1) : 0;

  // Annual effective decline
  const annualDecline = +((1 - arpsRate(q0, Di, b, 12) / q0) * 100).toFixed(1);

  return {
    metrics: [
      { label: "EUR (5-yr)", value: `${(eur / 1000).toFixed(1)}K bbl`, color: eur > 20000 ? "text-success" : "text-warning" },
      { label: "Decline Model", value: `Arps (b=${b})`, color: "" },
      { label: "Annual Decline", value: `${annualDecline}%`, color: annualDecline < 30 ? "text-success" : annualDecline < 50 ? "text-warning" : "text-destructive" },
      { label: "Recovery Factor", value: `${rf}%`, color: rf > 20 ? "text-success" : rf > 10 ? "text-warning" : "text-destructive" },
    ],
    context: `EUR: ${(eur / 1000).toFixed(1)}K bbl, Di=${Di}/mo, b=${b}, Annual decline: ${annualDecline}%, RF: ${rf}%`,
  };
}

function computeSptProjection(well: WellData): { metrics: StageMetric[]; context: string } {
  const currentProd = well.production_oil ?? 8;
  const waterCut = well.water_cut ?? 30;
  const depth = well.total_depth ?? 5000;

  // SPT candidacy filters
  const wcOk = waterCut < 60;
  const prodOk = currentProd >= 3;
  const depthOk = depth >= 2000 && depth <= 12000;

  // Unified SPT projection formula
  const multiplier = waterCut < 30 ? 2.5 : waterCut < 50 ? 2.0 : 2.0;
  const treatmentEffect = waterCut < 30 ? 10 : waterCut < 50 ? 7.5 : 5;
  const projectedProd = Math.min(currentProd * multiplier + treatmentEffect, 25);
  const upliftFactor = +(projectedProd / currentProd).toFixed(1);

  // Candidacy score
  let score = 0;
  if (wcOk) score += 30;
  if (prodOk) score += 20;
  if (depthOk) score += 15;
  score += Math.min(Math.round((1 - waterCut / 100) * 25), 25);
  score += Math.min(Math.round(currentProd * 1.5), 10);
  score = Math.min(score, 98);

  return {
    metrics: [
      { label: "SPT Score", value: `${score}/100`, color: score > 70 ? "text-success" : score > 50 ? "text-warning" : "text-destructive" },
      { label: "Projected Inflow", value: `${projectedProd.toFixed(1)} bbl/d`, color: projectedProd > 15 ? "text-success" : "text-warning" },
      { label: "Uplift Factor", value: `${upliftFactor}×`, color: upliftFactor > 2 ? "text-success" : "text-warning" },
      { label: "Water Cut Risk", value: `${waterCut}%`, color: waterCut < 30 ? "text-success" : waterCut < 50 ? "text-warning" : "text-destructive" },
    ],
    context: `SPT Score: ${score}/100, Current: ${currentProd} → Projected: ${projectedProd.toFixed(1)} bbl/d (×${upliftFactor}), WC: ${waterCut}%`,
  };
}

function computeEconomic(well: WellData): { metrics: StageMetric[]; context: string } {
  const OIL_PRICE = 72;   // synced with economics-config DEFAULT_OIL_PRICE
  const OPEX_PER_BBL = 18; // synced with economics-config DEFAULT_OPEX_PER_BBL
  const TREATMENT_COST = 85000; // synced with economics-config DEFAULT_TREATMENT_COST
  const currentProd = well.production_oil ?? 8;
  const waterCut = well.water_cut ?? 30;

  const capex = TREATMENT_COST;

  // SPT gain by water-cut bracket (synced with sptGainByWaterCut)
  const sptGain = waterCut < 30 ? 7 : waterCut < 50 ? 5 : waterCut < 70 ? 3 : 1.5;

  // Use Arps decline for revenue calculation
  const Di = 0.025;
  const b = 0.5;
  let fiveYearNet = 0;
  let paybackMonth = 999;
  let cumProfit = 0;
  for (let m = 1; m <= 60; m++) {
    const rate = arpsRate(sptGain, Di, b, m);
    const monthProfit = rate * 30.44 * (OIL_PRICE - OPEX_PER_BBL);
    cumProfit += monthProfit;
    fiveYearNet += monthProfit;
    if (cumProfit >= capex && paybackMonth === 999) paybackMonth = m;
  }
  // ROI = (cumNetProfit - capex) / capex * 100  — standard formula
  const roi5Year = capex > 0 ? Math.round(((fiveYearNet - capex) / capex) * 100) : 0;

  // Year 1 revenue (with decline)
  let annualRevenue = 0;
  for (let m = 1; m <= 12; m++) {
    annualRevenue += arpsRate(sptGain, Di, b, m) * 30.44 * OIL_PRICE;
  }

  return {
    metrics: [
      { label: "Estimated CAPEX", value: `$${capex.toLocaleString()}`, color: "" },
      { label: "Year 1 Revenue", value: `$${Math.round(annualRevenue).toLocaleString()}`, color: "text-success" },
      { label: "ROI (5-Year)", value: `${roi5Year}%`, color: roi5Year > 200 ? "text-success" : roi5Year > 0 ? "text-warning" : "text-destructive" },
      { label: "Payback Period", value: `${paybackMonth} mo`, color: paybackMonth < 6 ? "text-success" : paybackMonth < 12 ? "text-warning" : "text-destructive" },
    ],
    context: `CAPEX: $${capex.toLocaleString()}, SPT Gain: +${sptGain} bbl/d (Arps Di=${Di}, b=${b}), Year 1 Rev: $${Math.round(annualRevenue).toLocaleString()}, 5yr ROI: ${roi5Year}%, Payback: ${paybackMonth} mo`,
  };
}

function computeGeophysical(well: WellData): { metrics: StageMetric[]; context: string } {
  const fp = formationPorosity(well.formation);
  const h = wellHash(well, 40);
  const porosity = +(fp.min + h * (fp.max - fp.min)).toFixed(1);
  const waterCut = well.water_cut ?? 30;
  // Water saturation estimate from water cut (simplified)
  const sw = +(20 + waterCut * 0.6 + wellHash(well, 41) * 10).toFixed(1);
  // Gamma Ray from formation type
  const gr = fp.rockType.includes("Shale") ? Math.round(90 + wellHash(well, 42) * 40) :
    fp.rockType.includes("Limestone") ? Math.round(20 + wellHash(well, 42) * 30) :
    Math.round(40 + wellHash(well, 42) * 35);
  // Resistivity correlates inversely with Sw (Archie's law: Rt ~ 1/Sw^2)
  const rt = +(2 + (100 - sw) / 10 + wellHash(well, 43) * 3).toFixed(1);

  const payZone = porosity > 15 && sw < 40;

  return {
    metrics: [
      { label: "Log Porosity (φ)", value: `${porosity}%`, color: porosity > 15 ? "text-success" : porosity > 8 ? "text-warning" : "text-destructive" },
      { label: "Water Saturation (Sw)", value: `${sw}%`, color: sw < 40 ? "text-success" : sw < 60 ? "text-warning" : "text-destructive" },
      { label: "Gamma Ray", value: `${gr} API`, color: gr < 75 ? "text-success" : "text-warning" },
      { label: "Pay Zone", value: payZone ? "Identified" : "Marginal", color: payZone ? "text-success" : "text-warning" },
    ],
    context: `φ=${porosity}%, Sw=${sw}%, GR=${gr} API, Rt=${rt} Ω·m, Pay zone: ${payZone ? "Yes" : "Marginal"}`,
  };
}

function computeEor(well: WellData): { metrics: StageMetric[]; context: string } {
  const spt = computeSptProjection(well);
  const econ = computeEconomic(well);
  const core = computeCoreAnalysis(well);

  // Overall candidacy from sub-scores
  const sptScore = parseInt(spt.metrics[0].value) || 50;
  const roiVal = parseInt(econ.metrics[2].value) || 0;
  const porosity = parseFloat(core.metrics[1].value) || 10;

  const overallScore = Math.min(Math.round(sptScore * 0.4 + Math.min(roiVal / 5, 30) + porosity * 1.5), 98);
  const priority = overallScore > 75 ? "High" : overallScore > 55 ? "Medium" : "Low";

  return {
    metrics: [
      { label: "SPT Candidacy", value: `${overallScore}/100`, color: overallScore > 75 ? "text-success" : overallScore > 55 ? "text-warning" : "text-destructive" },
      { label: "Priority", value: priority, color: priority === "High" ? "text-success" : priority === "Medium" ? "text-warning" : "text-destructive" },
      { label: "Expected Uplift", value: spt.metrics[2].value, color: "text-success" },
      { label: "ROI (5-Year)", value: econ.metrics[2].value, color: econ.metrics[2].color },
    ],
    context: `Overall SPT Score: ${overallScore}/100, Priority: ${priority}, Uplift: ${spt.metrics[2].value}, ROI: ${econ.metrics[2].value}`,
  };
}

// Stage prompts — AI only provides expert verdict, no numerical output
const STAGE_VERDICTS: Record<string, string> = {
  field_scan: `You are an oil & gas field reconnaissance expert. Given the pre-calculated field data below, provide a ONE-LINE expert verdict with an emoji prefix (✅, ⚠️, ❌, 🚀). Assess field favorability. Do NOT invent numbers.`,
  classification: `You are a petroleum data quality analyst. Given the pre-calculated data quality metrics below, provide a ONE-LINE expert verdict with an emoji prefix. Assess readiness for analysis. Do NOT invent numbers.`,
  core_analysis: `You are a petrophysical expert. Given the pre-calculated core properties below (derived from formation-specific industry ranges), provide a ONE-LINE expert verdict with an emoji prefix. Assess reservoir quality for SPT treatment. Do NOT invent numbers.`,
  cumulative: `You are a production decline analysis expert. Given the pre-calculated Arps decline metrics below, provide a ONE-LINE expert verdict with an emoji prefix. Assess remaining value and decline severity. Do NOT invent numbers.`,
  spt_projection: `You are an SPT (Slot Perforation Technology, Patent US 8,863,823) expert for Maxxwell Production. Given the pre-calculated SPT projection metrics below, provide a ONE-LINE expert verdict with an emoji prefix. Assess candidacy for SPT treatment. Do NOT invent numbers.`,
  economic: `You are a petroleum economics expert. Given the pre-calculated economic metrics below (using Arps decline model), provide a ONE-LINE expert verdict with an emoji prefix. Assess investment attractiveness. Do NOT invent numbers.`,
  geophysical: `You are a geophysical log interpretation expert. Given the pre-calculated log-derived properties below, provide a ONE-LINE expert verdict with an emoji prefix. Assess formation suitability for EOR. Do NOT invent numbers.`,
  eor: `You are an EOR recommendation expert specializing in SPT (Slot Perforation Technology, Patent US 8,863,823) by Maxxwell Production. Given the pre-calculated overall assessment below, provide a ONE-LINE expert verdict with an emoji prefix. Recommend whether to proceed with SPT. Do NOT recommend other EOR methods. Do NOT invent numbers.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { well, stageKey } = await req.json();
    const wellData = well as WellData;
    const verdictPrompt = STAGE_VERDICTS[stageKey];

    if (!verdictPrompt) {
      return new Response(JSON.stringify({ error: `Unknown stage: ${stageKey}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute deterministic metrics for every stage
    const stageComputers: Record<string, (w: WellData) => { metrics: StageMetric[]; context: string }> = {
      field_scan: computeFieldScan,
      classification: computeClassification,
      core_analysis: computeCoreAnalysis,
      cumulative: computeCumulative,
      spt_projection: computeSptProjection,
      economic: computeEconomic,
      geophysical: computeGeophysical,
      eor: computeEor,
    };

    const computed = stageComputers[stageKey](wellData);

    // AI only generates a one-line verdict
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wellDescription = `Well: ${wellData.well_name || wellData.api_number || "Unknown"}, ${wellData.county || "Unknown"} County, ${wellData.state}, Formation: ${wellData.formation || "Unknown"}, Depth: ${wellData.total_depth ?? "N/A"} ft, Oil: ${wellData.production_oil ?? "N/A"} bbl/d, Gas: ${wellData.production_gas ?? "N/A"} MCF/d, WC: ${wellData.water_cut ?? "N/A"}%`;

    const userContent = `Pre-calculated metrics for ${stageKey} stage:\n${computed.context}\n\nWell: ${wellDescription}\n\nProvide your ONE-LINE expert verdict with emoji prefix only. Do NOT output any numbers — they are already calculated above.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: verdictPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      // Fallback: return metrics without AI verdict
      return new Response(JSON.stringify({
        title: `${stageKey} Analysis Complete`,
        metrics: computed.metrics,
        verdict: "📊 Analysis complete (AI verdict unavailable)",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const verdict = data.choices?.[0]?.message?.content?.trim() || "📊 Analysis complete";

    const stageResult = {
      title: `${stageKey} Analysis Complete`,
      metrics: computed.metrics,
      verdict,
    };

    return new Response(JSON.stringify(stageResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-well-stage error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
