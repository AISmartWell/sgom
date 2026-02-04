import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WellData {
  id: string;
  name: string;
  currentProduction: number;
  remainingYears: number;
  depth: number;
  formationType: string;
  lastMaintenanceYears: number;
  waterCut: number;
}

interface FilterCriteria {
  minRemainingYears: number;
  maxWaterCut: number;
  includeClosedWells: boolean;
  region: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wells, filters } = await req.json() as { wells: WellData[]; filters: FilterCriteria };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompt for AI analysis
    const wellSummary = wells.map(w => 
      `- ${w.id} "${w.name}": ${w.currentProduction} BPD, ${w.remainingYears}yr life, ${w.depth}ft, ${w.formationType}, ${w.waterCut}% water cut, last maintenance ${w.lastMaintenanceYears}yr ago`
    ).join("\n");

    const systemPrompt = `You are an expert petroleum engineer AI specializing in well selection for Sonic Pulse Technology (SPT) treatment. 
SPT is effective for wells that:
- Have declining production but remaining reservoir potential
- Are 15+ years old with established flow patterns
- Have moderate water cut (20-60%)
- Are in suitable geological formations (sandstone, carbonate)
- Haven't had recent stimulation treatments

Analyze each well and provide:
1. An SPT suitability score (0-100)
2. Potential classification (high/medium/low)
3. Brief recommendation

Respond ONLY with valid JSON in this exact format:
{
  "rankings": [
    {
      "wellId": "W-001",
      "score": 94,
      "potential": "high",
      "recommendation": "Excellent SPT candidate - declining sandstone producer with ideal water cut",
      "factors": {
        "production": 85,
        "geology": 95,
        "age": 90,
        "waterCut": 92
      }
    }
  ],
  "summary": {
    "highPotential": 3,
    "mediumPotential": 2,
    "lowPotential": 3,
    "totalAnalyzed": 8,
    "topRecommendation": "Focus on Anadarko-Alpha and Anadarko-Beta for immediate SPT treatment"
  }
}`;

    const userPrompt = `Analyze these wells for SPT treatment suitability:

Region: ${filters.region}
Filter: Minimum ${filters.minRemainingYears} years remaining life, max ${filters.maxWaterCut}% water cut

Wells:
${wellSummary}

Provide rankings sorted by SPT treatment potential (highest first).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response (handle markdown code blocks if present)
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    const rankings = JSON.parse(cleanContent);

    return new Response(JSON.stringify(rankings), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("rank-wells error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
