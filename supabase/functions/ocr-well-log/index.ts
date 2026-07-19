// OCR for paper / scanned well logs via Lovable AI Gateway (Gemini vision).
// Accepts a base64 image (data URL or raw base64) and returns structured fields.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are an expert petrophysicist OCR engine. The user uploads a scanned or photographed
paper WELL LOG (caliper, GR, SP, resistivity, neutron, density, sonic strip-chart, header sheet,
mud-log, or completion report). Your job:

1) Read every readable text token (titles, dates, operator, well name, API number, county, state,
   formation tops, depth range, scale, curves legend, mud weight, casing depths, perforations).
2) Reconstruct the depth-vs-value table if curve values are legible. Use feet (ft) as the unit
   unless the log explicitly shows meters. NEVER invent numbers — if illegible mark null.
3) Return STRICTLY a JSON object — no prose, no markdown fences.`;

const SCHEMA_HINT = `{
  "well_name": string | null,
  "api_number": string | null,           // 10-digit US API if visible
  "operator": string | null,
  "field": string | null,
  "county": string | null,
  "state": string | null,
  "log_date": string | null,             // ISO date if visible
  "depth_range_ft": { "top": number | null, "bottom": number | null },
  "logged_curves": string[],             // e.g. ["GR","SP","RES","NPHI","RHOB"]
  "formation_tops": [ { "name": string, "depth_ft": number } ],
  "perforations": [ { "top_ft": number, "bottom_ft": number, "date": string | null } ],
  "log_readings": [                       // optional digitised samples
    { "depth_ft": number, "gr_api": number | null, "sp_mv": number | null,
      "res_ohmm": number | null, "nphi_pu": number | null, "rhob_gcc": number | null }
  ],
  "raw_text": string,                    // concatenated readable text
  "confidence": number,                  // 0..1 overall
  "notes": string                        // illegibility, damage, scan quality
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, mime = "image/png" } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'image' (base64 or data URL)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const dataUrl = image.startsWith("data:") ? image : `data:${mime};base64,${image}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gwRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${SYSTEM}\n\nSchema:\n${SCHEMA_HINT}` },
          {
            role: "user",
            content: [
              { type: "text", text: "Recognise this scanned well log and return JSON per schema." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!gwRes.ok) {
      const text = await gwRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", status: gwRes.status, body: text }), {
        status: gwRes.status === 429 || gwRes.status === 402 ? gwRes.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await gwRes.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { parsed = { raw_text: content, parse_error: true }; }

    return new Response(JSON.stringify({ ok: true, result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
