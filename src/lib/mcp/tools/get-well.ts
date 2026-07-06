import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function clientForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "get_well",
  title: "Get well",
  description:
    "Fetch a single well by API number or well UUID, including latest alerts and perforations.",
  inputSchema: {
    api_number: z.string().optional().describe("10-digit API number."),
    well_id: z.string().uuid().optional().describe("Well UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ api_number, well_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!api_number && !well_id) {
      return { content: [{ type: "text", text: "Provide api_number or well_id." }], isError: true };
    }
    const supabase = clientForUser(ctx);
    let q = supabase.from("wells").select("*").limit(1);
    if (well_id) q = q.eq("id", well_id);
    else q = q.eq("api_number", api_number!);
    const { data: wells, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const well = wells?.[0];
    if (!well) return { content: [{ type: "text", text: "Well not found" }], isError: true };

    const [{ data: alerts }, { data: perforations }] = await Promise.all([
      supabase.from("well_alerts").select("*").eq("well_id", well.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("well_perforations").select("*").eq("well_id", well.id),
    ]);

    const payload = { well, alerts: alerts ?? [], perforations: perforations ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
