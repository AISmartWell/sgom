import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const NVIDIA_NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'nvidia/llama-3.2-nv-embedqa-1b-v2';
const VL_MODEL = 'nvidia/nemotron-nano-12b-v2-vl';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, analysisType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
    if (!NVIDIA_API_KEY) {
      throw new Error('NVIDIA_API_KEY is not configured');
    }

    // Build prompt based on analysis type
    let systemPrompt: string;
    
    switch (analysisType) {
      case 'segmentation':
        systemPrompt = `You are an expert petrophysicist performing semantic segmentation on a core sample image.
Identify and classify distinct geological zones visible in the image.

Return a JSON object with this exact structure:
{
  "zones": [
    { "label": "Zone Name", "area_percent": number, "description": "Brief description", "confidence": number }
  ],
  "rock_type": "Primary rock type",
  "total_zones_identified": number,
  "interpretation": "Brief geological interpretation"
}

Be specific about mineral zones, pore spaces, cement types, and any diagenetic features visible.`;
        break;

      case 'fractures':
        systemPrompt = `You are an expert structural geologist analyzing fractures in a core sample image.
Identify all visible fractures, their types, orientations, and characteristics.

Return a JSON object with this exact structure:
{
  "fracture_count": number,
  "density": "description (e.g., 'Medium - 4.2/cm²')",
  "dominant_orientation": "e.g., NE-SW (N35°E ± 15°)",
  "fractures": [
    { "type": "Natural|Induced|Micro", "aperture_mm": number, "mineralized": boolean, "description": "brief" }
  ],
  "fracture_porosity_estimate": number,
  "interpretation": "Brief structural interpretation"
}`;
        break;

      case 'minerals':
        systemPrompt = `You are an expert mineralogist performing mineral composition mapping on a core sample image.
Identify all visible minerals, estimate their percentages, and describe their distribution.

Return a JSON object with this exact structure:
{
  "minerals": [
    { "name": "Mineral Name", "percent": number, "grain_size": "description", "distribution": "description" }
  ],
  "diagenetic_features": ["list of features"],
  "provenance_notes": "Brief provenance interpretation",
  "reservoir_impact": "How mineral composition affects reservoir quality"
}`;
        break;

      default:
        systemPrompt = `You are an expert petroleum geologist analyzing a core sample image using computer vision.
Provide a comprehensive geological assessment.

Return a JSON object with this exact structure:
{
  "rock_type": "Primary classification",
  "rock_type_confidence": number,
  "porosity_estimate_percent": number,
  "permeability_estimate_md": number,
  "fracture_count": number,
  "mineral_composition": [
    { "name": "Mineral", "percent": number }
  ],
  "grain_size": "description",
  "sorting": "well-sorted|moderately-sorted|poorly-sorted",
  "reservoir_quality": "Excellent|Good|Fair|Poor",
  "key_observations": ["list of observations"],
  "recommended_tests": ["list of recommended lab tests"]
}`;
    }

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
                text: `Analyze this core sample image. Analysis type: ${analysisType || 'full'}. Return ONLY valid JSON.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA NIM error:', response.status, errorText);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'NVIDIA API key is invalid or expired. Please update it.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'NVIDIA API rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`NVIDIA NIM error: ${response.status} — ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis returned from NVIDIA NIM');
    }

    // Try to parse as JSON, fallback to raw text
    let parsedResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsedResult = JSON.parse(jsonMatch[1].trim());
    } catch {
      parsedResult = { raw_analysis: content };
    }

    return new Response(
      JSON.stringify({ 
        analysis: parsedResult,
        model: VL_MODEL,
        analysisType: analysisType || 'full',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('NVIDIA CV analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'CV analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
