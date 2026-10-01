// Upstrima sandbox API — isolated demo environment.
// Auth: Bearer token (sha256 hash stored in api_tokens), with expiry + revocation.
// Data: only wells of the sandbox company referenced by the token.
// Every call is written to api_call_log (audit trail).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sptScreening(well: Record<string, unknown>) {
  const depth = Number(well.total_depth) || 0;
  const fluid = String(well.well_type || "").toLowerCase().includes("gas") ? "gas" : "oil";
  const kCutoff = fluid === "gas" ? 0.1 : 1.0;
  const swCutoff = 60;
  const libraryDepthFt = 5400;
  const factorsFor: string[] = [];
  const risks: string[] = [];
  const missing: string[] = [];
  if (depth > 0 && depth <= libraryDepthFt) factorsFor.push(`Depth ${depth} ft is within the SPT case library (<= ${libraryDepthFt} ft)`);
  if (depth > libraryDepthFt) risks.push(`Depth ${depth} ft is outside the SPT case library (~${libraryDepthFt} ft) — extrapolation`);
  if (fluid === "gas") factorsFor.push("Gas well — low-permeability cutoff relaxed to 0.1 mD");
  const wc = well.water_cut == null ? null : Number(well.water_cut);
  if (wc != null && wc >= swCutoff) risks.push(`Water cut ${wc}% >= ${swCutoff}% threshold`);
  if (wc == null) missing.push("water_cut");
  if (well.production_oil == null && well.production_gas == null) missing.push("production rates");
  let verdict: "candidate" | "conditional" | "not_recommended" = "candidate";
  if (depth > libraryDepthFt) verdict = "conditional";
  if (risks.length >= 2) verdict = "conditional";
  const confidence = missing.length === 0 ? "medium" : "low";
  return {
    verdict, confidence, fluid,
    cutoffs: { permeability_mD: kCutoff, water_saturation_pct: swCutoff, spt_library_depth_ft: libraryDepthFt },
    factors_for: factorsFor, risks, missing_data: missing,
    disclaimer: "Screening result on demo data only; not an engineering program.",
  };
}

const ACTIONS = ["spt_screening", "log_ranking", "well_verdict", "knowledge_search", "audit_log"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const started = Date.now();
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const url = new URL(req.url);
  const action = url.pathname.split("/").filter(Boolean).pop() || "";
  let tok: { id: string; label: string; company_id: string; scopes: string[] } | null = null;
  let body: Record<string, unknown> = {};
  const log: { well_ref?: string | null; verdict?: string | null } = {};

  const respond = async (payload: unknown, status = 200, errorCode?: string) => {
    if (action !== "audit_log") {
      await supabase.from("api_call_log").insert({
        token_id: tok?.id ?? null,
        token_label: tok?.label ?? null,
        company_id: tok?.company_id ?? null,
        action: action.slice(0, 64) || "(none)",
        status_code: status,
        well_ref: log.well_ref ?? null,
        verdict: log.verdict ?? null,
        error_code: errorCode ?? null,
        request_summary: {
          well_id: body.well_id ?? null,
          api_number: body.api_number ?? null,
          adhoc_well: body.well ? true : undefined,
          query: typeof body.query === "string" ? body.query.slice(0, 200) : undefined,
        },
        latency_ms: Date.now() - started,
      });
    }
    return new Response(JSON.stringify(payload), { status, headers: { ...cors, "Content-Type": "application/json" } });
  };
  const err = (code: string, message: string, status: number) => respond({ error: { code, message } }, status, code);

  if (req.method !== "POST") return err("method_not_allowed", "Use POST", 405);
  try { body = await req.json(); } catch { /* empty body ok */ }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return err("unauthorized", "Missing Bearer token", 401);

  const { data: t } = await supabase
    .from("api_tokens")
    .select("id, label, company_id, scopes, expires_at, revoked_at")
    .eq("token_hash", await sha256(token))
    .maybeSingle();
  if (!t) return err("unauthorized", "Invalid token", 401);
  tok = t;
  if (t.revoked_at) return err("unauthorized", "Token revoked", 401);
  if (new Date(t.expires_at).getTime() < Date.now()) return err("unauthorized", "Token expired", 401);
  await supabase.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", t.id);

  if (!ACTIONS.includes(action)) return err("not_found", `Unknown action '${action}'. Available: ${ACTIONS.join(", ")}`, 404);
  // knowledge_search and audit_log are available to every valid sandbox token
  if (!["knowledge_search", "audit_log"].includes(action) && !t.scopes.includes(action)) {
    return err("forbidden", `Token has no scope '${action}'`, 403);
  }

  if (action === "audit_log") {
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200);
    const { data } = await supabase
      .from("api_call_log")
      .select("action, status_code, well_ref, verdict, error_code, latency_ms, created_at")
      .eq("token_id", t.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    return respond({ token: t.label, calls: data ?? [] });
  }

  if (action === "knowledge_search") {
    const q = typeof body.query === "string" ? body.query.trim() : "";
    if (!q || q.length > 200) return err("bad_request", "Field 'query' is required (1–200 chars)", 400);
    const n = Math.min(Math.max(Number(body.limit) || 5, 1), 10);
    const { data, error } = await supabase.rpc("search_sgom_knowledge", { q, match_count: n });
    if (error) return err("internal", "Search failed", 500);
    log.verdict = `${data?.length ?? 0} results`;
    return respond({
      query: q,
      results: (data ?? []).map((a: Record<string, unknown>) => ({
        slug: a.slug, title: a.title, category: a.category, stage: a.stage,
        summary: a.summary, content: a.content, tags: a.tags, rank: a.rank,
      })),
    });
  }

  let well: Record<string, unknown> | null = null;
  if (body.well_id) {
    const { data } = await supabase.from("wells").select("*").eq("id", String(body.well_id)).eq("company_id", t.company_id).maybeSingle();
    well = data;
  } else if (body.api_number) {
    const { data } = await supabase.from("wells").select("*").eq("api_number", String(body.api_number)).eq("company_id", t.company_id).maybeSingle();
    well = data;
  } else if (body.well && typeof body.well === "object") {
    well = body.well as Record<string, unknown>;
  }
  log.well_ref = String(body.api_number ?? body.well_id ?? (body.well ? "ad-hoc" : "")) || null;
  if (!well) return err("not_found", "Well not found in sandbox", 404);
  log.well_ref = String(well.well_name ?? well.api_number ?? log.well_ref);

  if (action === "spt_screening") {
    const result = sptScreening(well);
    log.verdict = result.verdict;
    return respond({ well: { api_number: well.api_number, well_name: well.well_name }, result });
  }

  if (action === "well_verdict") {
    const s = sptScreening(well);
    const verdict = s.verdict === "candidate" ? "SPT candidate" : s.verdict === "conditional" ? "Conditional SPT candidate" : "Not recommended";
    log.verdict = verdict;
    return respond({
      well: { api_number: well.api_number, well_name: well.well_name, depth_ft: well.total_depth, status: well.status },
      verdict, confidence: s.confidence,
      rationale: [...s.factors_for, ...s.risks],
      missing_data: s.missing_data, disclaimer: s.disclaimer,
    });
  }

  // log_ranking
  const { data: logs } = well.id
    ? await supabase.from("well_logs").select("measured_depth, gamma_ray, resistivity, porosity, water_saturation").eq("well_id", String(well.id)).order("measured_depth")
    : { data: [] };
  if (!logs || logs.length === 0) {
    log.verdict = "no log data";
    return respond({ well: { api_number: well.api_number }, intervals: [], note: "No log data — upload LAS to the sandbox first" });
  }
  const fluid = String(well.well_type || "").toLowerCase().includes("gas") ? "gas" : "oil";
  const intervals = logs
    .filter((l) => l.water_saturation != null || l.porosity != null)
    .map((l) => ({
      depth_ft: l.measured_depth, porosity: l.porosity, water_saturation_pct: l.water_saturation,
      risk: (l.water_saturation != null && l.water_saturation >= 60) ? "high_sw" : null,
    }));
  log.verdict = `${intervals.length} intervals`;
  return respond({ well: { api_number: well.api_number }, fluid, k_cutoff_mD: fluid === "gas" ? 0.1 : 1.0, intervals });
});
