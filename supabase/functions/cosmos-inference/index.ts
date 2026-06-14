import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// NOTE: nvidia/cosmos-reason1-7b is DEPRECATED on the hosted API catalog
// (only available as downloadable NIM container). For hosted inference we use
// the Nemotron reasoning family — same NVIDIA stack, chat-completions compatible.
const COSMOS_REASON_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';

interface WellPayload {
  name: string;
  api?: string;
  formation: string;
  depth: number;
  oil: number;
  waterCut: number;
  gor: number;
  porosity?: number;
  permeability?: number;
  status?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mode, well, prompt, modelOverride } = await req.json() as {
      mode: 'reason' | 'predict' | 'transfer';
      well?: WellPayload;
      prompt?: string;
      modelOverride?: string;
    };

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
    if (!NVIDIA_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'NVIDIA_API_KEY is not configured', fallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt: string;
    let userPrompt: string;

    switch (mode) {
      case 'reason':
        if (!well) throw new Error('well payload required for reason mode');
        systemPrompt = `You are NVIDIA Cosmos Reason, an explainable AI for oil & gas SPT (Slot Perforation Technology, US Patent 8,863,823) candidate selection.
Analyze the given well against six MCDA criteria: production rate, water cut, depth, formation, status, GOR.
Return ONLY valid JSON:
{
  "score": number (0-100),
  "verdict": "recommended" | "conditional" | "not_recommended",
  "uplift_bbl_d": number,
  "post_spt_oil": number,
  "key_reasons": [string, string, string],
  "summary": "1-2 sentence verdict"
}`;
        userPrompt = `Well: ${well.name} (${well.api ?? 'unknown API'})
Formation: ${well.formation}
Depth: ${well.depth} ft
Oil: ${well.oil} bbl/d
Water Cut: ${well.waterCut}%
GOR: ${well.gor} scf/bbl
Porosity: ${well.porosity ?? 'n/a'}%
Permeability: ${well.permeability ?? 'n/a'} mD
Status: ${well.status ?? 'Active'}

Score this well for SPT candidacy. Return JSON only.`;
        break;

      case 'predict':
        systemPrompt = `You are NVIDIA Cosmos Predict — a physics-based world model for post-SPT formation behavior.
Given a treatment scenario, forecast production response. Return ONLY valid JSON:
{
  "pre_spt_bbl_d": number,
  "post_spt_bbl_d": number,
  "uplift_bbl_d": number,
  "decline_rate_per_year": number,
  "expected_eur_uplift_bbl": number,
  "confidence": number (0-1),
  "physics_notes": string
}`;
        userPrompt = prompt ?? (well
          ? `Predict post-SPT behavior for: ${well.name}, ${well.formation}, ${well.depth} ft, current ${well.oil} bbl/d, WC ${well.waterCut}%.`
          : 'Predict post-SPT behavior for a marginal carbonate well.');
        break;

      case 'transfer':
        systemPrompt = `You are NVIDIA Cosmos Transfer — synthetic data augmentation for sparse well-log regions.
Given a target formation, generate a plausible synthetic well log profile summary. Return ONLY valid JSON:
{
  "formation": string,
  "depth_range_ft": [number, number],
  "synthetic_zones": [{ "name": string, "thickness_ft": number, "porosity_pct": number, "sw_pct": number }],
  "augmentation_factor": number,
  "notes": string
}`;
        userPrompt = prompt ?? `Generate synthetic log for ${well?.formation ?? 'Mississippian Limestone'} at ~${well?.depth ?? 4500} ft.`;
        break;

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    const response = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelOverride || COSMOS_REASON_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA Cosmos error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `NVIDIA Cosmos error: ${response.status}`,
          details: errorText.slice(0, 500),
          fallback: true,
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      const braceMatch = content.match(/\{[\s\S]*\}/);
      parsed = braceMatch ? JSON.parse(braceMatch[0]) : { raw: content };
    }

    return new Response(
      JSON.stringify({
        result: parsed,
        model: modelOverride || COSMOS_REASON_MODEL,
        mode,
        live: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('cosmos-inference error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Cosmos inference failed',
        fallback: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
