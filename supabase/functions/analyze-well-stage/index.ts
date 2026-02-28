import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WellData {
  well_name: string | null;
  api_number: string | null;
  operator: string | null;
  county: string | null;
  state: string;
  formation: string | null;
  production_oil: number | null;
  production_gas: number | null;
  water_cut: number | null;
  total_depth: number | null;
  well_type: string | null;
  status: string | null;
}

const STAGE_PROMPTS: Record<string, string> = {
  field_scan: `You are an oil & gas field scanning AI. Analyze this well's location, basin, type, and status.
Provide a field reconnaissance assessment. Identify if this is in Permian Basin (TX), Anadarko Basin (OK), Delaware Basin (NM), or Eagle Ford (TX).
Assess whether the well location and field conditions are favorable.`,

  classification: `You are a petroleum data classification AI. Analyze the available data for this well.
Assess data completeness and quality. Evaluate production history availability, initial production rates, and flag any anomalies (high water cut, unusual gas-oil ratio).
Rate overall data quality as a percentage.`,

  core_analysis: `You are a petrophysical core analysis AI. Based on the well's formation, depth, and region, provide a realistic core analysis.
Estimate rock type, porosity (%), permeability (mD), and potential fracture density based on the formation geology.
For example: Woodford Shale typically has 4-8% porosity, while Hunton Limestone can have 12-20%.`,

  cumulative: `You are a production decline curve analysis AI. Analyze this well's current production data.
Calculate estimated decline rate (%/year) based on the production level and well maturity.
Estimate remaining recoverable reserves and economic life of the well.
Use Arps decline curve methodology concepts.`,

  spt_projection: `You are an SPT (Slot Perforation Technology, Patent US 8,863,823) projection AI for Maxxwell Production's patented hydro-slotting technology.
SPT creates precise slots in casing and cement. Key specs: inflow increase 5-10×, effect duration 10-15 years, penetration depth up to 5 ft, permeability increase 30-50%, porosity increase 30-50%. Target total inflow after SPT: 15-25 bbl/day.
Evaluate whether this well is a candidate for SPT treatment.
Assess based on water cut (<60% preferred), current production rate (>5 bbl/d), formation type, and depth.
Provide an SPT Candidacy Score (0-100) and projected production increase after SPT treatment.`,

  economic: `You are a petroleum economics AI. Perform an economic analysis of SPT treatment for this well.
Estimate treatment cost ($25,000-$45,000 range based on depth and formation).
Calculate projected additional revenue based on expected production uplift.
Compute ROI (%) and payback period (months).
Use oil price of $70/bbl for calculations.`,

  geophysical: `You are a geophysical analysis AI. Assess the subsurface characteristics of this well.
Evaluate the formation, estimate log-derived porosity and permeability.
Assess whether the formation is suitable for enhanced oil recovery based on geophysical properties.
Consider the total depth, formation type, and regional geology.`,

  eor: `You are an EOR recommendation AI for a company using SPT — Slot Perforation Technology (Patent US 8,863,823) by Maxxwell Production.
SPT is a hydro-slotting method that creates precise slots in casing and cement to improve reservoir connectivity. Key specs: inflow increase 5-10×, effect duration 10-15 years, penetration depth up to 5 ft, permeability increase 30-50%, porosity increase 30-50%.
Your recommendation MUST focus on SPT as the primary treatment method. Do NOT recommend other EOR methods like gas injection, CO2 flooding, waterflooding, or chemical EOR.
Synthesize all aspects: field conditions, data quality, core properties, decline analysis, SPT candidacy, economics, and geophysics.
Assign an overall SPT Candidacy Score (0-100) and classify priority as High, Medium, or Low.
Estimate expected production uplift factor specifically from SPT treatment.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { well, stageKey } = await req.json();
    const wellData = well as WellData;
    const prompt = STAGE_PROMPTS[stageKey];

    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown stage: ${stageKey}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wellDescription = `
Well: ${wellData.well_name || wellData.api_number || "Unknown"}
Operator: ${wellData.operator || "Unknown"}
Location: ${wellData.county || "Unknown"} County, ${wellData.state}
Formation: ${wellData.formation || "Unknown"}
Well Type: ${wellData.well_type || "Oil"}
Status: ${wellData.status || "Unknown"}
Total Depth: ${wellData.total_depth ? `${wellData.total_depth} ft` : "Unknown"}
Current Oil Production: ${wellData.production_oil != null ? `${wellData.production_oil} bbl/d` : "Unknown"}
Current Gas Production: ${wellData.production_gas != null ? `${wellData.production_gas} MCF/d` : "Unknown"}
Water Cut: ${wellData.water_cut != null ? `${wellData.water_cut}%` : "Unknown"}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Analyze this well:\n${wellDescription}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "stage_result",
              description: "Return the structured analysis result for this pipeline stage",
              parameters: {
                type: "object",
                properties: {
                  metrics: {
                    type: "array",
                    description: "Exactly 4 key metrics for this stage",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Short metric name" },
                        value: { type: "string", description: "Metric value with units" },
                        sentiment: {
                          type: "string",
                          enum: ["positive", "warning", "negative", "neutral"],
                          description: "Sentiment of this metric",
                        },
                      },
                      required: ["label", "value", "sentiment"],
                      additionalProperties: false,
                    },
                  },
                  verdict: {
                    type: "string",
                    description:
                      "One-line verdict with an emoji prefix (✅, ⚠️, ❌, 🚀, 💰, 🎯, 📊). E.g. '✅ Good reservoir quality'",
                  },
                },
                required: ["metrics", "verdict"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "stage_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Map sentiment to CSS color class
    const sentimentToColor: Record<string, string> = {
      positive: "text-success",
      warning: "text-warning",
      negative: "text-destructive",
      neutral: "",
    };

    const stageResult = {
      title: `${stageKey} Analysis Complete`,
      metrics: (result.metrics || []).slice(0, 4).map((m: any) => ({
        label: m.label,
        value: m.value,
        color: sentimentToColor[m.sentiment] || "",
      })),
      verdict: result.verdict || "Analysis complete",
    };

    return new Response(JSON.stringify(stageResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-well-stage error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
