import { casingTypes, cementStatuses, casingStringSchema, type CasingString } from "@/lib/casing-program";

export const MAXXWELL_COLUMNS = [
  "record", "api_number", "reservoir_pressure_psi", "pressure_datum_ft", "bht_f", "bht_depth_ft", "surface_temp_f", "water_cut_pct",
  "casing_type", "top_ft", "bottom_ft", "od_in", "wall_in", "grade", "cement_top_ft", "cement_status", "notes",
] as const;

export const MAXXWELL_TEMPLATE = [
  MAXXWELL_COLUMNS.join(","),
  "CONDITIONS,15-051-20137,,,,,,,,,,,,,,,",
  "CASING,15-051-20137,,,,,,,Surface,0,,,,,,Unknown,",
  "CASING,15-051-20137,,,,,,,Production,0,,,,,,Unknown,",
].join("\n");

export interface ConditionsRow { reservoir_pressure_psi: number | null; pressure_datum_ft: number | null; bht_f: number | null; bht_depth_ft: number | null; surface_temp_f: number | null; water_cut_pct: number | null }
export interface WellBundle { api: string; conditions: ConditionsRow | null; casing: CasingString[]; errors: string[] }

const normApi = (s: string) => s.replace(/[^0-9]/g, "");
const num = (v: string | undefined): number | null => {
  if (v == null || v.trim() === "") return null;
  const n = Number(v.trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === "," || c === ";" || c === "\t") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function parseMaxxwellCsv(text: string): { bundles: WellBundle[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const errors: string[] = [];
  if (!lines.length) return { bundles: [], errors: ["File is empty"] };
  const header = splitCsvLine(lines[0]).map(h => h.toLowerCase());
  const missing = ["record", "api_number"].filter(h => !header.includes(h));
  if (missing.length) return { bundles: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  const map = new Map<string, WellBundle>();
  lines.slice(1).forEach((line, idx) => {
    const cells = splitCsvLine(line);
    const r: Record<string, string> = {};
    header.forEach((h, i) => { r[h] = cells[i] ?? ""; });
    const rowNo = idx + 2;
    const api = normApi(r.api_number ?? "");
    if (!api) { errors.push(`Row ${rowNo}: api_number is empty`); return; }
    const b = map.get(api) ?? { api, conditions: null, casing: [], errors: [] };
    map.set(api, b);
    const kind = (r.record ?? "").toUpperCase();
    if (kind === "CONDITIONS") {
      const c: ConditionsRow = {
        reservoir_pressure_psi: num(r.reservoir_pressure_psi), pressure_datum_ft: num(r.pressure_datum_ft), bht_f: num(r.bht_f),
        bht_depth_ft: num(r.bht_depth_ft), surface_temp_f: num(r.surface_temp_f), water_cut_pct: num(r.water_cut_pct),
      };
      Object.entries(c).forEach(([k, v]) => { if (Number.isNaN(v)) b.errors.push(`Row ${rowNo}: ${k} is not a number`); });
      if (c.water_cut_pct != null && (c.water_cut_pct < 0 || c.water_cut_pct > 100)) b.errors.push(`Row ${rowNo}: water_cut_pct must be 0–100`);
      if (c.reservoir_pressure_psi != null && c.reservoir_pressure_psi <= 0) b.errors.push(`Row ${rowNo}: pressure must be > 0`);
      if (c.reservoir_pressure_psi != null && c.pressure_datum_ft == null) b.errors.push(`Row ${rowNo}: pressure_datum_ft required with pressure`);
      if (c.bht_f != null && c.bht_depth_ft == null) b.errors.push(`Row ${rowNo}: bht_depth_ft required with BHT`);
      b.conditions = c;
    } else if (kind === "CASING") {
      const type = casingTypes.find(t => t.toLowerCase() === (r.casing_type ?? "").toLowerCase());
      const status = cementStatuses.find(t => t.toLowerCase() === (r.cement_status || "unknown").toLowerCase());
      const s = {
        id: crypto.randomUUID(), type: type ?? ("" as never), top_ft: num(r.top_ft) ?? NaN, bottom_ft: num(r.bottom_ft) ?? NaN,
        od_in: num(r.od_in) ?? NaN, wall_in: num(r.wall_in) ?? NaN, grade: r.grade ?? "", cement_top_ft: num(r.cement_top_ft),
        cement_status: status ?? ("" as never), notes: r.notes ?? "",
      };
      const p = casingStringSchema.safeParse(s);
      if (!p.success) p.error.issues.forEach(i => b.errors.push(`Row ${rowNo} (${i.path.join(".") || "casing"}): ${i.message}`));
      else b.casing.push(p.data);
    } else errors.push(`Row ${rowNo}: record must be CONDITIONS or CASING`);
  });
  return { bundles: [...map.values()], errors };
}

export const apiKey = normApi;
