import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NVIDIA_NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const VL_MODEL = 'nvidia/nemotron-nano-12b-v2-vl';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, analysisMode, wellContext } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Seismic image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
    if (!NVIDIA_API_KEY) {
      throw new Error('NVIDIA_API_KEY is not configured');
    }

    let systemPrompt: string;

    switch (analysisMode) {
      case 'faults':
        systemPrompt = `You are an expert geophysicist performing computer vision analysis on a 2D seismic section image.
Focus on fault detection and structural interpretation.

Return a JSON object with this exact structure:
{
  "faults": [
    { "id": "F1", "type": "Normal|Reverse|Strike-slip|Thrust", "dip_angle_deg": number, "throw_m": number, "confidence": number, "depth_range": "e.g. 1200-2800m", "description": "brief" }
  ],
  "fault_count": number,
  "structural_style": "e.g. Extensional, Compressional, Transpressional",
  "deformation_intensity": "Low|Medium|High",
  "seal_risk": "Low|Medium|High",
  "interpretation": "Brief structural interpretation with implications for hydrocarbon trapping"
}`;
        break;

      case 'horizons':
        systemPrompt = `You are an expert geophysicist performing computer vision analysis on a 2D seismic section image.
Focus on horizon tracking and stratigraphic interpretation.

Return a JSON object with this exact structure:
{
  "horizons": [
    { "id": "H1", "name": "Interpreted name", "twt_ms": number, "depth_m": number, "continuity": "Continuous|Semi-continuous|Discontinuous", "amplitude": "Strong|Moderate|Weak", "confidence": number, "description": "brief" }
  ],
  "horizon_count": number,
  "unconformities": [
    { "depth_m": number, "type": "Angular|Erosional|Paraconformity", "description": "brief" }
  ],
  "depositional_environment": "description",
  "sequence_stratigraphy": "Brief sequence stratigraphic interpretation",
  "interpretation": "Overall stratigraphic framework"
}`;
        break;

      case 'anomalies':
        systemPrompt = `You are an expert geophysicist performing computer vision analysis on a 2D seismic section image.
Focus on amplitude anomaly detection and Direct Hydrocarbon Indicators (DHIs).

Return a JSON object with this exact structure:
{
  "anomalies": [
    { "id": "A1", "type": "Bright Spot|Dim Spot|Flat Spot|AVO Anomaly|Gas Chimney|Polarity Reversal", "depth_m": number, "lateral_extent_m": number, "confidence": number, "dhi_class": "Class I|II|III|IV", "description": "brief" }
  ],
  "anomaly_count": number,
  "dhi_summary": "Overall DHI assessment",
  "fluid_contacts": [
    { "type": "OWC|GOC|GWC", "depth_m": number, "confidence": number }
  ],
  "bypassed_potential": "None|Low|Medium|High",
  "risk_assessment": "Low|Medium|High",
  "interpretation": "Comprehensive anomaly interpretation with exploration/production implications"
}`;
        break;

      default:
        systemPrompt = `You are an expert geophysicist performing comprehensive computer vision analysis on a 2D seismic section image.
Identify faults, horizons, and amplitude anomalies.

Return a JSON object with this exact structure:
{
  "faults": [
    { "id": "F1", "type": "Normal|Reverse|Strike-slip", "dip_angle_deg": number, "confidence": number, "depth_range": "e.g. 1200-2800m" }
  ],
  "horizons": [
    { "id": "H1", "name": "Interpreted name", "depth_m": number, "continuity": "Continuous|Semi-continuous|Discontinuous", "confidence": number }
  ],
  "anomalies": [
    { "id": "A1", "type": "Bright Spot|Dim Spot|Flat Spot|AVO Anomaly", "depth_m": number, "confidence": number }
  ],
  "structural_style": "description",
  "reservoir_potential": "Low|Medium|High",
  "bypassed_reserves_potential": "None|Low|Medium|High",
  "key_observations": ["list"],
  "recommendations": ["list"],
  "interpretation": "Comprehensive interpretation summary"
}`;
    }

    const wellInfo = wellContext
      ? `\n\nWell context: ${wellContext.name || 'Unknown'}, Formation: ${wellContext.formation || 'Unknown'}, Depth: ${wellContext.depth || 'Unknown'} ft, Production: ${wellContext.oil || 'Unknown'} bbl/d`
      : '';

    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const response = await fetch(NVIDIA_NIM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this 2D seismic section image. Mode: ${analysisMode || 'full'}.${wellInfo} Return ONLY valid JSON.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.15,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA NIM error:', response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'NVIDIA API key is invalid or expired.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'NVIDIA API rate limit exceeded. Try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`NVIDIA NIM error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis returned from NVIDIA NIM');
    }

    let parsedResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsedResult = JSON.parse(jsonMatch[1].trim());
    } catch {
      parsedResult = { raw_analysis: content };
    }

    return new Response(
      JSON.stringify({
        analysis: parsedResult,
        model: VL_MODEL,
        analysisMode: analysisMode || 'full',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seismic CV analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Seismic CV analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
