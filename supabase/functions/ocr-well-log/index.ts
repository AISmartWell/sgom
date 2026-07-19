// OCR for paper / scanned well logs via Lovable AI Gateway (Gemini vision).
// Accepts a base64 image (data URL or raw base64) and returns structured fields.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FAST_MODEL = "google/gemini-3-flash-preview";
const DEEP_MODEL = "google/gemini-2.5-pro";

const SYSTEM = `You are an expert petroleum well-log OCR engine and petrophysicist.
The user uploads a scanned or photographed paper WELL LOG (GR, SP, resistivity,
neutron, density, sonic strip-chart, wireline header, mud-log, completion report).

Your priorities, in order:
1) Read EVERY visible text token, including tiny footer/header labels, service-company names,
   pass names, depth labels, curve labels, scales, dates, formation names and handwritten notes.
2) Extract structured metadata only when visible. If a true operator/well/API is not visible,
   keep it null; do NOT use a wireline service company as the operator unless the scan says Operator.
3) Detect visual curve tracks and likely curve families even when exact curve labels are partly unreadable.
4) Extract formation tops, perforations, casing/tubing/depth intervals when legible.
5) When DIGITIZE mode is requested, sample the visible curves along depth (~20-40 rows evenly across
   the depth range) and fill log_readings with numeric values in per-track units (API for GR/SP,
   ohm-m for RES, v/v for NPHI, g/cc for RHOB). Leave a cell null if the curve is off-scale or unreadable.
   Otherwise leave log_readings empty.

Use feet (ft) as the unit unless the log explicitly shows meters. NEVER invent numeric values.
Return STRICTLY a JSON object — no prose, no markdown fences.`;

const SCHEMA_HINT = `{
  "document_title": string | null,
  "well_name": string | null,
  "api_number": string | null,
  "operator": string | null,
  "service_company": string | null,
  "field": string | null,
  "county": string | null,
  "state": string | null,
  "log_date": string | null,
  "depth_range_ft": { "top": number | null, "bottom": number | null },
  "logged_curves": string[],
  "curve_tracks": [
    { "track": string, "interpreted_curve": string | null, "visible_label": string | null, "description": string, "confidence": number }
  ],
  "visible_depth_markers_ft": number[],
  "formation_tops": [ { "name": string, "depth_ft": number } ],
  "perforations": [ { "top_ft": number, "bottom_ft": number, "date": string | null } ],
  "log_readings": [
    { "depth_ft": number, "gamma_ray": number | null, "sp": number | null, "resistivity": number | null, "neutron_porosity": number | null, "density": number | null }
  ],
  "visible_text_tokens": string[],
  "raw_text": string,
  "confidence": number,
  "notes": string
}`;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : { raw_text: trimmed };
  } catch (_) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
    if (fenced) {
      try {
        const parsed = JSON.parse(fenced);
        return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : { raw_text: fenced };
      } catch (_) {
        // fall through
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = trimmed.slice(start, end + 1);
      try {
        const parsed = JSON.parse(slice);
        return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : { raw_text: slice };
      } catch (_) {
        // fall through
      }
    }
    return { raw_text: trimmed, parse_error: true };
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 80);
}

function normalizeResult(parsed: Record<string, unknown>, model: string, fallbackUsed: boolean, keepReadings = false) {
  const result: Record<string, unknown> = { ...parsed };
  const textTokens = asStringArray(result.visible_text_tokens);
  const tracks = Array.isArray(result.curve_tracks) ? result.curve_tracks as Array<Record<string, unknown>> : [];
  const curvesFromTracks = tracks
    .map((track) => String(track?.interpreted_curve ?? track?.visible_label ?? "").trim().toUpperCase())
    .filter((label) => label && label !== "NULL" && label !== "UNKNOWN" && label !== "UNREADABLE");
  const existingCurves = asStringArray(result.logged_curves).map((curve) => curve.toUpperCase());
  const loggedCurves = Array.from(new Set([...existingCurves, ...curvesFromTracks])).slice(0, 12);
  const rawText = typeof result.raw_text === "string" ? result.raw_text.trim() : "";
  const joinedText = rawText || textTokens.join(" · ");

  result.visible_text_tokens = textTokens;
  result.logged_curves = loggedCurves;
  result.curve_tracks = tracks;
  if (!keepReadings) {
    result.log_readings = [];
  } else if (!Array.isArray(result.log_readings)) {
    result.log_readings = [];
  }
  result.raw_text = joinedText;
  result._meta = { model, fallback_used: fallbackUsed, digitized: keepReadings };
  return result;
}

function extractionScore(result: Record<string, unknown>) {
  const strings = [
    result.document_title,
    result.well_name,
    result.api_number,
    result.operator,
    result.service_company,
    result.field,
    result.county,
    result.state,
    result.log_date,
  ].filter((value) => typeof value === "string" && value.trim().length >= 2).length;
  const depth = result.depth_range_ft as { top?: unknown; bottom?: unknown } | undefined;
  const depthScore = typeof depth?.top === "number" || typeof depth?.bottom === "number" ? 1 : 0;
  const arrayScore = [
    result.visible_text_tokens,
    result.logged_curves,
    result.curve_tracks,
    result.formation_tops,
    result.perforations,
    result.visible_depth_markers_ft,
  ].reduce((sum, value) => sum + (Array.isArray(value) && value.length > 0 ? 1 : 0), 0);
  const rawScore = typeof result.raw_text === "string" && result.raw_text.trim().length >= 20 ? 2 : 0;
  return strings + depthScore + arrayScore + rawScore;
}

async function callGateway(apiKey: string, model: string, dataUrl: string, mode: "fast" | "deep" | "digitize") {
  const userInstruction = mode === "digitize"
    ? "DIGITIZE mode. Return every visible text token, header/footer labels, curve-track labels AND sample the visible curves along depth (20-40 evenly spaced rows) into log_readings with numeric values per curve (leave a cell null if unreadable). Return JSON per schema."
    : mode === "deep"
      ? "Run a high-detail OCR pass. Return every visible text token and visual curve-track detail, even when true well/API metadata is absent. Leave log_readings empty. Return JSON per schema."
      : "Recognise this scanned well log. Prioritise visible text tokens, header/footer labels and curve-track labels. Leave log_readings empty. Return JSON per schema.";

  let lastBody = "";
  let lastStatus = 502;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const gwRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM}\n\nSchema:\n${SCHEMA_HINT}` },
          {
            role: "user",
            content: [
              { type: "text", text: userInstruction },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (gwRes.ok) {
      const json = await gwRes.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "{}";
      return parseJsonObject(content);
    }

    lastStatus = gwRes.status;
    lastBody = await gwRes.text();
    if (gwRes.status !== 429 && gwRes.status < 500) break;
    if (attempt < 3) await wait(500 * attempt * attempt);
  }

  throw new Response(JSON.stringify({ error: "AI gateway error", status: lastStatus, body: lastBody }), {
    status: lastStatus === 429 || lastStatus === 402 ? lastStatus : 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, mime = "image/png", quality = "auto" } = await req.json();
    if (!image || typeof image !== "string") {
      return jsonResponse({ error: "Missing 'image' (base64 or data URL)" }, 400);
    }
    const dataUrl = image.startsWith("data:") ? image : `data:${mime};base64,${image}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "LOVABLE_API_KEY missing" }, 500);
    }

    if (quality === "digitize") {
      const deep = normalizeResult(
        await callGateway(apiKey, DEEP_MODEL, dataUrl, "digitize"),
        DEEP_MODEL,
        false,
        true,
      );
      return jsonResponse({
        ok: true,
        result: deep,
        model: DEEP_MODEL,
        fallbackUsed: false,
        digitized: true,
        extractionScore: extractionScore(deep),
      });
    }

    const firstModel = quality === "deep" ? DEEP_MODEL : FAST_MODEL;
    const firstMode: "fast" | "deep" | "digitize" = quality === "deep" ? "deep" : "fast";
    const first = normalizeResult(await callGateway(apiKey, firstModel, dataUrl, firstMode), firstModel, false);
    const firstScore = extractionScore(first);

    if (quality !== "fast" && firstModel === FAST_MODEL && firstScore < 6) {
      const deep = normalizeResult(await callGateway(apiKey, DEEP_MODEL, dataUrl, "deep"), DEEP_MODEL, true);
      return jsonResponse({
        ok: true,
        result: deep,
        model: DEEP_MODEL,
        fallbackUsed: true,
        extractionScore: extractionScore(deep),
      });
    }

    return jsonResponse({
      ok: true,
      result: first,
      model: firstModel,
      fallbackUsed: false,
      extractionScore: firstScore,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return jsonResponse({ error: String(e) }, 500);
  }
});
