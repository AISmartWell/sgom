// Lease document ingest: extracts wells + monthly sales from lease reports (RTF/TXT/CSV/XLSX text).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const Body = z.object({ text: z.string().min(20).max(200_000), filename: z.string().max(300).optional() });

const TOOL = {
  type: "function",
  function: {
    name: "save_lease",
    description: "Structured lease data extracted from the documents.",
    parameters: {
      type: "object",
      properties: {
        lease_name: { type: "string" },
        operator: { type: "string" },
        county: { type: "string" },
        state: { type: "string", description: "2-letter US state code" },
        formation: { type: "string" },
        wells: {
          type: "array",
          items: {
            type: "object",
            properties: {
              well_name: { type: "string", description: "e.g. 'Foote Lease #1'" },
              api_number: { type: "string" },
              well_type: { type: "string", enum: ["producer", "injector", "other"] },
              status: { type: "string" },
              total_depth_ft: { type: "number" },
            },
            required: ["well_name", "well_type"],
          },
        },
        monthly_sales: {
          type: "array",
          description: "Lease-level (or per-well if given) monthly volumes",
          items: {
            type: "object",
            properties: {
              month: { type: "string", description: "YYYY-MM" },
              oil_bbl: { type: "number" },
              water_bbl: { type: "number" },
              gas_mcf: { type: "number" },
              well_name: { type: "string", description: "only if the volume belongs to one well" },
            },
            required: ["month", "oil_bbl"],
          },
        },
        notes: { type: "array", items: { type: "string" } },
      },
      required: ["lease_name", "wells", "monthly_sales"],
    },
  },
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI key missing" }, 500);

    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You extract oil & gas lease data from operator documents. Only use numbers present in the text — never invent. Wells without production (orphan/plugged) may be listed with status. Months as YYYY-MM. If sales are given for the whole lease, omit well_name.",
            },
            { role: "user", content: `File: ${parsed.data.filename ?? "document"}\n\n${parsed.data.text}` },
          ],
          tools: [TOOL],
          tool_choice: { type: "function", function: { name: "save_lease" } },
        }),
      });
      if (r.status === 429) return json({ error: "Rate limit — try again in a minute" }, 429);
      if (r.status === 402) return json({ error: "AI credits exhausted" }, 402);
      if (r.ok) {
        const d = await r.json();
        const args = d.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) return json({ ok: true, lease: JSON.parse(args) });
        lastErr = "No structured output";
      } else lastErr = `AI ${r.status}`;
      await new Promise((res) => setTimeout(res, 800 * 2 ** attempt));
    }
    return json({ error: lastErr }, 502);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
