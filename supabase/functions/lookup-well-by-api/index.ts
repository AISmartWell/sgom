import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// State GIS API endpoints
const STATE_APIS: Record<string, { url: string; source: string }> = {
  OK: { url: "https://gis.occ.ok.gov/server/rest/services/Hosted/RBDMS_WELLS/FeatureServer/220/query", source: "OCC" },
  TX: { url: "https://gis.rrc.texas.gov/server/rest/services/rrc_public/RRC_Public_Viewer_Srvs/MapServer/1/query", source: "TX_RRC" },
  KS: { url: "https://services.kgs.ku.edu/arcgis8/rest/services/oilgas/oilgas_wells/MapServer/0/query", source: "KGS" },
};

function normalizeWell(state: string, attrs: Record<string, unknown>, geometry: { x?: number; y?: number } | null, companyId: string) {
  const source = STATE_APIS[state]?.source || state;
  switch (state) {
    case "OK":
      return {
        api_number: attrs.api ? String(attrs.api) : null,
        well_name: (attrs.well_name as string) || "Unknown",
        operator: (attrs.operator as string) || "Unknown",
        well_type: (attrs.welltype as string) || null,
        status: (attrs.wellstatus as string) || null,
        county: (attrs.county as string) || null,
        state: "OK",
        latitude: (attrs.sh_lat as number) || geometry?.y || null,
        longitude: (attrs.sh_lon as number) || geometry?.x || null,
        total_depth: (attrs.td as number) || null,
        formation: (attrs.formation as string) || null,
        spud_date: attrs.spud_date ? new Date(attrs.spud_date as number).toISOString().split("T")[0] : null,
        completion_date: attrs.compl_date ? new Date(attrs.compl_date as number).toISOString().split("T")[0] : null,
        source,
        raw_data: attrs,
        company_id: companyId,
      };
    case "TX":
      return {
        api_number: attrs.API ? `TX-${String(attrs.API).padStart(8, "0")}` : null,
        well_name: `TX Well #${attrs.GIS_WELL_NUMBER || attrs.UNIQID || "Unknown"}`,
        operator: "Texas Operator",
        well_type: "OIL",
        status: "ACTIVE",
        county: null,
        state: "TX",
        latitude: (attrs.GIS_LAT83 as number) || geometry?.y || null,
        longitude: (attrs.GIS_LONG83 as number) || geometry?.x || null,
        total_depth: null,
        formation: null,
        spud_date: null,
        completion_date: null,
        source,
        raw_data: attrs,
        company_id: companyId,
      };
    case "KS":
      return {
        api_number: attrs.API_NUMBER ? `KS-${attrs.API_NUMBER}` : null,
        well_name: (attrs.LEASE as string) || (attrs.WELL_NAME as string) || "KS Well",
        operator: (attrs.CURR_OPERATOR as string) || (attrs.OPERATOR as string) || "Unknown",
        well_type: (attrs.WELL_TYPE as string) || null,
        status: (attrs.STATUS as string) || null,
        county: (attrs.COUNTY as string) || null,
        state: "KS",
        latitude: (attrs.LATITUDE as number) || geometry?.y || null,
        longitude: (attrs.LONGITUDE as number) || geometry?.x || null,
        total_depth: (attrs.TOTAL_DEPTH as number) || null,
        formation: (attrs.PRODUCING_FORMATION as string) || null,
        spud_date: null,
        completion_date: null,
        source,
        raw_data: attrs,
        company_id: companyId,
      };
    default:
      return null;
  }
}

async function queryStateAPI(state: string, apiNumber: string, wellName?: string): Promise<Record<string, unknown> | null> {
  const config = STATE_APIS[state];
  if (!config) return null;

  // Build query based on state and search type
  let whereClause: string;
  if (wellName) {
    // Search by well name
    const safeName = wellName.replace(/'/g, "''");
    if (state === "OK") {
      whereClause = `well_name LIKE '%${safeName}%'`;
    } else if (state === "TX") {
      whereClause = `WELL_NAME LIKE '%${safeName}%'`;
    } else if (state === "KS") {
      whereClause = `LEASE LIKE '%${safeName}%' OR WELL_NAME LIKE '%${safeName}%'`;
    } else {
      whereClause = `WELL_NAME LIKE '%${safeName}%'`;
    }
  } else {
    // Search by API number
    if (state === "OK") {
      whereClause = `api='${apiNumber}'`;
    } else if (state === "TX") {
      const numericApi = apiNumber.replace(/\D/g, "");
      whereClause = `API=${numericApi}`;
    } else if (state === "KS") {
      whereClause = `API_NUMBER='${apiNumber}'`;
    } else {
      whereClause = `API='${apiNumber}'`;
    }
  }

  const params = new URLSearchParams({
    where: whereClause,
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: wellName ? "10" : "1",
    f: "json",
  });

  console.log(`Querying ${state} API: ${config.url}?${params}`);

  try {
    const response = await fetch(`${config.url}?${params}`, {
      headers: { "User-Agent": "SGOM-Platform/1.0", Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.error || !data.features?.length) return null;
    return data.features[0];
  } catch (e) {
    console.error(`${state} API error:`, e);
    return null;
  }
}

function sanitizeSearchValue(value?: string | null) {
  const sanitized = value?.trim().replace(/^["']+|["']+$/g, "").replace(/\s+/g, " ");
  return sanitized || undefined;
}

function escapeFilterValue(value: string) {
  return value.replace(/"/g, '\\"');
}

async function findExistingWell(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  apiNumber?: string,
  wellName?: string,
) {
  if (apiNumber) {
    const compactApi = apiNumber.replace(/[-\s]/g, "");
    const apiVariants = Array.from(new Set([
      apiNumber,
      compactApi,
      `TX-${compactApi}`,
      `OK-${compactApi}`,
      `KS-${compactApi}`,
    ].filter(Boolean)));

    const { data } = await supabase
      .from("wells")
      .select("id, well_name, api_number, formation, total_depth")
      .eq("company_id", companyId)
      .or(apiVariants.map((value) => `api_number.eq."${escapeFilterValue(value)}"`).join(","))
      .limit(1)
      .maybeSingle();

    if (data) return data;
  }

  if (wellName) {
    const { data } = await supabase
      .from("wells")
      .select("id, well_name, api_number, formation, total_depth")
      .eq("company_id", companyId)
      .ilike("well_name", `%${wellName}%`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data;
  }

  return null;
}

// Detect state from API number prefix
function detectState(apiNumber: string): string[] {
  const clean = apiNumber.replace(/[-\s]/g, "").toUpperCase();
  if (clean.startsWith("TX") || clean.startsWith("42")) return ["TX"];
  if (clean.startsWith("OK") || clean.startsWith("35")) return ["OK"];
  if (clean.startsWith("KS") || clean.startsWith("15")) return ["KS"];
  return ["OK", "TX", "KS"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_number, well_name, company_id, state: requestedState } = await req.json();

    if ((!api_number && !well_name) || !company_id) {
      return new Response(
        JSON.stringify({ error: "api_number or well_name, and company_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchByName = !api_number && !!well_name;
    const statesToTry = requestedState ? [requestedState] : (api_number ? detectState(api_number) : ["OK", "TX", "KS"]);
    let wellData = null;
    const allResults: Array<{ state: string; attrs: Record<string, unknown>; geom: any }> = [];

    for (const state of statesToTry) {
      const feature = await queryStateAPI(state, api_number || "", searchByName ? well_name : undefined);
      if (feature) {
        if (searchByName && Array.isArray((feature as any).__multiResults)) {
          // Won't happen with current code, handle single
        }
        const attrs = (feature as { attributes: Record<string, unknown> }).attributes;
        const geom = (feature as { geometry?: { x?: number; y?: number } }).geometry || null;
        wellData = normalizeWell(state, attrs, geom, company_id);
        if (wellData) break;
      }
    }

    if (!wellData) {
      return new Response(
        JSON.stringify({ success: false, error: searchByName ? "Well not found by name" : "Well not found in state registries", searched: statesToTry }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("wells")
      .upsert(wellData, { onConflict: "api_number" })
      .select("id, well_name, api_number, formation, total_depth")
      .single();

    if (error) throw error;

    // Generate synthetic well log data for the new well
    if (data) {
      const wellId = data.id;
      const totalDepth = data.total_depth || 10000;
      const startDepth = Math.max(500, totalDepth * 0.3);
      const endDepth = totalDepth;
      const step = 0.5; // every 0.5 ft
      const numPoints = Math.min(Math.floor((endDepth - startDepth) / step), 500);

      // Deterministic seed from well ID
      const seed = wellId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const seededRandom = (i: number, offset: number) => {
        const x = Math.sin((seed + i * 13.37 + offset * 7.91) * 43758.5453);
        return x - Math.floor(x);
      };

      const logPoints = [];
      let prevGR = 50, prevRes = 10, prevPor = 15;

      for (let i = 0; i < numPoints; i++) {
        const depth = Math.round((startDepth + i * step) * 10) / 10;
        const r1 = seededRandom(i, 1);
        const r2 = seededRandom(i, 2);
        const r3 = seededRandom(i, 3);
        const r4 = seededRandom(i, 4);
        const r5 = seededRandom(i, 5);
        const r6 = seededRandom(i, 6);

        // Smooth random walk for realistic curves
        const gr = Math.max(10, Math.min(150, prevGR + (r1 - 0.5) * 15));
        const isShale = gr > 75;
        const res = Math.max(0.5, Math.min(2000, isShale ? prevRes * 0.95 + r2 * 3 : prevRes + (r2 - 0.4) * 20));
        const basePor = isShale ? 5 + r3 * 8 : 8 + r3 * 22;
        const por = Math.max(2, Math.min(35, prevPor * 0.7 + basePor * 0.3));
        const sp = isShale ? -10 + r4 * 20 : -80 + r4 * 40;
        const density = isShale ? 2.55 + r5 * 0.15 : 2.2 + r5 * 0.3;
        const nphi = isShale ? 0.25 + r6 * 0.15 : 0.05 + r6 * 0.25;

        // Archie Sw
        const phiFrac = por / 100;
        const sw = phiFrac > 0.04 ? Math.min(1, Math.sqrt(0.04 / (phiFrac * phiFrac * Math.max(0.5, res)))) : 1;

        prevGR = gr; prevRes = res; prevPor = por;

        logPoints.push({
          well_id: wellId,
          company_id: company_id,
          measured_depth: depth,
          gamma_ray: Math.round(gr * 10) / 10,
          resistivity: Math.round(res * 100) / 100,
          porosity: Math.round(por * 10) / 10,
          sp: Math.round(sp * 10) / 10,
          density: Math.round(density * 1000) / 1000,
          neutron_porosity: Math.round(nphi * 1000) / 1000,
          water_saturation: Math.round(sw * 100) / 100,
          source: "synthetic",
        });
      }

      // Insert in batches of 100
      for (let i = 0; i < logPoints.length; i += 100) {
        const batch = logPoints.slice(i, i + 100);
        const { error: logError } = await supabase.from("well_logs").insert(batch);
        if (logError) console.error("Well log insert error:", logError);
      }

      console.log(`Generated ${logPoints.length} well log points for well ${wellId}`);
    }

    return new Response(
      JSON.stringify({ success: true, well: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("lookup-well-by-api error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to lookup well" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
