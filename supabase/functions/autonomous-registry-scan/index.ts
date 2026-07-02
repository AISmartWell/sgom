import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// State API endpoints (mirrors fetch-nearby-wells)
const STATE_APIS: Record<string, { url: string; source: string; label: string }> = {
  TX: { url: "https://gis.rrc.texas.gov/server/rest/services/rrc_public/RRC_Public_Viewer_Srvs/MapServer/1/query", source: "TX_RRC", label: "Texas RRC" },
  OK: { url: "https://gis.occ.ok.gov/server/rest/services/Hosted/RBDMS_WELLS/FeatureServer/220/query", source: "OCC", label: "Oklahoma OCC" },
  KS: { url: "https://services.kgs.ku.edu/arcgis8/rest/services/oilgas/oilgas_wells/MapServer/0/query", source: "KGS", label: "Kansas Geological Survey" },
  NM: { url: "https://gis.emnrd.nm.gov/arcgis/rest/services/OCD/Wells_Public/MapServer/0/query", source: "NM_OCD", label: "New Mexico OCD" },
  CO: { url: "https://cogcc.state.co.us/arcgis/rest/services/Wells/Wells_All/MapServer/0/query", source: "COGCC", label: "Colorado COGCC" },
  ND: { url: "https://ndgishub.nd.gov/arcgis/rest/services/All_GovtData/OilAndGas/MapServer/0/query", source: "NDIC", label: "North Dakota NDIC" },
  WY: { url: "https://pipeline.wyo.gov/arcgis/rest/services/WOGCC/Wells/MapServer/0/query", source: "WOGCC", label: "Wyoming WOGCC" },
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bboxFromRadius(lat: number, lng: number miles: number = 10) {
  const latDeg = miles / 69.0;
  const lngDeg = miles / (69.0 * Math.cos((lat * Math.PI) / 180));
  return { xmin: lng - lngDeg, ymin: lat - latDeg, xmax: lng + lngDeg, ymax: lat + latDeg };
}

function pickApiField(state: string, attrs: any): string | null {
  switch (state) {
    case "TX": return attrs.API ? `TX-${String(attrs.API).padStart(8, "0")}` : null;
    case "OK": return attrs.api ? String(attrs.api) : null;
    case "KS": return attrs.API_NUMBER ? `KS-${attrs.API_NUMBER}` : null;
    case "NM": return attrs.API ? `NM-${attrs.API}` : null;
    case "CO": return attrs.API ? `CO-${attrs.API}` : null;
    case "ND": return attrs.API ? `ND-${attrs.API}` : (attrs.NDIC_FILE_NO ? `ND-${attrs.NDIC_FILE_NO}` : null);
    case "WY": return attrs.API ? `WY-${attrs.API}` : null;
    default: return null;
  }
}

function normalize(state: string, attrs: any, geom: any) {
  const lat = attrs.LATITUDE ?? attrs.sh_lat ?? attrs.GIS_LAT83 ?? attrs.Latitude ?? geom?.y ?? null;
  const lng = attrs.LONGITUDE ?? attrs.sh_lon ?? attrs.GIS_LONG83 ?? attrs.Longitude ?? geom?.x ?? null;
  return {
    api_number: pickApiField(state, attrs),
    well_name: attrs.WELL_NAME || attrs.well_name || attrs.LEASE || `${state} Well`,
    operator: attrs.OPERATOR || attrs.operator || attrs.CURR_OPERATOR || "Unknown",
    well_type: attrs.WELL_TYPE || attrs.welltype || null,
    status: attrs.STATUS || attrs.wellstatus || null,
    county: attrs.COUNTY || attrs.county || null,
    latitude: lat,
    longitude: lng,
    total_depth: attrs.TD || attrs.td || attrs.TOTAL_DEPTH || null,
    formation: attrs.FORMATION || attrs.formation || attrs.PRODUCING_FORMATION || null,
    raw_data: attrs,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { company_id, radius_miles = 5, limit_per_seed = 100, max_seeds = 10 } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Determine which companies to scan
    let companyIds: string[] = [];
    if (company_id) companyIds = [company_id];
    else {
      const { data } = await supabase.from("companies").select("id");
      companyIds = (data || []).map((c: any) => c.id);
    }

    const scan_run_id = crypto.randomUUID();
    const perCompany: any[] = [];

    for (const cid of companyIds) {
      // Get seed wells from this company's portfolio
      const { data: seeds } = await supabase
        .from("wells")
        .select("id, latitude, longitude, state, api_number, formation")
        .eq("company_id", cid)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(max_seeds);

      if (!seeds || seeds.length === 0) {
        perCompany.push({ company_id: cid, seeds: 0, suggestions: 0 });
        continue;
      }

      // Existing API numbers to dedupe
      const { data: existingWells } = await supabase
        .from("wells")
        .select("api_number")
        .eq("company_id", cid);
      const existingApis = new Set((existingWells || []).map((w: any) => w.api_number).filter(Boolean));

      const { data: existingSug } = await supabase
        .from("registry_scan_suggestions")
        .select("api_number")
        .eq("company_id", cid);
      (existingSug || []).forEach((s: any) => s.api_number && existingApis.add(s.api_number));

      const candidates: any[] = [];

      for (const seed of seeds) {
        const stateCode = (seed.state || "OK").toUpperCase();
        const api = STATE_APIS[stateCode];
        if (!api) continue;

        const bbox = bboxFromRadius(seed.latitude!, seed.longitude!, radius_miles);
        const params = new URLSearchParams({
          where: "1=1",
          outFields: "*",
          returnGeometry: "true",
          resultRecordCount: String(limit_per_seed),
          geometryType: "esriGeometryEnvelope",
          geometry: JSON.stringify({ xmin: bbox.xmin, ymin: bbox.ymin, xmax: bbox.xmax, ymax: bbox.ymax, spatialReference: { wkid: 4326 } }),
          inSR: "4326",
          outSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          f: "json",
        });

        try {
          const r = await fetch(`${api.url}?${params}`, {
            headers: { "User-Agent": "SGOM-AutoScan/1.0", Accept: "application/json" },
          });
          if (!r.ok) continue;
          const j = await r.json();
          for (const f of j.features || []) {
            const n = normalize(stateCode, f.attributes, f.geometry);
            if (!n.api_number || existingApis.has(n.api_number)) continue;
            if (!n.latitude || !n.longitude) continue;

            const dist = haversine(seed.latitude!, seed.longitude!, n.latitude, n.longitude);
            // Score: closer = higher, formation match bonus
            const proxScore = Math.max(0, 1 - dist / radius_miles);
            const formMatch = seed.formation && n.formation && seed.formation.toLowerCase() === n.formation.toLowerCase() ? 0.25 : 0;
            const activeBonus = /ACTIVE|PROD/i.test(n.status || "") ? 0.15 : 0;
            const score = Math.min(1, proxScore * 0.7 + formMatch + activeBonus);

            const reasonParts = [`${dist.toFixed(2)} mi from ${seed.api_number}`];
            if (formMatch) reasonParts.push(`same formation (${n.formation})`);
            if (activeBonus) reasonParts.push(`active status`);

            candidates.push({
              company_id: cid,
              ...n,
              state: stateCode,
              source: api.source,
              distance_miles: Number(dist.toFixed(3)),
              nearest_well_id: seed.id,
              score: Number(score.toFixed(3)),
              reason: reasonParts.join(" · "),
              suggestion_status: "pending",
              scan_run_id,
            });
            existingApis.add(n.api_number); // dedupe within run
          }
        } catch (e) {
          console.error(`scan ${stateCode} failed`, e);
        }
      }

      // Keep top by score
      candidates.sort((a, b) => b.score - a.score);
      const top = candidates.slice(0, 50);

      if (top.length > 0) {
        const { error } = await supabase
          .from("registry_scan_suggestions")
          .upsert(top, { onConflict: "company_id,api_number", ignoreDuplicates: true });
        if (error) console.error("upsert error", error);
      }

      perCompany.push({ company_id: cid, seeds: seeds.length, suggestions: top.length });
    }

    return new Response(
      JSON.stringify({ ok: true, scan_run_id, radius_miles, results: perCompany }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("autonomous-registry-scan error", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
