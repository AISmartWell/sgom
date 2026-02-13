import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Oklahoma OCC ArcGIS REST API - RBDMS Wells (primary)
const OCC_WELLS_URL = "https://gis.occ.ok.gov/server/rest/services/Hosted/RBDMS_WELLS/FeatureServer/220/query";
// Fallback: OCC OpenData Hub
const OCC_OPENDATA_URL = "https://gisdata-occokc.opendata.arcgis.com/api/v3/datasets/f3f669d8b66147a68e89ff5e5ebb7b1b_220/downloads/data";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { county, wellType, limit = 100, offset = 0, company_id } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build WHERE clause
    const whereClauses: string[] = ["1=1"];
    if (county) {
      whereClauses.push(`county='${county.toUpperCase()}'`);
    }
    if (wellType) {
      whereClauses.push(`welltype='${wellType.toUpperCase()}'`);
    }

    const params = new URLSearchParams({
      where: whereClauses.join(" AND "),
      outFields: "*",
      returnGeometry: "false",
      resultRecordCount: String(Math.min(limit, 500)),
      resultOffset: String(offset),
      orderByFields: "api DESC",
      f: "json",
    });

    const url = `${OCC_WELLS_URL}?${params}`;
    console.log("Fetching OCC wells:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SGOM-Platform/1.0",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OCC API error:", response.status, text);
      throw new Error(`OCC API returned ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log("OCC response keys:", Object.keys(data));
    console.log("Features count:", data.features?.length || 0);

    // Check for ArcGIS error response
    if (data.error) {
      console.error("ArcGIS error:", JSON.stringify(data.error));
      throw new Error(`ArcGIS error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const features = data.features || [];

    if (features.length === 0) {
      // Log the full response to debug
      console.log("Full response (first 500 chars):", JSON.stringify(data).substring(0, 500));
      
      return new Response(
        JSON.stringify({
          success: true,
          fetched: 0,
          stored: 0,
          skipped: 0,
          message: "No wells found with the given criteria. The OCC API may be temporarily unavailable.",
          debug: { responseKeys: Object.keys(data), hasError: !!data.error },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform to our format
    const wells = features.map((f: { attributes: Record<string, unknown> }) => {
      const a = f.attributes;
      return {
        api_number: a.api ? String(a.api) : null,
        well_name: (a.well_name as string) || "Unknown",
        operator: (a.operator as string) || "Unknown",
        well_type: (a.welltype as string) || null,
        status: (a.wellstatus as string) || null,
        county: (a.county as string) || null,
        state: "OK",
        latitude: (a.sh_lat as number) || null,
        longitude: (a.sh_lon as number) || null,
        total_depth: (a.td as number) || null,
        formation: (a.formation as string) || null,
        spud_date: a.spud_date ? new Date(a.spud_date as number).toISOString().split("T")[0] : null,
        completion_date: a.compl_date ? new Date(a.compl_date as number).toISOString().split("T")[0] : null,
        source: "OCC",
        raw_data: a,
        company_id,
      };
    });

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < wells.length; i += 50) {
      const batch = wells.slice(i, i + 50).filter((w: { api_number: string | null }) => w.api_number);
      if (batch.length === 0) continue;

      const { data: upserted, error } = await supabase
        .from("wells")
        .upsert(batch, { onConflict: "api_number", ignoreDuplicates: false })
        .select("id");

      if (error) {
        console.error("Upsert error:", error);
        skipped += batch.length;
      } else {
        inserted += upserted?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fetched: features.length,
        stored: inserted,
        skipped,
        sample: wells.slice(0, 3),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-wells error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch wells" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
