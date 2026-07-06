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
  name: "search_knowledge",
  title: "Search AI Smart Well knowledge base",
  description:
    "Full-text search across the AI Smart Well knowledge base (9-stage pipeline, SPT, geology, petrophysics, economics).",
  inputSchema: {
    query: z.string().min(1).describe("Natural-language search query."),
    limit: z.number().int().positive().max(20).optional().describe("Max results (default 8)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await clientForUser(ctx).rpc("search_sgom_knowledge", {
      q: query,
      match_count: limit ?? 8,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { count: data?.length ?? 0, articles: data ?? [] },
    };
  },
});
