import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NEMOTRON_MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1";

const SYSTEM_PROMPT = `You are Maria, the SGOM AI guide for the AI Smart Well platform, powered by NVIDIA Nemotron. Always answer in English, in a clear, friendly, expert tone.

Your job is to help users understand and use the platform: pipeline stages (1..9), SPT technology (US 8,863,823), MCDA scoring, well analysis, geology, automation, and how to operate specific modules.

## Rules
- Ground every technical answer in the knowledge context provided below. If the context does not contain the answer, say so honestly and give a best-effort explanation based on general oil & gas knowledge.
- Cite the source articles you used at the end of your answer as a bulleted list of "- <title> (/<slug>)".
- Prefer concise markdown: short paragraphs, lists, and tables when comparing options.
- Never invent module names, buttons, or metrics that are not in the context.
- Units: imperial (ft, bbl/d), resistivity in Ohm-m. Never use metric unless the user asks.
- Never say "SGOM" as a brand; the product is "AI Smart Well". "SGOM" is only the internal system name.
`;

interface KbArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  stage: number | null;
  summary: string | null;
  content: string;
  tags: string[];
  source_url: string | null;
  rank: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY");
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is not configured");

    // Full-text search over knowledge base using the latest user message
    const lastUser = [...(messages as any[])].reverse().find((m) => m.role === "user");
    const query = (lastUser?.content ?? "").toString().slice(0, 500);

    let contextBlock = "";
    const cited: { slug: string; title: string }[] = [];

    if (query.trim()) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data, error } = await supabase.rpc("search_sgom_knowledge", {
        q: query,
        match_count: 6,
      });
      if (error) console.warn("[sgom-guide-chat] search error", error.message);
      const articles = (data ?? []) as KbArticle[];
      if (articles.length > 0) {
        contextBlock =
          "\n\n## Knowledge context (top matches from AI Smart Well documentation):\n" +
          articles
            .map(
              (a, i) =>
                `### [${i + 1}] ${a.title} (/${a.slug}) — category: ${a.category}${a.stage ? `, stage ${a.stage}` : ""}\n${a.summary ? a.summary + "\n" : ""}${a.content.slice(0, 1400)}`,
            )
            .join("\n\n");
        for (const a of articles) cited.push({ slug: a.slug, title: a.title });
      } else {
        contextBlock =
          "\n\n## Knowledge context: no matching articles were found for this question.";
      }
    }

    const systemMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}${contextBlock}`,
    };

    const response = await fetch(NVIDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NEMOTRON_MODEL,
        messages: [systemMessage, ...messages],
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("NVIDIA Nemotron error", response.status, text.slice(0, 500));
      const status = response.status === 429 ? 429 : 500;
      return new Response(
        JSON.stringify({
          error:
            response.status === 429
              ? "Nemotron rate limit — please try again in a moment."
              : "Nemotron service error",
          details: text.slice(0, 300),
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Pass through the SSE stream plus a trailing sources header
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Sgom-Sources": encodeURIComponent(JSON.stringify(cited)),
        "X-Sgom-Model": NEMOTRON_MODEL,
      },
    });
  } catch (e) {
    console.error("sgom-guide-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
