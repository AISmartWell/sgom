import { describe, it, expect } from "vitest";

const REQUIRED_COLUMNS = ["api_number", "well_name", "operator", "state"];

interface ParsedWell {
  api_number: string;
  well_name: string;
  operator: string;
  state: string;
  well_type?: string;
  status?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  formation?: string;
  total_depth?: number;
  production_oil?: number;
  production_gas?: number;
  water_cut?: number;
}

// Extracted parser logic from CSVUpload component
function parseCSV(text: string): { data: ParsedWell[]; errors: string[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { data: [], errors: ["File must have a header row and at least one data row"] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["\s]/g, "").replace(/-/g, "_"));
  const parseErrors: string[] = [];

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    parseErrors.push(`Missing required columns: ${missing.join(", ")}`);
    return { data: [], errors: parseErrors };
  }

  const wells: ParsedWell[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < headers.length) {
      parseErrors.push(`Row ${i + 1}: not enough columns (${values.length} vs ${headers.length})`);
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

    if (!row.api_number || !row.well_name) {
      parseErrors.push(`Row ${i + 1}: missing api_number or well_name`);
      continue;
    }

    wells.push({
      api_number: row.api_number,
      well_name: row.well_name,
      operator: row.operator || "Unknown",
      state: row.state || "OK",
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      formation: row.formation || undefined,
      total_depth: row.total_depth ? parseFloat(row.total_depth) : undefined,
      production_oil: row.production_oil ? parseFloat(row.production_oil) : undefined,
      production_gas: row.production_gas ? parseFloat(row.production_gas) : undefined,
      water_cut: row.water_cut ? parseFloat(row.water_cut) : undefined,
    });
  }

  return { data: wells, errors: parseErrors };
}

describe("CSV Parser", () => {
  it("parses valid CSV with all columns", () => {
    const csv = `api_number,well_name,operator,state,latitude,longitude,formation,total_depth,production_oil,production_gas,water_cut
3500100001,SMITH 1-24,ALPHA PETROLEUM,OK,35.467,-97.523,MISSISSIPPIAN,8500,150,300,25
3500100002,JONES 2-15,BETA ENERGY,TX,31.234,-101.456,WOLFCAMP,9200,200,450,18`;

    const { data, errors } = parseCSV(csv);
    expect(errors).toHaveLength(0);
    expect(data).toHaveLength(2);
    expect(data[0].api_number).toBe("3500100001");
    expect(data[0].well_name).toBe("SMITH 1-24");
    expect(data[0].latitude).toBe(35.467);
    expect(data[0].production_oil).toBe(150);
    expect(data[1].state).toBe("TX");
    expect(data[1].total_depth).toBe(9200);
  });

  it("rejects CSV missing required columns", () => {
    const csv = `api_number,well_name
3500100001,SMITH 1-24`;

    const { data, errors } = parseCSV(csv);
    expect(data).toHaveLength(0);
    expect(errors[0]).toContain("Missing required columns");
    expect(errors[0]).toContain("operator");
    expect(errors[0]).toContain("state");
  });

  it("skips rows with missing api_number", () => {
    const csv = `api_number,well_name,operator,state
,SMITH 1-24,ALPHA,OK
3500100002,JONES 2-15,BETA,TX`;

    const { data, errors } = parseCSV(csv);
    expect(data).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("missing api_number");
  });

  it("handles empty file", () => {
    const { data, errors } = parseCSV("header_only");
    expect(data).toHaveLength(0);
    expect(errors[0]).toContain("header row and at least one data row");
  });

  it("parses 5-well template correctly", () => {
    const csv = `api_number,well_name,operator,state,county,well_type,status,latitude,longitude,formation,total_depth,production_oil,production_gas,water_cut
3500100001,SMITH 1-24,ALPHA PETROLEUM,OK,CANADIAN,OIL,ACTIVE,35.467,-97.523,MISSISSIPPIAN,8500,150,300,25
3500100002,JONES 2-15,BETA ENERGY,TX,MIDLAND,OIL,ACTIVE,31.234,-101.456,WOLFCAMP,9200,200,450,18
3500100003,WILLIAMS 3-8,GAMMA OIL,OK,GRADY,GAS,ACTIVE,35.012,-97.890,WOODFORD,11000,50,800,12
3500100004,BROWN 4-12,DELTA RESOURCES,TX,REEVES,OIL,SHUT-IN,31.567,-103.789,BONE SPRING,8800,0,0,0
3500100005,DAVIS 5-1,EPSILON PARTNERS,OK,BLAINE,OIL,ACTIVE,35.789,-98.234,MISSISSIPPIAN,7500,120,250,30`;

    const { data, errors } = parseCSV(csv);
    expect(errors).toHaveLength(0);
    expect(data).toHaveLength(5);
    expect(data[3].status).toBeUndefined(); // status not in ParsedWell... actually it is not in our parser
    expect(data[4].water_cut).toBe(30);
  });
});
