import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWellsTool from "./tools/list-wells";
import getWellTool from "./tools/get-well";
import searchKnowledgeTool from "./tools/search-knowledge";
import listAlertsTool from "./tools/list-alerts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ai-smart-well-mcp",
  title: "AI Smart Well",
  version: "0.1.0",
  instructions:
    "Tools for the AI Smart Well oil & gas analytics platform. Query wells, alerts, and the knowledge base (9-stage pipeline, SPT patent US 8,863,823, geology, petrophysics, EOR). All queries are scoped to the signed-in user's company via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listWellsTool, getWellTool, searchKnowledgeTool, listAlertsTool],
});
