import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WellData {
  id?: string;
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
  latitude: number | null;
  longitude: number | null;
}

interface ProductionRecord {
  production_month: string;
  oil_bbl: number | null;
  gas_mcf: number | null;
  water_bbl: number | null;
  days_on: number | null;
}

interface WellLogRecord {
  measured_depth: number;
  gamma_ray: number | null;
  resistivity: number | null;
  porosity: number | null;
  water_saturation: number | null;
  sp: number | null;
  density: number | null;
  neutron_porosity: number | null;
}

// ─── Helper: Supabase client ──────────────────────────────
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ─── Fetch real production history ────────────────────────
async function fetchProductionHistory(wellId: string): Promise<ProductionRecord[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from("production_history")
    .select("production_month, oil_bbl, gas_mcf, water_bbl, days_on")
    .eq("well_id", wellId)
    .order("production_month", { ascending: true });
  return (data || []) as ProductionRecord[];
}

// ─── Fetch real well logs ─────────────────────────────────
async function fetchWellLogs(wellId: string): Promise<WellLogRecord[]> {
  const sb = getSupabase();
  const { data } = await sb
    .from("well_logs")
    .select("measured_depth, gamma_ray, resistivity, porosity, water_saturation, sp, density, neutron_porosity")
    .eq("well_id", wellId)
    .order("measured_depth", { ascending: true });
  return (data || []) as WellLogRecord[];
}

// Deterministic hash from well parameters for stable pseudo-random values
function wellHash(well: WellData, salt: number): number {
  const seed = (well.production_oil ?? 7) * 9301 +
    (well.total_depth ?? 5000) * 49297 +
    (well.water_cut ?? 30) * 233 +
    salt * 7919;
  const x = Math.sin(seed % 65521) * 49297;
  return x - Math.floor(x);
}

// Formation-based porosity ranges
interface FormationProps {
  min: number;
  max: number;
  rockType: string;
  kMin: number;
  kMax: number;
}

function formationPorosity(formation: string | null): FormationProps {
  const f = (formation || "").toLowerCase();
  if (f.includes("woodford")) return { min: 1, max: 6, rockType: "Organic Shale", kMin: 0.000001, kMax: 0.01 };
  if (f.includes("barnett")) return { min: 3, max: 6, rockType: "Siliceous Shale", kMin: 0.00001, kMax: 0.01 };
  if (f.includes("hunton")) return { min: 4, max: 12, rockType: "Fractured Limestone", kMin: 0.1, kMax: 50 };
  if (f.includes("arbuckle")) return { min: 2, max: 8, rockType: "Dolomite", kMin: 0.01, kMax: 5 };
  if (f.includes("simpson")) return { min: 15, max: 25, rockType: "Sandstone", kMin: 10, kMax: 500 };
  if (f.includes("wilcox")) return { min: 18, max: 28, rockType: "Sandstone", kMin: 50, kMax: 2000 };
  if (f.includes("springer") || f.includes("chester")) return { min: 8, max: 15, rockType: "Siltstone/Sandstone", kMin: 0.1, kMax: 10 };
  if (f.includes("mississippian") || f.includes("miss lime")) return { min: 8, max: 20, rockType: "Cherty Limestone", kMin: 0.5, kMax: 50 };
  if (f.includes("morrow")) return { min: 8, max: 18, rockType: "Sandstone", kMin: 1, kMax: 200 };
  if (f.includes("red fork") || f.includes("skinner")) return { min: 10, max: 20, rockType: "Sandstone", kMin: 5, kMax: 300 };
  if (f.includes("tonkawa") || f.includes("cleveland")) return { min: 10, max: 20, rockType: "Sandstone", kMin: 5, kMax: 250 };
  if (f.includes("wolfcamp")) return { min: 3, max: 10, rockType: "Calcareous Mudstone", kMin: 0.0001, kMax: 0.5 };
  if (f.includes("spraberry")) return { min: 7, max: 14, rockType: "Silty Carbonate", kMin: 0.1, kMax: 10 };
  if (f.includes("bone spring")) return { min: 4, max: 12, rockType: "Interbedded Limestone", kMin: 0.001, kMax: 1 };
  if (f.includes("delaware")) return { min: 12, max: 22, rockType: "Turbidite Sandstone", kMin: 1, kMax: 200 };
  if (f.includes("san andres") || f.includes("san andreas")) return { min: 5, max: 15, rockType: "Dolomite", kMin: 0.5, kMax: 50 };
  if (f.includes("dean")) return { min: 5, max: 12, rockType: "Tight Sandstone", kMin: 0.01, kMax: 5 };
  if (f.includes("cline")) return { min: 2, max: 8, rockType: "Organic Shale", kMin: 0.00001, kMax: 0.1 };
  if (f.includes("avalon")) return { min: 3, max: 10, rockType: "Siliceous Shale", kMin: 0.0001, kMax: 0.5 };
  return { min: 6, max: 14, rockType: "Mixed Carbonate", kMin: 0.5, kMax: 30 };
}

// Arps decline rate
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

// ================ STAGE METRICS ================
interface StageMetric { label: string; value: string; color: string; }

function computeFieldScan(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const basin = identifyBasin(well.state, well.county);
  const depth = well.total_depth ?? 5000;
  const depthClass = depth > 8000 ? "Deep" : depth > 4000 ? "Intermediate" : "Shallow";
  const statusOk = (well.status || "").toLowerCase() !== "abandoned";
  const hasCoords = well.latitude != null && well.longitude != null;
  const hasDepth = well.total_depth != null;
  const fieldScore = Math.round(50 + wellHash(well, 10) * 30 + (statusOk ? 15 : 0) + (hasDepth ? 5 : 0));
  const dataSource = (hasCoords && hasDepth && well.status) ? "REAL DATA" : "PARTIAL";

  return {
    metrics: [
      { label: "Basin", value: basin, color: "" },
      { label: "Depth Class", value: `${depthClass} (${depth.toLocaleString()} ft)`, color: "" },
      { label: "Well Status", value: well.status || "Unknown", color: statusOk ? "text-success" : "text-destructive" },
      { label: "Field Score", value: `${Math.min(fieldScore, 98)}/100`, color: fieldScore > 70 ? "text-success" : fieldScore > 50 ? "text-warning" : "text-destructive" },
    ],
    context: `[${dataSource}] Basin: ${basin}, Depth: ${depth} ft (${depthClass}), Status: ${well.status || "Unknown"}, Coords: ${hasCoords ? `${well.latitude},${well.longitude}` : "N/A"}, Field Score: ${Math.min(fieldScore, 98)}/100`,
    dataSource,
  };
}

function computeClassification(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
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
  const dataSource = dataQuality >= 67 ? "REAL DATA" : "PARTIAL";

  return {
    metrics: [
      { label: "Data Quality", value: `${dataQuality}%`, color: dataQuality > 70 ? "text-success" : dataQuality > 50 ? "text-warning" : "text-destructive" },
      { label: "Fields Available", value: `${fieldsPresent}/6`, color: "" },
      { label: "GOR", value: gor != null ? `${gor.toLocaleString()} scf/bbl` : "N/A", color: gorAnomaly ? "text-warning" : "" },
      { label: "Anomalies", value: [gorAnomaly ? "High GOR" : "", wcAnomaly ? "High WC" : ""].filter(Boolean).join(", ") || "None", color: (gorAnomaly || wcAnomaly) ? "text-warning" : "text-success" },
    ],
    context: `[${dataSource}] Data quality: ${dataQuality}%, GOR: ${gor ?? "N/A"} scf/bbl, Anomalies: ${gorAnomaly ? "High GOR " : ""}${wcAnomaly ? "High WC" : "None"}`,
    dataSource,
  };
}

function computeCoreAnalysis(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const fp = formationPorosity(well.formation);
  const h = wellHash(well, 20);
  const porosity = +(fp.min + h * (fp.max - fp.min)).toFixed(1);
  const phiFraction = fp.max > fp.min ? (porosity - fp.min) / (fp.max - fp.min) : 0.5;
  const logKMin = Math.log10(Math.max(fp.kMin, 1e-7));
  const logKMax = Math.log10(Math.max(fp.kMax, 1e-6));
  const logK = logKMin + phiFraction * (logKMax - logKMin);
  const kVariation = (wellHash(well, 21) - 0.5) * 0.6;
  const perm = Math.pow(10, logK + kVariation);
  const permStr = perm < 0.001 ? `${(perm * 1000).toFixed(2)} µD` : perm < 0.1 ? `${(perm * 1000).toFixed(1)} µD` : perm < 1 ? `${perm.toFixed(3)} mD` : perm < 100 ? `${perm.toFixed(1)} mD` : `${Math.round(perm)} mD`;
  const fracDensity = Math.round(1 + wellHash(well, 22) * 4);
  const dataSource = well.formation ? "FORMATION-BASED MODEL" : "SYNTHETIC";

  return {
    metrics: [
      { label: "Rock Type", value: fp.rockType, color: "" },
      { label: "Porosity", value: `${porosity}%`, color: porosity > 15 ? "text-success" : porosity > 8 ? "text-warning" : "text-destructive" },
      { label: "Permeability", value: permStr, color: perm > 10 ? "text-success" : perm > 1 ? "text-warning" : "text-destructive" },
      { label: "Fracture Density", value: `${fracDensity}/ft`, color: fracDensity > 3 ? "text-success" : "" },
    ],
    context: `[${dataSource}] Rock: ${fp.rockType}, φ=${porosity}%, k=${permStr}, Fractures: ${fracDensity}/ft (formation: ${well.formation || "Unknown"})`,
    dataSource,
  };
}

// ─── Cumulative with REAL production_history ───────────────
function computeCumulativeReal(well: WellData, history: ProductionRecord[]): { metrics: StageMetric[]; context: string; dataSource: string } {
  // Sort by month
  const sorted = [...history].sort((a, b) => a.production_month.localeCompare(b.production_month));
  const oilRates = sorted.map(r => (r.oil_bbl ?? 0) / Math.max(r.days_on ?? 30, 1));
  const totalOil = sorted.reduce((s, r) => s + (r.oil_bbl ?? 0), 0);
  const totalGas = sorted.reduce((s, r) => s + (r.gas_mcf ?? 0), 0);
  const totalWater = sorted.reduce((s, r) => s + (r.water_bbl ?? 0), 0);
  const months = sorted.length;

  // Peak rate
  const peakRate = Math.max(...oilRates, 0.1);
  const latestRate = oilRates.length > 0 ? oilRates[oilRates.length - 1] : 0;

  // Effective decline from peak to latest
  const peakIdx = oilRates.indexOf(peakRate);
  const monthsSincePeak = months - peakIdx - 1;
  let effectiveDecline = 0;
  if (monthsSincePeak > 0 && peakRate > 0 && latestRate > 0) {
    effectiveDecline = +((1 - Math.pow(latestRate / peakRate, 12 / monthsSincePeak)) * 100).toFixed(1);
  }

  // Water cut from production data
  const totalLiquid = totalOil + totalWater;
  const avgWaterCut = totalLiquid > 0 ? +((totalWater / totalLiquid) * 100).toFixed(1) : 0;

  // Simple EUR extrapolation (use last 6 months average rate, project 60 months with Di)
  const last6 = oilRates.slice(-6);
  const avgLast6 = last6.length > 0 ? last6.reduce((s, v) => s + v, 0) / last6.length : latestRate;
  const Di = effectiveDecline > 0 ? effectiveDecline / 1200 : 0.03;
  let eurExtra = 0;
  for (let m = 1; m <= 60; m++) eurExtra += arpsRate(avgLast6, Di, 0.5, m) * 30.44;
  const totalEur = totalOil + eurExtra;

  // IOIP estimate using volumetric method: IOIP = 7758 * A * h * φ * (1 - Sw) / Bo
  const fp = formationPorosity(well.formation);
  const phiMid = (fp.min + fp.max) / 200; // midpoint porosity as fraction
  const A = 40; // drainage area in acres (conservative for single well)
  const h = 30; // net pay thickness in feet
  const Sw = 0.35; // water saturation
  const Bo = 1.2; // formation volume factor
  const ioip = Math.round(7758 * A * h * phiMid * (1 - Sw) / Bo);
  const rfRaw = ioip > 0 ? (totalEur / ioip) * 100 : 0;
  const rf = +Math.min(rfRaw, 100).toFixed(1); // Cap at 100%

  return {
    metrics: [
      { label: "Cumulative Oil", value: `${(totalOil / 1000).toFixed(1)}K bbl`, color: "text-success" },
      { label: "Peak → Current", value: `${peakRate.toFixed(1)} → ${latestRate.toFixed(1)} bbl/d`, color: "" },
      { label: "Annual Decline", value: `${effectiveDecline}%`, color: effectiveDecline < 30 ? "text-success" : effectiveDecline < 50 ? "text-warning" : "text-destructive" },
      { label: "Recovery Factor", value: `${rf}%`, color: rf > 20 ? "text-success" : rf > 10 ? "text-warning" : "text-destructive" },
    ],
    context: `[REAL DATA — ${months} months] Cumulative: ${(totalOil / 1000).toFixed(1)}K bbl oil, ${(totalGas / 1000).toFixed(1)}K MCF gas, ${(totalWater / 1000).toFixed(1)}K bbl water. Peak: ${peakRate.toFixed(1)} bbl/d, Current: ${latestRate.toFixed(1)} bbl/d, Annual decline: ${effectiveDecline}%, Avg WC: ${avgWaterCut}%, EUR: ${(totalEur / 1000).toFixed(1)}K bbl, RF: ${rf}%`,
    dataSource: "REAL DATA",
  };
}

function computeCumulativeSynthetic(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const q0 = well.production_oil ?? 8;
  const h = wellHash(well, 30);
  const Di = +(0.02 + h * 0.03).toFixed(4);
  const b = +(0.3 + wellHash(well, 31) * 0.5).toFixed(2);
  let eur = 0;
  for (let m = 1; m <= 60; m++) eur += arpsRate(q0, Di, b, m) * 30.44;
  eur = Math.round(eur);
  const fp = formationPorosity(well.formation);
  const depth = well.total_depth ?? 5000;
  const porosity = (fp.min + wellHash(well, 20) * (fp.max - fp.min)) / 100;
  const ioip = Math.round(depth * porosity * 7.758 * 0.5);
  const rf = ioip > 0 ? +((eur / ioip) * 100).toFixed(1) : 0;
  const annualDecline = +((1 - arpsRate(q0, Di, b, 12) / q0) * 100).toFixed(1);

  return {
    metrics: [
      { label: "EUR (5-yr)", value: `${(eur / 1000).toFixed(1)}K bbl`, color: eur > 20000 ? "text-success" : "text-warning" },
      { label: "Decline Model", value: `Arps (b=${b})`, color: "" },
      { label: "Annual Decline", value: `${annualDecline}%`, color: annualDecline < 30 ? "text-success" : annualDecline < 50 ? "text-warning" : "text-destructive" },
      { label: "Recovery Factor", value: `${rf}%`, color: rf > 20 ? "text-success" : rf > 10 ? "text-warning" : "text-destructive" },
    ],
    context: `[SYNTHETIC — no production history] EUR: ${(eur / 1000).toFixed(1)}K bbl, Di=${Di}/mo, b=${b}, Annual decline: ${annualDecline}%, RF: ${rf}%`,
    dataSource: "SYNTHETIC",
  };
}

// ─── Geophysical with REAL well_logs ──────────────────────
function computeGeophysicalReal(well: WellData, logs: WellLogRecord[]): { metrics: StageMetric[]; context: string; dataSource: string } {
  const grValues = logs.map(l => l.gamma_ray).filter((v): v is number => v != null);
  const resValues = logs.map(l => l.resistivity).filter((v): v is number => v != null);
  const phiValues = logs.map(l => l.porosity).filter((v): v is number => v != null);
  const swValues = logs.map(l => l.water_saturation).filter((v): v is number => v != null);

  const avgGR = grValues.length > 0 ? +(grValues.reduce((s, v) => s + v, 0) / grValues.length).toFixed(0) : null;
  const avgRes = resValues.length > 0 ? +(resValues.reduce((s, v) => s + v, 0) / resValues.length).toFixed(1) : null;
  const avgPhi = phiValues.length > 0 ? +(phiValues.reduce((s, v) => s + v, 0) / phiValues.length).toFixed(1) : null;
  const maxPhi = phiValues.length > 0 ? +Math.max(...phiValues).toFixed(1) : null;
  const avgSw = swValues.length > 0 ? +(swValues.reduce((s, v) => s + v, 0) / swValues.length).toFixed(1) : null;

  const depthRange = `${logs[0].measured_depth.toFixed(0)}–${logs[logs.length - 1].measured_depth.toFixed(0)} ft`;
  const payZone = (avgPhi ?? 0) > 10 && (avgSw ?? 100) < 50;

  return {
    metrics: [
      { label: "Avg Porosity (φ)", value: avgPhi != null ? `${avgPhi}%` : "N/A", color: (avgPhi ?? 0) > 15 ? "text-success" : (avgPhi ?? 0) > 8 ? "text-warning" : "text-destructive" },
      { label: "Avg Sw", value: avgSw != null ? `${avgSw}%` : "N/A", color: (avgSw ?? 100) < 40 ? "text-success" : (avgSw ?? 100) < 60 ? "text-warning" : "text-destructive" },
      { label: "Avg GR", value: avgGR != null ? `${avgGR} API` : "N/A", color: (avgGR ?? 100) < 75 ? "text-success" : "text-warning" },
      { label: "Pay Zone", value: payZone ? "Identified" : "Marginal", color: payZone ? "text-success" : "text-warning" },
    ],
    context: `[REAL DATA — ${logs.length} log points, ${depthRange}] Avg φ=${avgPhi ?? "N/A"}%, Max φ=${maxPhi ?? "N/A"}%, Avg Sw=${avgSw ?? "N/A"}%, Avg GR=${avgGR ?? "N/A"} API, Avg Rt=${avgRes ?? "N/A"} Ω·m, Pay zone: ${payZone ? "Yes" : "Marginal"}`,
    dataSource: "REAL DATA",
  };
}

function computeGeophysicalSynthetic(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const fp = formationPorosity(well.formation);
  const h = wellHash(well, 40);
  const porosity = +(fp.min + h * (fp.max - fp.min)).toFixed(1);
  const waterCut = well.water_cut ?? 30;
  const sw = +(20 + waterCut * 0.6 + wellHash(well, 41) * 10).toFixed(1);
  const gr = fp.rockType.includes("Shale") ? Math.round(90 + wellHash(well, 42) * 40) :
    fp.rockType.includes("Limestone") ? Math.round(20 + wellHash(well, 42) * 30) :
    Math.round(40 + wellHash(well, 42) * 35);
  const rt = +(2 + (100 - sw) / 10 + wellHash(well, 43) * 3).toFixed(1);
  const payZone = porosity > 15 && sw < 40;

  return {
    metrics: [
      { label: "Log Porosity (φ)", value: `${porosity}%`, color: porosity > 15 ? "text-success" : porosity > 8 ? "text-warning" : "text-destructive" },
      { label: "Water Saturation (Sw)", value: `${sw}%`, color: sw < 40 ? "text-success" : sw < 60 ? "text-warning" : "text-destructive" },
      { label: "Gamma Ray", value: `${gr} API`, color: gr < 75 ? "text-success" : "text-warning" },
      { label: "Pay Zone", value: payZone ? "Identified" : "Marginal", color: payZone ? "text-success" : "text-warning" },
    ],
    context: `[SYNTHETIC — no well logs] φ=${porosity}%, Sw=${sw}%, GR=${gr} API, Rt=${rt} Ω·m, Pay zone: ${payZone ? "Yes" : "Marginal"}`,
    dataSource: "SYNTHETIC",
  };
}

// ─── Economic with REAL production data ───────────────────
function computeEconomicReal(well: WellData, history: ProductionRecord[]): { metrics: StageMetric[]; context: string; dataSource: string } {
  const OIL_PRICE = 72;
  const OPEX_PER_BBL = 18;
  const TREATMENT_COST = 85000;
  const currentProd = well.production_oil ?? 8;
  const waterCut = well.water_cut ?? 30;

  // Actual cumulative revenue from production history
  const totalOil = history.reduce((s, r) => s + (r.oil_bbl ?? 0), 0);
  const totalGas = history.reduce((s, r) => s + (r.gas_mcf ?? 0), 0);
  const historicalRevenue = totalOil * OIL_PRICE + totalGas * 3.5; // $3.5/MCF gas

  // SPT gain
  const sptGain = waterCut < 30 ? 7 : waterCut < 50 ? 5 : waterCut < 70 ? 3 : 1.5;
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
    if (cumProfit >= TREATMENT_COST && paybackMonth === 999) paybackMonth = m;
  }
  const roi5Year = TREATMENT_COST > 0 ? Math.round(((fiveYearNet - TREATMENT_COST) / TREATMENT_COST) * 100) : 0;

  let annualRevenue = 0;
  for (let m = 1; m <= 12; m++) {
    annualRevenue += arpsRate(sptGain, Di, b, m) * 30.44 * OIL_PRICE;
  }

  return {
    metrics: [
      { label: "Historical Revenue", value: `$${Math.round(historicalRevenue).toLocaleString()}`, color: "text-success" },
      { label: "SPT CAPEX", value: `$${TREATMENT_COST.toLocaleString()}`, color: "" },
      { label: "ROI (5-Year)", value: `${roi5Year}%`, color: roi5Year > 200 ? "text-success" : roi5Year > 0 ? "text-warning" : "text-destructive" },
      { label: "Payback Period", value: `${paybackMonth} mo`, color: paybackMonth < 6 ? "text-success" : paybackMonth < 12 ? "text-warning" : "text-destructive" },
    ],
    context: `[REAL DATA] Historical revenue: $${Math.round(historicalRevenue).toLocaleString()} (${totalOil.toFixed(0)} bbl, ${totalGas.toFixed(0)} MCF), SPT CAPEX: $${TREATMENT_COST.toLocaleString()}, SPT Gain: +${sptGain} bbl/d, 5yr ROI: ${roi5Year}%, Payback: ${paybackMonth} mo`,
    dataSource: "REAL DATA",
  };
}

function computeEconomicSynthetic(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const OIL_PRICE = 72;
  const OPEX_PER_BBL = 18;
  const TREATMENT_COST = 85000;
  const waterCut = well.water_cut ?? 30;
  const sptGain = waterCut < 30 ? 7 : waterCut < 50 ? 5 : waterCut < 70 ? 3 : 1.5;
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
    if (cumProfit >= TREATMENT_COST && paybackMonth === 999) paybackMonth = m;
  }
  const roi5Year = TREATMENT_COST > 0 ? Math.round(((fiveYearNet - TREATMENT_COST) / TREATMENT_COST) * 100) : 0;
  let annualRevenue = 0;
  for (let m = 1; m <= 12; m++) {
    annualRevenue += arpsRate(sptGain, Di, b, m) * 30.44 * OIL_PRICE;
  }

  return {
    metrics: [
      { label: "Estimated CAPEX", value: `$${TREATMENT_COST.toLocaleString()}`, color: "" },
      { label: "Year 1 Revenue", value: `$${Math.round(annualRevenue).toLocaleString()}`, color: "text-success" },
      { label: "ROI (5-Year)", value: `${roi5Year}%`, color: roi5Year > 200 ? "text-success" : roi5Year > 0 ? "text-warning" : "text-destructive" },
      { label: "Payback Period", value: `${paybackMonth} mo`, color: paybackMonth < 6 ? "text-success" : paybackMonth < 12 ? "text-warning" : "text-destructive" },
    ],
    context: `[SYNTHETIC — no production history] CAPEX: $${TREATMENT_COST.toLocaleString()}, SPT Gain: +${sptGain} bbl/d, Year 1 Rev: $${Math.round(annualRevenue).toLocaleString()}, 5yr ROI: ${roi5Year}%, Payback: ${paybackMonth} mo`,
    dataSource: "SYNTHETIC",
  };
}

function computeSptProjection(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const currentProd = well.production_oil ?? 8;
  const waterCut = well.water_cut ?? 30;
  const depth = well.total_depth ?? 5000;
  const wcOk = waterCut < 60;
  const prodOk = currentProd >= 3;
  const depthOk = depth >= 2000 && depth <= 12000;
  const multiplier = waterCut < 30 ? 2.5 : waterCut < 50 ? 2.0 : 2.0;
  const treatmentEffect = waterCut < 30 ? 10 : waterCut < 50 ? 7.5 : 5;
  const projectedProd = Math.min(currentProd * multiplier + treatmentEffect, 25);
  const upliftFactor = +(projectedProd / currentProd).toFixed(1);
  let score = 0;
  if (wcOk) score += 30;
  if (prodOk) score += 20;
  if (depthOk) score += 15;
  score += Math.min(Math.round((1 - waterCut / 100) * 25), 25);
  score += Math.min(Math.round(currentProd * 1.5), 10);
  score = Math.min(score, 98);
  const hasRealProd = well.production_oil != null;
  const dataSource = hasRealProd ? "REAL DATA" : "SYNTHETIC";

  return {
    metrics: [
      { label: "SPT Score", value: `${score}/100`, color: score > 70 ? "text-success" : score > 50 ? "text-warning" : "text-destructive" },
      { label: "Projected Inflow", value: `${projectedProd.toFixed(1)} bbl/d`, color: projectedProd > 15 ? "text-success" : "text-warning" },
      { label: "Uplift Factor", value: `${upliftFactor}×`, color: upliftFactor > 2 ? "text-success" : "text-warning" },
      { label: "Water Cut Risk", value: `${waterCut}%`, color: waterCut < 30 ? "text-success" : waterCut < 50 ? "text-warning" : "text-destructive" },
    ],
    context: `[${dataSource}] SPT Score: ${score}/100, Current: ${currentProd} → Projected: ${projectedProd.toFixed(1)} bbl/d (×${upliftFactor}), WC: ${waterCut}%`,
    dataSource,
  };
}

function computeEor(well: WellData, prodHistory: ProductionRecord[], wellLogs: WellLogRecord[]): { metrics: StageMetric[]; context: string; dataSource: string } {
  const spt = computeSptProjection(well);
  const econ = prodHistory.length > 0 ? computeEconomicReal(well, prodHistory) : computeEconomicSynthetic(well);
  const core = computeCoreAnalysis(well);

  const sptScore = parseInt(spt.metrics[0].value) || 50;
  const roiVal = parseInt(econ.metrics[2].value) || 0;
  const porosity = parseFloat(core.metrics[1].value) || 10;
  const overallScore = Math.min(Math.round(sptScore * 0.4 + Math.min(roiVal / 5, 30) + porosity * 1.5), 98);
  const priority = overallScore > 75 ? "High" : overallScore > 55 ? "Medium" : "Low";
  const dataSources = new Set([spt.dataSource, econ.dataSource, core.dataSource]);
  const dataSource = dataSources.has("REAL DATA") ? "REAL DATA + MODEL" : "SYNTHETIC";

  return {
    metrics: [
      { label: "SPT Candidacy", value: `${overallScore}/100`, color: overallScore > 75 ? "text-success" : overallScore > 55 ? "text-warning" : "text-destructive" },
      { label: "Priority", value: priority, color: priority === "High" ? "text-success" : priority === "Medium" ? "text-warning" : "text-destructive" },
      { label: "Expected Uplift", value: spt.metrics[2].value, color: "text-success" },
      { label: "ROI (5-Year)", value: econ.metrics[2].value, color: econ.metrics[2].color },
    ],
    context: `[${dataSource}] Overall SPT Score: ${overallScore}/100, Priority: ${priority}, Uplift: ${spt.metrics[2].value}, ROI: ${econ.metrics[2].value}`,
    dataSource,
  };
}

// ─── Seismic Reinterpretation ─────────────────────────────
function computeSeismicReinterpretation(well: WellData): { metrics: StageMetric[]; context: string; dataSource: string } {
  const depth = well.total_depth ?? 5000;
  const fp = formationPorosity(well.formation);
  const h1 = wellHash(well, 50);
  const h2 = wellHash(well, 51);
  const h3 = wellHash(well, 52);

  // Bypassed zones count based on formation complexity
  const zonesCount = fp.rockType.includes("Shale") ? 2 : fp.rockType.includes("Sandstone") ? 3 : Math.round(2 + h1 * 2);
  const highPotential = Math.max(1, Math.round(zonesCount * (0.3 + h2 * 0.3)));
  const anomalyCount = Math.round(2 + h3 * 3);

  // Estimate missed reserves percentage
  const missedPct = well.water_cut != null && well.water_cut > 50 ? "30–45%" : "20–35%";

  // Confidence
  const confidence = Math.round(60 + h1 * 30);

  // AVO class
  const avoClass = h2 > 0.6 ? "III" : h2 > 0.3 ? "II" : "I";

  const dataSource = well.formation ? "FORMATION-BASED MODEL" : "SYNTHETIC";

  return {
    metrics: [
      { label: "Bypassed Zones", value: `${zonesCount}`, color: zonesCount >= 3 ? "text-success" : "text-warning" },
      { label: "High Potential", value: `${highPotential}`, color: "text-success" },
      { label: "Anomalies Detected", value: `${anomalyCount}`, color: anomalyCount > 3 ? "text-warning" : "" },
      { label: "Est. Missed Reserves", value: missedPct, color: "text-destructive" },
    ],
    context: `[${dataSource}] Seismic reinterpretation for ${well.formation || "Unknown"} formation at ${depth} ft. Found ${zonesCount} bypassed zones (${highPotential} high-potential), ${anomalyCount} anomalies (AVO Class ${avoClass}). Estimated missed reserves: ${missedPct}. Confidence: ${confidence}%. Lithology: ${fp.rockType}. Water cut: ${well.water_cut ?? "N/A"}%. Depth range: ${Math.round(depth * 0.25)}–${Math.round(depth * 0.95)} ft.`,
    dataSource,
  };
}

// Stage prompts — AI provides DETAILED expert analysis
const STAGE_VERDICTS: Record<string, string> = {
  field_scan: `You are a senior petroleum geologist conducting field reconnaissance. Given the pre-calculated field data below, write a DETAILED expert assessment (4-6 sentences). Include:
1. Basin characterization and regional geological context
2. Depth classification implications for drilling/completion costs
3. Structural position assessment based on available coordinates
4. Specific risks and opportunities for this field location
5. Comparison to analogous producing fields in the basin
Use emoji prefix (✅, ⚠️, ❌, 🚀). Reference the actual data provided. Do NOT invent numbers not in the data.`,

  classification: `You are a petroleum data engineer specializing in data quality assessment. Given the pre-calculated data quality metrics below, write a DETAILED expert assessment (4-6 sentences). Include:
1. Specific gaps in the dataset and their impact on analysis reliability
2. GOR analysis — what it indicates about reservoir drive mechanism (solution gas, gas cap, water drive)
3. Data anomaly interpretation and potential causes
4. Recommendations for additional data acquisition (specific log types, tests needed)
5. Confidence level for each subsequent analysis stage based on available data
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  core_analysis: `You are a petrophysicist with 20+ years experience in core analysis. Given the pre-calculated core/formation properties below, write a DETAILED expert assessment (5-7 sentences). Include:
1. Rock type characterization — depositional environment, diagenetic history
2. Porosity assessment — primary vs secondary porosity, vugular/intergranular/fracture types
3. Permeability analysis — flow unit quality, k/φ ratio interpretation, anisotropy expectations
4. Fracture network assessment — natural fracture density implications for stimulation
5. Reservoir quality classification (excellent/good/moderate/poor/tight) with justification
6. Specific implications for SPT slot perforation effectiveness in this rock type
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  cumulative: `You are a reservoir engineer specializing in production decline analysis. Given the pre-calculated decline metrics below, write a DETAILED expert assessment (5-7 sentences). Include:
1. Decline curve characterization — hyperbolic vs exponential behavior, b-factor interpretation
2. Production history interpretation — initial flush production, stabilization period, current phase
3. EUR confidence assessment — sensitivity to decline parameters
4. Recovery factor comparison to industry benchmarks for this formation type
5. Remaining reserves estimate and economic limit rate
6. Specific observations about production anomalies (workovers, shut-ins, interference)
7. Water cut trend and its implications for remaining oil mobility
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  spt_projection: `You are an SPT (Slot Perforation Technology, Patent US 8,863,823) specialist at Maxxwell Production. Given the pre-calculated SPT projection metrics below, write a DETAILED expert assessment (5-7 sentences). Include:
1. SPT candidacy scoring breakdown — which parameters drive the score up/down
2. Mechanism of action — how slot perforations will improve inflow in this specific formation
3. Expected near-wellbore skin reduction and its production impact
4. Water cut management — how SPT addresses water coning/channeling in this well
5. Uplift factor justification based on analogous SPT treatments in similar formations
6. Risk factors specific to this well (depth, formation competence, completion type)
7. Recommended slot configuration (length, orientation, density) for this formation
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  economic: `You are a petroleum economist conducting investment analysis. Given the pre-calculated economic metrics below, write a DETAILED expert assessment (5-7 sentences). Include:
1. Capital efficiency analysis — CAPEX per incremental barrel
2. Revenue projection breakdown — oil vs gas contribution, price sensitivity
3. Operating cost structure — lifting costs, water disposal, workover reserves
4. ROI comparison to industry benchmarks for SPT/EOR treatments (typically 150-400%)
5. Payback period risk assessment — sensitivity to oil price decline ($50, $60, $72 scenarios)
6. NPV consideration at 10% discount rate
7. Go/no-go recommendation with specific conditions or contingencies
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  geophysical: `You are a senior petrophysicist interpreting well log data. Given the pre-calculated log-derived properties below, write a DETAILED expert assessment (5-7 sentences). Include:
1. Log quality assessment — curve consistency, environmental corrections needed
2. Lithology interpretation from GR response — sand/shale/carbonate discrimination
3. Porosity system characterization — effective vs total porosity, clay-bound water
4. Fluid contact identification — OWC/GWC indicators from resistivity/porosity crossplot
5. Net pay determination — cutoff criteria applied (φ, Sw, Vshale thresholds)
6. Hydrocarbon saturation calculation methodology (Archie vs Simandoux)
7. Formation evaluation summary — movable hydrocarbon volume, producibility index
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  seismic_reinterpretation: `You are an expert geophysicist specializing in seismic reinterpretation and bypassed reserves identification. Given the pre-calculated seismic analysis below, write a DETAILED expert assessment (6-8 sentences). Include:
1. **Bypassed Reserves Assessment** — identify specific zones with missed hydrocarbons, estimate volumes in MBOE (Thousands of Barrels of Oil Equivalent)
2. **Amplitude Anomaly Analysis** — bright spots, dim spots, flat spots with depth intervals
3. **AVO Classification** — Class I/II/III interpretation and fluid implications
4. **Lithology Auto-Classification** — rock type distribution from seismic attributes
5. **Structural Reinterpretation** — faults, unconformities, stratigraphic traps missed in original interpretation
6. **Recompletion Targets** — specific depth intervals recommended for re-entry or recompletion
7. **Confidence Assessment** — reliability of each finding, data quality limitations
8. **Actionable Recommendations** — prioritized list of zones for immediate investigation

Emphasize bypassed reserves opportunities and quantify potential MBOE recovery. Reference actual depth values and formation names.
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers.`,

  eor: `You are the Chief Reservoir Engineer at Maxxwell Production making a final EOR recommendation. Given the pre-calculated overall assessment below, write a DETAILED expert recommendation (6-8 sentences). Include:
1. Integrated assessment — synthesize field scan, core, production, geophysical, and economic findings
2. SPT treatment recommendation — GO / CONDITIONAL GO / NO-GO with specific justification
3. Expected production improvement — incremental daily rate and cumulative over 5 years
4. Risk matrix — technical risks (formation damage, mechanical failure) and mitigation
5. Implementation timeline — mobilization, treatment execution, monitoring plan
6. Success criteria — what metrics to track post-treatment (IP rate, WC trend, decline rate)
7. Comparison to alternative interventions and why SPT is preferred (or not)
8. Final confidence level (High/Medium/Low) with key uncertainties identified
Use emoji prefix. Reference the actual data provided. Do NOT invent numbers. Do NOT recommend other EOR methods unless SPT is clearly unsuitable.`,
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

    // ─── Fetch real data from DB when well.id exists ──────
    let prodHistory: ProductionRecord[] = [];
    let wellLogs: WellLogRecord[] = [];
    const needsProd = ["cumulative", "economic", "eor"].includes(stageKey);
    const needsLogs = ["geophysical", "eor"].includes(stageKey);

    if (wellData.id) {
      const fetches: Promise<void>[] = [];
      if (needsProd) {
        fetches.push(fetchProductionHistory(wellData.id).then(d => { prodHistory = d; }));
      }
      if (needsLogs) {
        fetches.push(fetchWellLogs(wellData.id).then(d => { wellLogs = d; }));
      }
      if (fetches.length > 0) {
        await Promise.all(fetches);
        console.log(`[${stageKey}] Well ${wellData.well_name || wellData.id}: prodHistory=${prodHistory.length} records, wellLogs=${wellLogs.length} points`);
      }
    }

    // ─── Compute metrics (real data preferred) ────────────
    let computed: { metrics: StageMetric[]; context: string; dataSource: string };

    switch (stageKey) {
      case "field_scan":
        computed = computeFieldScan(wellData);
        break;
      case "classification":
        computed = computeClassification(wellData);
        break;
      case "core_analysis":
        computed = computeCoreAnalysis(wellData);
        break;
      case "cumulative":
        computed = prodHistory.length > 0
          ? computeCumulativeReal(wellData, prodHistory)
          : computeCumulativeSynthetic(wellData);
        break;
      case "spt_projection":
        computed = computeSptProjection(wellData);
        break;
      case "economic":
        computed = prodHistory.length > 0
          ? computeEconomicReal(wellData, prodHistory)
          : computeEconomicSynthetic(wellData);
        break;
      case "geophysical":
        computed = wellLogs.length > 0
          ? computeGeophysicalReal(wellData, wellLogs)
          : computeGeophysicalSynthetic(wellData);
        break;
      case "seismic_reinterpretation":
        computed = computeSeismicReinterpretation(wellData);
        break;
      case "eor":
        computed = computeEor(wellData, prodHistory, wellLogs);
        break;
      default:
        computed = { metrics: [], context: "Unknown stage", dataSource: "UNKNOWN" };
    }

    // AI verdict
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wellDescription = `Well: ${wellData.well_name || wellData.api_number || "Unknown"}, ${wellData.county || "Unknown"} County, ${wellData.state}, Formation: ${wellData.formation || "Unknown"}, Depth: ${wellData.total_depth ?? "N/A"} ft, Oil: ${wellData.production_oil ?? "N/A"} bbl/d, Gas: ${wellData.production_gas ?? "N/A"} MCF/d, WC: ${wellData.water_cut ?? "N/A"}%`;

    const userContent = `Pre-calculated metrics for ${stageKey} stage:\n${computed.context}\n\nWell: ${wellDescription}\n\nProvide your DETAILED expert assessment based on the data above. Be specific, reference the actual numbers, and give actionable insights. Write 4-8 sentences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: verdictPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({
        title: `${stageKey} Analysis Complete`,
        metrics: computed.metrics,
        verdict: `📊 Analysis complete (AI verdict unavailable) [${computed.dataSource}]`,
        dataSource: computed.dataSource,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const verdict = data.choices?.[0]?.message?.content?.trim() || "📊 Analysis complete";

    return new Response(JSON.stringify({
      title: `${stageKey} Analysis Complete`,
      metrics: computed.metrics,
      verdict,
      dataSource: computed.dataSource,
    }), {
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
