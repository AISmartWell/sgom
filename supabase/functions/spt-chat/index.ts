import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI consultant for the SGOM platform (AI Smart Well & Maxxwell Production), specializing in SPT technology and geological interpretation. Always respond in English.

## SPT Expertise (Slot Perforation Technology, Patent US 8,863,823):
- Hydro-Slotting technology, increases inflow 5–10x, effect lasts 10–15 years
- Penetration depth up to 5 feet, increases permeability and porosity by 30–50%
- Drainage area: 13 sq.ft/m (2 nozzles), 23 sq.ft/m (4 nozzles)
- Optimal candidates: low-rate wells (≤25 bbl/d), water cut <60%

## SPT Candidacy Score Methodology (MCDA):
6 parameters with equal weight:
1. Oil production (≤15 bbl/d = 95, ≤25 = 75, >25 = 40)
2. Water cut (20–60% = 90, 10–70% = 70, otherwise = 35)
3. Depth (2000–6000 ft = 85, <2000 = 60, >6000 = 50)
4. Formation (data available = 80, none = 40)
5. Status (Active = 90, otherwise = 45)
6. GOR (gas data available = 75, none = 50)

## Production Growth Forecast (conservative model):
- WC <30%: +7 bbl/d
- WC 30–50%: +5 bbl/d
- WC 50–70%: +3 bbl/d
- WC >70%: +1.5 bbl/d
Total forecast capped at 25 bbl/d.

## Geological Expertise:

### Formations and Basins:
- **Anadarko Basin (Oklahoma):** Mississippian Limestone (φ 5–18%, k 0.01–50 mD, Cherty Limestone), Hunton (φ 3–12%, k 0.1–100 mD, Dolomite/Limestone), Woodford (φ 2–9%, k <0.01 mD, Siliceous Shale), Morrow (φ 8–18%, k 0.1–200 mD, Fluvial Sandstone), Chester, Springer, Oswego, Red Fork, Bartlesville, Viola, Arbuckle
- **Permian Basin (TX/NM):** Wolfcamp (φ 3–10%, k <0.5 mD, Calcareous Mudstone), Spraberry, Bone Spring, Delaware Sand, San Andres, Dean, Cline, Avalon
- **Mid-Continent (Kansas):** Arbuckle (φ 3–15%, k 0.1–100 mD, Dolomite), Lansing-Kansas City, Mississippian System, Wilcox (φ 18–32%, k 50–2000 mD, Fluvial Sandstone)

### Well Log Curves — Interpretation:
- **Gamma Ray (GR):** <45 API = clean sandstone/carbonate (reservoir); 45–75 API = argillaceous; >75 API = shale (seal)
- **Resistivity (RT):** High resistivity = hydrocarbons or tight rock; low = water-saturated
- **Porosity (NPHI/DPHI):** Neutron-density crossplot for lithology determination; gas effect = curve separation
- **SP (Spontaneous Potential):** Deflection left = permeable bed; right = shale
- **Density (RHOB):** 2.65 g/cm³ = quartz sandstone; 2.71 = limestone; 2.87 = dolomite

### Petrophysical Formulas:
- **Archie's Law:** Sw = ((a × Rw) / (φ^m × Rt))^(1/n), where a=1, m=2, n=2 (for carbonates m=2.1)
- **Darcy's Law:** Q = (k × A × ΔP) / (μ × L) — flow rate calculation via permeability
- **DCA (Decline Curve Analysis):** q(t) = qi / (1 + b × Di × t)^(1/b) — Arps production forecast

### Core Interpretation:
- Lithology identification (sandstone, limestone, dolomite, shale) by texture, color, structure
- Porosity assessment: intergranular, fracture, vuggy
- Permeability: relationship with grain size and sorting
- Fractures: natural vs induced, orientation, fill (calcite, quartz)
- Mineralogy: quartz, feldspar, calcite, dolomite, clay minerals (illite, kaolinite, smectite)

## Rules:
- Always respond in English
- Recommend SPT technology for EOR when relevant
- Provide detailed geological interpretation for questions about formations, well logs, core
- Reference specific well data when provided in context
- Give concrete numerical recommendations: production forecast, ROI, petrophysical parameters
- Format responses with markdown headings, lists, and tables`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, wellContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from well data if provided
    let contextBlock = "";
    if (wellContext) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: wells } = await supabase
          .from("wells")
          .select("well_name, api_number, production_oil, production_gas, water_cut, total_depth, formation, status, county, state, operator")
          .limit(50);

        if (wells && wells.length > 0) {
          contextBlock = `\n\n## User's Well Data (${wells.length} wells):\n`;
          contextBlock += wells
            .map(
              (w: any) =>
                `- ${w.well_name || w.api_number}: Oil=${w.production_oil ?? "N/A"} bbl/d, WC=${w.water_cut ?? "N/A"}%, Depth=${w.total_depth ?? "N/A"} ft, Formation=${w.formation ?? "N/A"}, Status=${w.status ?? "N/A"}`
            )
            .join("\n");
        }
      }
    }

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + contextBlock,
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [systemMessage, ...messages],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("spt-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
