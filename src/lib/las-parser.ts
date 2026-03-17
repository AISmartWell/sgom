/**
 * LAS 2.0 Parser
 * Parses Log ASCII Standard files and extracts curve data.
 */

export interface LasHeader {
  well_name: string | null;
  api_number: string | null;
  company: string | null;
  field: string | null;
  location: string | null;
  strt: number | null;
  stop: number | null;
  step: number | null;
  null_value: number;
}

export interface LasCurveInfo {
  mnemonic: string;
  unit: string;
  description: string;
}

export interface LasData {
  header: LasHeader;
  curves: LasCurveInfo[];
  data: number[][];  // rows x columns
}

const CURVE_MAP: Record<string, string> = {
  // Depth
  DEPT: "DEPT", DEPTH: "DEPT", MD: "DEPT",
  // Gamma Ray
  GR: "GR", SGR: "GR", CGR: "GR", "GR_EDTC": "GR",
  // SP
  SP: "SP", SSP: "SP",
  // Resistivity
  ILD: "RES", RILD: "RES", RT: "RES", RESD: "RES", RES: "RES", LLD: "RES", RDEP: "RES", AT90: "RES", RILM: "RES", ILM: "RES",
  RSFL: "RSFL", SFLU: "RSFL", RXO: "RSFL", RMLL: "RSFL", RMED: "RSFL",
  // Porosity (density-derived or direct)
  DPHI: "POR", PHID: "POR", DPOR: "POR", PORD: "POR",
  // Neutron
  NPHI: "NPHI", TNPH: "NPHI", NPOR: "NPHI", PHIN: "NPHI", BPHI: "NPHI",
  // Density
  RHOB: "RHOB", RHOZ: "RHOB", DEN: "RHOB", ZDEN: "RHOB",
  // Density correction
  DRHO: "DRHO",
  // Caliper
  CALI: "CALI", CAL: "CALI", HCAL: "CALI",
  // Sonic
  DT: "DT", DTCO: "DT", DTC: "DT", AC: "DT",
  // Photoelectric
  PE: "PE", PEF: "PE",
  // Water saturation
  SW: "SW", SWT: "SW", SWE: "SW",
  // Volume shale
  VSH: "VSH", VSHALE: "VSH", VCL: "VSH",
};

function parseSection(lines: string[]): Array<{ mnemonic: string; unit: string; value: string; description: string }> {
  const items: Array<{ mnemonic: string; unit: string; value: string; description: string }> = [];
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("~") || !line.trim()) continue;
    // Format: MNEM.UNIT  VALUE : DESCRIPTION
    const dotIdx = line.indexOf(".");
    if (dotIdx < 0) continue;
    const mnemonic = line.substring(0, dotIdx).trim();
    const rest = line.substring(dotIdx + 1);
    const colonIdx = rest.indexOf(":");
    const beforeColon = colonIdx >= 0 ? rest.substring(0, colonIdx) : rest;
    const description = colonIdx >= 0 ? rest.substring(colonIdx + 1).trim() : "";
    
    // unit is first token before spaces, value is the rest
    const parts = beforeColon.trim().split(/\s+/);
    const unit = parts[0] || "";
    const value = parts.slice(1).join(" ").trim();
    
    items.push({ mnemonic: mnemonic.toUpperCase(), unit, value, description });
  }
  return items;
}

export function parseLAS(content: string): LasData {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  
  const sections: Record<string, string[]> = {};
  let currentSection = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    
    if (trimmed.startsWith("~")) {
      const sectionChar = trimmed.charAt(1).toUpperCase();
      currentSection = sectionChar;
      sections[currentSection] = [];
      continue;
    }
    
    if (currentSection && sections[currentSection]) {
      sections[currentSection].push(trimmed);
    }
  }
  
  // Parse WELL section
  const wellItems = parseSection(sections["W"] || []);
  const header: LasHeader = {
    well_name: null,
    api_number: null,
    company: null,
    field: null,
    location: null,
    strt: null,
    stop: null,
    step: null,
    null_value: -999.25,
  };
  
  for (const item of wellItems) {
    switch (item.mnemonic) {
      case "WELL": header.well_name = item.value || item.description || null; break;
      case "API": case "UWI": header.api_number = item.value || null; break;
      case "COMP": header.company = item.value || item.description || null; break;
      case "FLD": header.field = item.value || item.description || null; break;
      case "LOC": header.location = item.value || item.description || null; break;
      case "STRT": header.strt = parseFloat(item.value) || null; break;
      case "STOP": header.stop = parseFloat(item.value) || null; break;
      case "STEP": header.step = parseFloat(item.value) || null; break;
      case "NULL": header.null_value = parseFloat(item.value) || -999.25; break;
    }
  }
  
  // Parse CURVE section
  const curveItems = parseSection(sections["C"] || []);
  const curves: LasCurveInfo[] = curveItems.map(c => ({
    mnemonic: c.mnemonic,
    unit: c.unit,
    description: c.description || c.mnemonic,
  }));
  
  // Parse ASCII data section
  const dataLines = sections["A"] || [];
  const data: number[][] = [];
  
  for (const line of dataLines) {
    const values = line.trim().split(/\s+/).map(Number);
    if (values.length > 0 && !values.some(isNaN)) {
      data.push(values);
    }
  }
  
  return { header, curves, data };
}

/**
 * Maps LAS curves to well_logs table columns.
 * Returns array of objects ready for insertion.
 */
export interface WellLogRow {
  measured_depth: number;
  gamma_ray: number | null;
  sp: number | null;
  resistivity: number | null;
  porosity: number | null;
  density: number | null;
  neutron_porosity: number | null;
  water_saturation: number | null;
}

export function mapLasToWellLogs(las: LasData): WellLogRow[] {
  const { curves, data, header } = las;
  
  // Build column index map
  const colMap: Record<string, number> = {};
  curves.forEach((c, idx) => {
    const mapped = CURVE_MAP[c.mnemonic];
    if (mapped && !(mapped in colMap)) {
      colMap[mapped] = idx;
    }
  });
  
  const depthIdx = colMap["DEPT"];
  if (depthIdx === undefined) {
    throw new Error("No depth curve found in LAS file (DEPT, DEPTH, or MD).");
  }
  
  const nullVal = header.null_value;
  const clean = (v: number | undefined): number | null => {
    if (v === undefined || v === nullVal || isNaN(v)) return null;
    return v;
  };
  
  const rows: WellLogRow[] = [];
  
  for (const row of data) {
    const depth = row[depthIdx];
    if (depth === undefined || depth === nullVal || isNaN(depth)) continue;
    
    // Porosity: check if NPHI looks fractional (0-1 range) → convert to %
    let porosity = clean(row[colMap["POR"]]);
    let neutron = clean(row[colMap["NPHI"]]);
    
    // Convert fractional porosity (0–1) to percentage
    if (porosity !== null && porosity > 0 && porosity < 1) porosity *= 100;
    if (neutron !== null && neutron > 0 && neutron < 1) neutron *= 100;
    
    rows.push({
      measured_depth: Math.round(depth * 100) / 100,
      gamma_ray: clean(row[colMap["GR"]]),
      sp: clean(row[colMap["SP"]]),
      resistivity: clean(row[colMap["RES"]]),
      porosity,
      density: clean(row[colMap["RHOB"]]),
      neutron_porosity: neutron,
      water_saturation: clean(row[colMap["SW"]]),
    });
  }
  
  return rows;
}
