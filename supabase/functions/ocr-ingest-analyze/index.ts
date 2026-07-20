// Pipeline: takes an OCR result → creates a well → inserts well_logs →
// invokes analyze-well-stage(stageKey="geophysical") → returns everything.
// Uses service-role so the demo works without an authenticated user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_COMPANY = "00000000-0000-0000-0000-000000000001";

interface OcrResult {
  well_name?: string | null;
  api_number?: string | null;
  operator?: string | null;
  field?: string | null;
  county?: string | null;
  state?: string | null;
  log_date?: string | null;
  depth_range_ft?: { top?: number | null; bottom?: number | null } | null;
  logged_curves?: string[];
  formation_tops?: { name: string; depth_ft: number }[];
  perforations?: { top_ft: number; bottom_ft: number; date?: string | null }[];
  log_readings?: Array<Record<string, number | null>>;
  raw_text?: string;
  confidence?: number;
  notes?: string;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const ocr = (body.ocrResult ?? body.result) as OcrResult | undefined;
    let companyId: string = body.companyId || DEFAULT_COMPANY;
    const targetWellId: string | null = body.targetWellId || body.wellId || null;
    const sourceLabel: string = body.sourceLabel || "ocr_paper_log";

    if (!ocr) {
      return new Response(JSON.stringify({ error: "Missing ocrResult" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 1. Create well ─────────────────────────────
    const wellName = ocr.well_name || `OCR Well ${new Date().toISOString().slice(0, 10)}`;
    const topDepth = num(ocr.depth_range_ft?.top);
    const bottomDepth = num(ocr.depth_range_ft?.bottom);
    const totalDepth = bottomDepth ?? topDepth ?? null;

    // avoid clashing on unique api_number
    const apiNumber = ocr.api_number && ocr.api_number.trim().length > 0
      ? `${ocr.api_number}-ocr-${Date.now().toString(36)}`
      : null;

    const wellInsert = {
      company_id: companyId,
      well_name: wellName,
      api_number: apiNumber,
      operator: ocr.operator ?? null,
      county: ocr.county ?? null,
      state: (ocr.state || "OK").slice(0, 4),
      formation: ocr.formation_tops?.[0]?.name ?? null,
      total_depth: totalDepth,
      well_type: "OIL",
      status: "ACTIVE",
      source: "OCR",
      raw_data: {
        ocr_confidence: ocr.confidence ?? null,
        formation_tops: ocr.formation_tops ?? [],
        perforations: ocr.perforations ?? [],
        log_date: ocr.log_date ?? null,
        field: ocr.field ?? null,
        notes: ocr.notes ?? null,
      },
    };

    let wellRow: any;
    if (targetWellId) {
      const { data: existingWell, error: existingErr } = await sb
        .from("wells")
        .select("*")
        .eq("id", targetWellId)
        .single();
      if (existingErr) throw existingErr;
      wellRow = existingWell;
      companyId = existingWell.company_id || companyId;

      const rawData = typeof existingWell.raw_data === "object" && existingWell.raw_data !== null
        ? existingWell.raw_data
        : {};
      const wellPatch = {
        api_number: existingWell.api_number ?? apiNumber,
        operator: existingWell.operator ?? ocr.operator ?? null,
        county: existingWell.county ?? ocr.county ?? null,
        state: existingWell.state ?? (ocr.state || "OK").slice(0, 4),
        formation: existingWell.formation ?? ocr.formation_tops?.[0]?.name ?? null,
        total_depth: existingWell.total_depth ?? totalDepth,
        raw_data: {
          ...rawData,
          ocr_confidence: ocr.confidence ?? null,
          formation_tops: ocr.formation_tops ?? [],
          perforations: ocr.perforations ?? [],
          log_date: ocr.log_date ?? null,
          field: ocr.field ?? null,
          notes: ocr.notes ?? null,
        },
      };
      const { data: updatedWell, error: updateErr } = await sb
        .from("wells")
        .update(wellPatch)
        .eq("id", targetWellId)
        .select("*")
        .single();
      if (updateErr) throw updateErr;
      wellRow = updatedWell;
    } else {
      const { data: newWell, error: wellErr } = await sb
        .from("wells")
        .insert(wellInsert)
        .select("*")
        .single();
      if (wellErr) throw wellErr;
      wellRow = newWell;
    }

    // ── 2. Insert well_logs from OCR readings ──────
    const readings = Array.isArray(ocr.log_readings) ? ocr.log_readings : [];
    const logRows = readings
      .map((r) => {
        const md = num(r.depth_ft ?? r.depth ?? r.measured_depth);
        if (md === null) return null;
        return {
          well_id: wellRow.id,
          company_id: companyId,
          measured_depth: md,
          gamma_ray: num(r.gr_api ?? r.gr ?? r.gamma_ray),
          sp: num(r.sp_mv ?? r.sp),
          resistivity: num(r.res_ohmm ?? r.res ?? r.resistivity),
          porosity: num(r.porosity ?? r.phi),
          neutron_porosity: num(r.nphi_pu ?? r.nphi ?? r.neutron_porosity),
          density: num(r.rhob_gcc ?? r.rhob ?? r.density),
          water_saturation: num(r.sw ?? r.water_saturation),
          source: sourceLabel,
        };
      })
      .filter(Boolean) as any[];

    let logsInserted = 0;
    if (logRows.length > 0) {
      if (targetWellId) {
        const { error: deleteErr } = await sb
          .from("well_logs")
          .delete()
          .eq("well_id", wellRow.id)
          .eq("source", sourceLabel);
        if (deleteErr) throw deleteErr;
      }
      const { error: logErr } = await sb.from("well_logs").insert(logRows);
      if (logErr) throw logErr;
      logsInserted = logRows.length;
    }

    // ── 3. Register perforations if any ────────────
    let perfsInserted = 0;
    if (ocr.perforations?.length) {
      const perfRows = ocr.perforations
        .filter((p) => Number.isFinite(p.top_ft) && Number.isFinite(p.bottom_ft))
        .map((p) => ({
          well_id: wellRow.id,
          company_id: companyId,
          depth_from: p.top_ft,
          depth_to: p.bottom_ft,
          date_perforated: p.date ?? null,
          notes: "Imported from OCR",
        }));
      if (perfRows.length) {
        const { error: perfErr } = await sb.from("well_perforations").insert(perfRows);
        if (!perfErr) perfsInserted = perfRows.length;
      }
    }

    // ── 4. Invoke Stage 8 (geophysical) analysis ───
    let stageAnalysis: any = null;
    let stageError: string | null = null;

    try {
      const { data: stageData, error: stageErr } = await sb.functions.invoke(
        "analyze-well-stage",
        { body: { well: wellRow, stageKey: "geophysical" } }
      );
      if (stageErr) stageError = stageErr.message;
      else stageAnalysis = stageData;
    } catch (e) {
      stageError = e instanceof Error ? e.message : String(e);
    }

    return new Response(JSON.stringify({
      ok: true,
      well: wellRow,
      logsInserted,
      perfsInserted,
      stageAnalysis,
      stageError,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ocr-ingest-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
