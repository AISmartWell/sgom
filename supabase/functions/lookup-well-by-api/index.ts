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

async function queryStateAPI(state: string, apiNumber: string): Promise<Record<string, unknown> | null> {
  const config = STATE_APIS[state];
  if (!config) return null;

  // Build query based on state
  let whereClause: string;
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

  const params = new URLSearchParams({
    where: whereClause,
    outFields: "*",
    returnGeometry: "true",
    resultRecordCount: "1",
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

// Detect state from API number prefix
function detectState(apiNumber: string): string[] {
  const clean = apiNumber.replace(/[-\s]/g, "").toUpperCase();
  if (clean.startsWith("TX") || clean.startsWith("42")) return ["TX"];
  if (clean.startsWith("OK") || clean.startsWith("35")) return ["OK"];
  if (clean.startsWith("KS") || clean.startsWith("15")) return ["KS"];
  // Try all states
  return ["OK", "TX", "KS"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_number, company_id } = await req.json();

    if (!api_number || !company_id) {
      return new Response(
        JSON.stringify({ error: "api_number and company_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statesToTry = detectState(api_number);
    let wellData = null;

    for (const state of statesToTry) {
      const feature = await queryStateAPI(state, api_number);
      if (feature) {
        const attrs = (feature as { attributes: Record<string, unknown> }).attributes;
        const geom = (feature as { geometry?: { x?: number; y?: number } }).geometry || null;
        wellData = normalizeWell(state, attrs, geom, company_id);
        if (wellData) break;
      }
    }

    if (!wellData) {
      return new Response(
        JSON.stringify({ success: false, error: "Well not found in state registries", searched: statesToTry }),
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
