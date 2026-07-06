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
  name: "list_wells",
  title: "List wells",
  description:
    "List wells visible to the signed-in user (RLS-scoped by company). Supports optional state, formation, status filters and a limit.",
  inputSchema: {
    state: z.string().optional().describe("Filter by US state code, e.g. 'KS'."),
    formation: z.string().optional().describe("Filter by formation name."),
    status: z.string().optional().describe("Filter by well status."),
    limit: z.number().int().positive().max(200).optional().describe("Max rows (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ state, formation, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = clientForUser(ctx)
      .from("wells")
      .select(
        "id, api_number, well_name, operator, state, county, formation, status, latitude, longitude, total_depth, production_oil, production_gas, water_cut, spud_date, completion_date",
      )
      .order("updated_at", { ascending: false })
      .limit(limit ?? 50);
    if (state) query = query.eq("state", state);
    if (formation) query = query.eq("formation", formation);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { count: data?.length ?? 0, wells: data ?? [] },
    };
  },
});
