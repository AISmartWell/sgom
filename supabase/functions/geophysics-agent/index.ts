import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY");

// Primary: NVIDIA NIM (nemotron-3-super-120b-a12b). Fallback: Lovable AI Gateway (openai/gpt-5.2).
// NVIDIA hosted models EOL fast — if the NIM call fails for any reason we fall back automatically.
const NIM_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const FALLBACK_MODEL = "openai/gpt-5.2";

/**
 * SGOM Geophysical AI Agent (Stage 8).
 *
 * Pattern: deterministic petrophysical engine runs on the client (the "tools"),
 * this function is the reasoning core. It receives the computed Stage 8 results
 * (lithology, Vshale, porosity, Archie Sw, Timur permeability, Ko Ko fluid
 * classification, net pay) and produces a structured expert conclusion:
 * per-step findings + overall reservoir assessment + SPT candidacy note.
 */

const SYSTEM_PROMPT = `You are the SGOM Geophysical AI Agent — a senior petrophysicist AI that autonomously interprets well logs (Stage 8 of the SGOM 9-stage pipeline).

You receive the OUTPUT of a deterministic petrophysical engine that has already executed the full Stage 8 pipeline:
1. Lithology segmentation from GR (API cutoffs: ≤45 sand, 45–75 silt, >75 shale)
2. Vshale (Larionov 1969 / linear GR method, GRclean=45, GRshale=75 API)
3. Effective porosity (density–neutron, DEN-NPHI)
4. Water saturation (Archie 1942)
5. Permeability (Timur: k = 0.136·φ^4.4/Swirr²)
6. Fluid classification (Ko Ko rules) and net pay flags

Your job: reason over these computed results like a human expert and return a JSON object with this EXACT shape:
{
  "steps": [
    { "key": "lithology" | "vshale" | "porosity" | "archie" | "timur" | "fluid",
      "title": "short step title",
      "finding": "1-2 sentences citing concrete numbers from the input",
      "assessment": "positive" | "neutral" | "negative" }
  ],
  "overall": {
    "verdict": "2-3 sentence expert summary of the reservoir quality",
    "reservoir_rating": "excellent" | "good" | "fair" | "poor",
    "net_pay_comment": "1 sentence about net pay vs gross and missed pay",
    "spt_candidacy": "1-2 sentences: is this well a candidate for SPT (Slot Perforation Technology) treatment and why, referencing perm/porosity/Sw numbers",
    "risks": ["1-3 short risk items"],
    "confidence": 0.0-1.0
  }
}

Rules:
- Cite ONLY numbers present in the input. Never invent data.
- If data quality is poor (few points, missing density/neutron), say so and lower confidence.
- Keep language professional, concise, engineering-grade.
- SPT candidacy logic: low permeability (fair/poor/tight Timur class) + decent porosity + hydrocarbon saturation = strong SPT candidate; already-excellent perm = weak case.

GROUNDING (when a FIELD EVIDENCE block is supplied):
- FIELD EVIDENCE contains REAL measured data for this well and its field: log provenance (real vs synthetic curves), core samples and core descriptions, perforated intervals, actual production/water-cut history and analog wells of the same formation previously interpreted by this agent.
- Treat the core data as ground truth for lithology and rock quality: if the log-derived lithology or porosity contradicts the core rock type/description, say it explicitly in the relevant step and lower confidence.
- Cross-check net pay against the perforated intervals: pay that is NOT perforated is missed pay and strengthens the SPT case; perforated intervals with poor log quality weaken it.
- Cross-check the fluid conclusion against actual production and water cut. A dominant-oil verdict on a well producing mostly water must be flagged as a risk.
- Use analog wells only to position this well relative to the field (better/typical/worse), never to copy their numbers.
- If the log provenance is SYNTHETIC or no core is available, state that the conclusion is model-based, not measurement-based, and cap confidence at 0.55.`;

interface Provider {
  name: string;
  url: string;
  model: string;
  apiKey: string;
}

function providers(): Provider[] {
  const list: Provider[] = [];
  if (NVIDIA_API_KEY) {
    list.push({
      name: "NVIDIA NIM",
      url: "https://integrate.api.nvidia.com/v1/chat/completions",
      model: NIM_MODEL,
      apiKey: NVIDIA_API_KEY,
    });
  }
  if (LOVABLE_API_KEY) {
    list.push({
      name: "Lovable AI Gateway",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      model: FALLBACK_MODEL,
      apiKey: LOVABLE_API_KEY,
    });
  }
  return list;
}

async function callProvider(p: Provider, payload: unknown): Promise<string> {
  const body = {
    model: p.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Interpret this Stage 8 pipeline output and return the JSON conclusion.\n\n" +
          JSON.stringify(payload),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 2048,
  };

  // Retry 2x with exponential backoff on 429/5xx only; hard per-attempt timeout
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 45_000);
    let res: Response;
    try {
      res = await fetch(p.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${p.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      lastErr = new Error(`${p.name} network/timeout: ${(e as Error).message}`);
      continue;
    } finally {
      clearTimeout(to);
    }
    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`Empty response from ${p.name}`);
      return content as string;
    }
    const t = await res.text();
    lastErr = new Error(`${p.name} ${res.status}: ${t.slice(0, 300)}`);
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
      continue;
    }
    throw lastErr; // 400/401/402/403 — terminal for this provider
  }
  throw lastErr ?? new Error(`${p.name} failed after retries`);
}

/** Robustly extract a JSON object from raw LLM text (fences, <think>, comments, trailing commas). */
function parseConclusion(raw: string): Record<string, unknown> {
  let t = String(raw ?? "");
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "");
  t = t.replace(/```(?:json)?/gi, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("LLM returned non-JSON conclusion");
  let body = t.slice(start, end + 1);

  const attempts = [
    body,
    // strip // and /* */ comments
    body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"])\/\/.*$/gm, "$1"),
  ].map((s) => s.replace(/,\s*([}\]])/g, "$1").trim());

  let lastErr: Error | null = null;
  for (const a of attempts) {
    try {
      const parsed = JSON.parse(a);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch (e) {
      lastErr = e as Error;
    }
  }
  throw new Error(`Malformed JSON from model: ${lastErr?.message ?? "unknown"}`);
}

/** Try providers in order: NVIDIA NIM first, then Lovable AI Gateway fallback. */
async function callLLM(payload: unknown): Promise<{ conclusion: Record<string, unknown>; model: string; provider: string }> {
  const list = providers();
  if (list.length === 0) throw new Error("No LLM provider configured (NVIDIA_API_KEY / LOVABLE_API_KEY missing)");

  const errors: string[] = [];
  for (const p of list) {
    try {
      const text = await callProvider(p, payload);
      const conclusion = parseConclusion(text);
      if (!conclusion.overall) throw new Error("Conclusion missing 'overall' section");
      return { conclusion, model: p.model, provider: p.name };
    } catch (e) {
      errors.push(`${p.name}: ${(e as Error).message}`);
      // fall through to next provider
    }
  }
  throw new Error(`All providers failed: ${errors.join(" | ")}`);
}


type SB = ReturnType<typeof createClient>;

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Field evidence: REAL measured data for this well and its field.
 * Real logs (provenance), core samples + core lab descriptions, perforations,
 * actual production history and analog wells of the same formation.
 */
async function loadFieldEvidence(sb: SB, wellId: string, wellRow: Record<string, unknown> | null) {
  const apiNumber = (wellRow?.api_number as string | null) ?? null;
  const formation = (wellRow?.formation as string | null) ?? null;

  const [logsRes, coreRes, coreAnRes, perfRes, prodRes, analogRes] = await Promise.all([
    sb.from("well_logs").select("source, measured_depth, porosity, water_saturation, gamma_ray").eq("well_id", wellId).limit(2000),
    sb.from("core_images").select("depth_from, depth_to, rock_type, formation, description, source").eq("well_id", wellId).limit(40),
    apiNumber
      ? sb.from("core_analyses").select("sample_name, rock_type, analysis, created_at").order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    sb.from("well_perforations").select("depth_from, depth_to, status, date_perforated").eq("well_id", wellId).limit(40),
    sb.from("production_history").select("production_month, oil_bbl, water_bbl, gas_mcf").eq("well_id", wellId)
      .order("production_month", { ascending: false }).limit(24),
    formation
      ? sb.from("geophysics_agent_runs").select("well_name, reservoir_rating, confidence, formation")
          .eq("formation", formation).neq("well_id", wellId).order("created_at", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const logs = (logsRes as { data?: Record<string, unknown>[] }).data ?? [];
  const sources = Array.from(new Set(logs.map((l) => String(l.source ?? "unknown"))));
  const realCount = logs.filter((l) => !/synthetic|generated|demo/i.test(String(l.source ?? ""))).length;
  const provenance = logs.length === 0 ? "NO_DB_LOGS" : realCount > 0 ? "REAL" : "SYNTHETIC";

  const cores = (coreRes as { data?: Record<string, unknown>[] }).data ?? [];
  const coreAnalyses = ((coreAnRes as { data?: Record<string, unknown>[] }).data ?? []).map((c) => ({
    sample: c.sample_name,
    rock_type: c.rock_type,
    lab_notes: String(c.analysis ?? "").slice(0, 600),
  }));

  const perfs = ((perfRes as { data?: Record<string, unknown>[] }).data ?? []).map((p) => ({
    from_ft: num(p.depth_from), to_ft: num(p.depth_to), status: p.status, date: p.date_perforated,
  }));

  const prod = (prodRes as { data?: Record<string, unknown>[] }).data ?? [];
  const oil = prod.map((p) => num(p.oil_bbl)).filter((v): v is number => v != null);
  const water = prod.map((p) => num(p.water_bbl)).filter((v): v is number => v != null);
  const totalOil = oil.reduce((a, b) => a + b, 0);
  const totalWater = water.reduce((a, b) => a + b, 0);

  const analogs = ((analogRes as { data?: Record<string, unknown>[] }).data ?? []).map((a) => ({
    well: a.well_name, rating: a.reservoir_rating, confidence: a.confidence,
  }));

  return {
    log_provenance: provenance,
    log_sources: sources,
    log_points_in_db: logs.length,
    measured_avg_porosity_pct: avg(logs.map((l) => num(l.porosity)).filter((v): v is number => v != null)),
    measured_avg_sw_pct: avg(logs.map((l) => num(l.water_saturation)).filter((v): v is number => v != null)),
    core_samples: cores.map((c) => ({
      depth_from_ft: num(c.depth_from), depth_to_ft: num(c.depth_to),
      rock_type: c.rock_type, formation: c.formation,
      description: String(c.description ?? "").slice(0, 300), source: c.source,
    })),
    core_lab_analyses: coreAnalyses,
    perforations: perfs,
    production_history: {
      months: prod.length,
      cum_oil_bbl: prod.length ? Math.round(totalOil) : null,
      cum_water_bbl: prod.length ? Math.round(totalWater) : null,
      water_cut_pct: totalOil + totalWater > 0 ? Math.round((totalWater / (totalOil + totalWater)) * 1000) / 10 : null,
      last_month: prod[0]?.production_month ?? null,
    },
    analog_wells_same_formation: analogs,
    evidence_grade:
      provenance === "REAL" && (cores.length > 0 || coreAnalyses.length > 0)
        ? "MEASURED (real logs + core)"
        : provenance === "REAL"
          ? "MEASURED (real logs, no core)"
          : "MODEL-BASED (no real logs in database)",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { well_id, well, interpretation, intervals, log_stats } = await req.json();
    if (!well_id || !interpretation) {
      return new Response(JSON.stringify({ error: "well_id and interpretation are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the authoritative well row + real field evidence (service role, read-only)
    let wellRow: Record<string, unknown> | null = null;
    let fieldEvidence: Record<string, unknown> | null = null;
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data } = await sb
        .from("wells")
        .select("well_name, api_number, operator, state, county, formation, total_depth, status, water_cut, production_oil")
        .eq("id", well_id)
        .maybeSingle();
      wellRow = data;
      try {
        fieldEvidence = await loadFieldEvidence(sb, well_id, wellRow);
      } catch { /* non-fatal */ }
    } catch { /* non-fatal */ }


    const agentInput = {
      well: wellRow ?? well ?? null,
      log_stats: log_stats ?? null,
      field_evidence: fieldEvidence,
      interpretation_summary: {
        gross_pay_ft: interpretation.grossPay,
        net_pay_ft: interpretation.netPay,
        net_to_gross_pct: interpretation.netToGross,
        missed_pay_ft: interpretation.totalMissedPay,
        avg_porosity_pct: interpretation.avgPorosity,
        avg_sw_pct: interpretation.avgSw,
        dominant_fluid: interpretation.dominantFluid,
        interval_count: interpretation.intervals?.length ?? 0,
      },
      // Cap intervals payload: top 12 by thickness, compact fields
      intervals: (Array.isArray(intervals) ? intervals : [])
        .slice(0, 12)
        .map((i: Record<string, unknown>) => ({
          top: i.top, bottom: i.bottom, thickness: i.thickness,
          avgGR: i.avgGR, avgPor: i.avgPor, avgSw: i.avgSw, avgRes: i.avgRes,
          vshale: i.vshale, fluidType: i.fluidType,
          isReservoir: i.isReservoir, isNetPay: i.isNetPay,
          timurPermMd: i.timurPermMd, permClass: i.permClass,
        })),
    };

    const { conclusion, model, provider } = await callLLM(agentInput);


    return new Response(
      JSON.stringify({ ok: true, agent: "geophysics-agent", model, provider, conclusion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
