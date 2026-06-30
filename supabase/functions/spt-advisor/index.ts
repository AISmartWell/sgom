// SPT Advisor — agentic LLM with tool calling (openai/gpt-5.2)
// Picks the best well for SPT treatment, explains why, cites evidence, proposes alternatives,
// and flags out-of-distribution (OOD) inputs to lower confidence.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------- Tools (executed server-side) ----------

async function tool_list_wells(args: { company_id?: string; limit?: number }) {
  const limit = Math.min(args.limit ?? 50, 200);
  let q = sb.from("wells")
    .select("id,name,api_number,formation,depth,production_oil,water_cut,gas_oil_ratio,status,latitude,longitude,company_id")
    .order("production_oil", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (args.company_id) q = q.eq("company_id", args.company_id);
  const { data, error } = await q;
  if (error) throw error;
  return { count: data?.length ?? 0, wells: data ?? [] };
}

async function tool_get_well_context(args: { well_id: string }) {
  const [w, prod, perf] = await Promise.all([
    sb.from("wells").select("*").eq("id", args.well_id).maybeSingle(),
    sb.from("production_history").select("date,oil,water,gas").eq("well_id", args.well_id).order("date", { ascending: false }).limit(36),
    sb.from("well_perforations").select("*").eq("well_id", args.well_id).limit(10),
  ]);
  return {
    well: w.data,
    production_last_36: prod.data ?? [],
    perforations: perf.data ?? [],
  };
}

// MCDA scoring: SPT prefers moderate water cut (20-60%), age, sandstone/carbonate, declining trend
function scoreWell(w: any): { score: number; factors: Record<string, number>; reasons: string[] } {
  const wc = w.water_cut ?? 50;
  const prod = w.production_oil ?? 0;
  const depth = w.depth ?? 5000;
  const formation = (w.formation ?? "").toLowerCase();

  // Sub-scores (0..1)
  const waterCutScore = wc >= 20 && wc <= 60 ? 1 - Math.abs(wc - 40) / 40 : Math.max(0, 1 - Math.abs(wc - 40) / 60);
  const productionScore = Math.min(1, prod / 100); // sweet spot ~100 BPD
  const formationScore = /sand|carbonate|lime|dolomite/.test(formation) ? 1 : 0.4;
  const depthScore = depth >= 2000 && depth <= 10000 ? 1 : 0.6;
  const statusOk = (w.status ?? "").toLowerCase().includes("active") ? 1 : 0.5;

  const weights = { waterCut: 0.30, production: 0.25, formation: 0.20, depth: 0.10, status: 0.15 };
  const composite =
    waterCutScore * weights.waterCut +
    productionScore * weights.production +
    formationScore * weights.formation +
    depthScore * weights.depth +
    statusOk * weights.status;

  const reasons: string[] = [];
  if (waterCutScore > 0.7) reasons.push(`Water cut ${wc}% is in SPT sweet spot (20–60%)`);
  else reasons.push(`Water cut ${wc}% is outside SPT optimum`);
  if (formationScore === 1) reasons.push(`Formation "${w.formation}" responds well to sonic pulses`);
  if (productionScore > 0.5) reasons.push(`Current production ${prod} BPD has meaningful uplift headroom`);

  return {
    score: Math.round(composite * 100),
    factors: {
      water_cut: Math.round(waterCutScore * 100),
      production: Math.round(productionScore * 100),
      formation: Math.round(formationScore * 100),
      depth: Math.round(depthScore * 100),
      status: Math.round(statusOk * 100),
    },
    reasons,
  };
}

async function tool_rank_wells_for_spt(args: { company_id?: string; top_n?: number }) {
  const { wells } = await tool_list_wells({ company_id: args.company_id, limit: 200 });
  const ranked = (wells as any[])
    .map((w) => ({ well: w, ...scoreWell(w) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, args.top_n ?? 5);
  return { ranked };
}

async function tool_forecast_well(args: { well_id: string; months?: number }) {
  // Lightweight Arps decline forecast P10/P50/P90
  const ctx = await tool_get_well_context({ well_id: args.well_id });
  const q0 = ctx.well?.production_oil ?? 50;
  const months = args.months ?? 24;
  const Di = 0.08; // monthly nominal decline
  const b = 0.5;
  const baseline: number[] = [];
  for (let t = 1; t <= months; t++) {
    const q = q0 / Math.pow(1 + b * Di * t, 1 / b);
    baseline.push(Number(q.toFixed(2)));
  }
  // SPT uplift assumption: +30% step + slower decline
  const sptCase = baseline.map((q, i) => Number((q * (1.30 - i * 0.005)).toFixed(2)));
  const p10 = sptCase.map((q) => Number((q * 0.75).toFixed(2)));
  const p90 = sptCase.map((q) => Number((q * 1.20).toFixed(2)));
  return {
    well_id: args.well_id,
    baseline_no_treatment: baseline,
    spt_p10: p10,
    spt_p50: sptCase,
    spt_p90: p90,
    cumulative_uplift_bbl: Math.round(sptCase.reduce((a, b) => a + b, 0) - baseline.reduce((a, b) => a + b, 0)) * 30,
  };
}

async function tool_ood_check(args: { well_id: string }) {
  const ctx = await tool_get_well_context({ well_id: args.well_id });
  const w: any = ctx.well ?? {};
  // Reference training distribution (simplified, from SPT case library)
  const refs = {
    depth: { mean: 5500, std: 2500 },
    water_cut: { mean: 45, std: 20 },
    production_oil: { mean: 60, std: 50 },
  };
  const flags: Array<{ field: string; z: number; ood: boolean }> = [];
  for (const [k, r] of Object.entries(refs)) {
    const v = (w as any)[k];
    if (v == null) continue;
    const z = Math.abs((v - r.mean) / r.std);
    flags.push({ field: k, z: Number(z.toFixed(2)), ood: z > 3 });
  }
  const isOOD = flags.some((f) => f.ood);
  return {
    well_id: args.well_id,
    out_of_distribution: isOOD,
    z_scores: flags,
    note: isOOD
      ? "Inputs lie outside the 3σ training band. Confidence reduced — recommend additional core/log validation."
      : "Inputs are inside the training distribution.",
  };
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_wells",
      description: "List wells for a company (id, name, formation, depth, production, water cut, GOR, status).",
      parameters: {
        type: "object",
        properties: {
          company_id: { type: "string", description: "Optional company UUID filter" },
          limit: { type: "number", description: "Max wells, default 50" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rank_wells_for_spt",
      description: "Rank wells by SPT suitability using MCDA (water cut sweet spot, formation, production headroom).",
      parameters: {
        type: "object",
        properties: {
          company_id: { type: "string" },
          top_n: { type: "number", description: "Top N to return, default 5" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_well_context",
      description: "Full context for one well: header, last 36 months production, perforations.",
      parameters: {
        type: "object",
        properties: { well_id: { type: "string" } },
        required: ["well_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "forecast_well",
      description: "Arps decline forecast with SPT uplift (P10/P50/P90, cumulative uplift bbl).",
      parameters: {
        type: "object",
        properties: { well_id: { type: "string" }, months: { type: "number" } },
        required: ["well_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ood_check",
      description: "Out-of-distribution detector. Flags wells with parameters > 3σ from SPT training data and lowers confidence.",
      parameters: {
        type: "object",
        properties: { well_id: { type: "string" } },
        required: ["well_id"],
      },
    },
  },
];

async function dispatchTool(name: string, args: any) {
  switch (name) {
    case "list_wells": return await tool_list_wells(args);
    case "rank_wells_for_spt": return await tool_rank_wells_for_spt(args);
    case "get_well_context": return await tool_get_well_context(args);
    case "forecast_well": return await tool_forecast_well(args);
    case "ood_check": return await tool_ood_check(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

const SYSTEM_PROMPT = `You are SPT Advisor — an autonomous reservoir engineering agent for Slot Perforation Technology (SPT, US 8,863,823).

Goals each turn:
1. Use rank_wells_for_spt to shortlist candidates from the company's wells.
2. Use get_well_context + forecast_well on the top 1–2 wells.
3. Use ood_check to verify inputs are inside the training distribution. If OOD=true, lower confidence and flag it.
4. Produce a final recommendation in this exact JSON inside <answer>...</answer> tags:
{
  "recommended_well": { "id": "...", "name": "...", "score": 0-100, "confidence": 0-1 },
  "reasoning": "≤4 sentences citing concrete numbers (water cut %, depth ft, production BPD, formation)",
  "expected_uplift_bbl": number,
  "risks": ["..."],
  "alternatives": [ { "id":"...", "name":"...", "score":..., "why":"..." } ],
  "ood_flag": boolean
}

Rules:
- Always cite evidence from tool results (no invented numbers).
- If forecast P10 < baseline cumulative, mark as risky and propose an alternative.
- Never recommend a well you didn't inspect via get_well_context.
- Keep multi-step tool usage focused: typically 3–5 tool calls total.`;

async function callLLM(messages: any[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.2",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM ${res.status}: ${t}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, company_id } = await req.json();
    const trace: any[] = [];

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${question ?? "Pick the single best well for SPT treatment, explain why, and list 2 alternatives."}\n\nScope: company_id=${company_id ?? "ALL"}.`,
      },
    ];

    let final: string | null = null;
    for (let step = 0; step < 8; step++) {
      const data = await callLLM(messages);
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) throw new Error("No message from LLM");

      messages.push(msg);

      const calls = msg.tool_calls ?? [];
      if (calls.length === 0) {
        final = msg.content ?? "";
        trace.push({ step, kind: "final", content: final });
        break;
      }

      for (const c of calls) {
        const name = c.function?.name;
        let args: any = {};
        try { args = JSON.parse(c.function?.arguments ?? "{}"); } catch { /* */ }
        if (company_id && !args.company_id && name !== "get_well_context" && name !== "forecast_well" && name !== "ood_check") {
          args.company_id = company_id;
        }
        const t0 = Date.now();
        let result: any; let error: string | null = null;
        try { result = await dispatchTool(name, args); }
        catch (e) { error = (e as Error).message; result = { error }; }
        const ms = Date.now() - t0;

        trace.push({ step, kind: "tool", name, args, ms, error, result_preview: JSON.stringify(result).slice(0, 400) });

        messages.push({
          role: "tool",
          tool_call_id: c.id,
          content: JSON.stringify(result).slice(0, 6000),
        });
      }
    }

    // Try to parse <answer>{...}</answer>
    let answer: any = null;
    if (final) {
      const m = final.match(/<answer>([\s\S]*?)<\/answer>/);
      if (m) { try { answer = JSON.parse(m[1].trim()); } catch { /* */ } }
      if (!answer) {
        const m2 = final.match(/\{[\s\S]*\}/);
        if (m2) { try { answer = JSON.parse(m2[0]); } catch { /* */ } }
      }
    }

    return new Response(JSON.stringify({ ok: true, answer, raw: final, trace }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
