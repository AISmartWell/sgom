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
  name: "list_alerts",
  title: "List well alerts",
  description:
    "Recent well alerts (production drops, water-cut exceedances, status changes) for the signed-in user's company.",
  inputSchema: {
    severity: z.enum(["info", "warning", "critical"]).optional(),
    limit: z.number().int().positive().max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ severity, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = clientForUser(ctx)
      .from("well_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (severity) q = q.eq("severity", severity);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { count: data?.length ?? 0, alerts: data ?? [] },
    };
  },
});
