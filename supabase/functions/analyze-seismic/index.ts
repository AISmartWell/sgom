import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seismicData, horizons } = await req.json();

    if (!seismicData || !Array.isArray(seismicData)) {
      return new Response(
        JSON.stringify({ error: 'Seismic data array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert geophysicist specializing in seismic data interpretation. 
Analyze the provided seismic trace data and horizon markers to identify anomalies, structural features, and potential hydrocarbon indicators.

Your analysis MUST include these sections:

1. **Amplitude Anomalies**
   - Identify bright spots, dim spots, and flat spots
   - Depth intervals with anomalous amplitudes
   - Possible causes (gas, lithology change, fluid contact)

2. **Structural Interpretation**
   - Identified faults or fracture zones
   - Folding or deformation patterns
   - Unconformities detected

3. **Stratigraphic Features**
   - Layer continuity assessment
   - Pinch-outs or wedge geometries
   - Channel or reef features

4. **AVO / Fluid Indicators**
   - AVO class interpretation based on amplitude vs offset trends
   - Direct Hydrocarbon Indicators (DHIs)
   - Fluid contact indicators

5. **Reservoir Potential**
   - Zones of interest with depth ranges
   - Estimated net pay thickness
   - Risk assessment (low/medium/high)

6. **Bypassed Reserves Assessment**
   - Identify zones with bypassed hydrocarbons missed during original drilling/analysis
   - Estimate percentage of missed reserves (industry average: 20-40% of produced volume in mature fields)
   - Rank zones by recompletion/re-entry potential
   - Highlight formations where AI reinterpretation reveals productive horizons overlooked by traditional methods

7. **Automatic Lithology Classification**
   - Classify rock types (sandstone, shale, limestone, dolomite, siltstone) from seismic attributes
   - Identify productive vs non-productive intervals
   - Map formation boundaries and unconformities

8. **Recommendations**
   - Priority zones for further investigation including bypassed reserves targets
   - Wells recommended for recompletion based on bypassed pay identification
   - Suggested follow-up analyses
   - Drilling and re-entry target recommendations

Be specific with depth values and provide quantitative assessments where possible. Emphasize bypassed reserves opportunities.`;

    // Summarize data for the prompt
    const dataSummary = seismicData.map((d: any) => 
      `${d.depth}m: T1=${d.trace1.toFixed(1)}, T2=${d.trace2.toFixed(1)}, T3=${d.trace3.toFixed(1)}, Amp=${d.amplitude.toFixed(1)}`
    ).join('\n');

    const horizonSummary = horizons.map((h: any) => `${h.name} at ${h.depth}m`).join(', ');

    const userPrompt = `Analyze this seismic section data with ${seismicData.length} traces.

Horizon picks: ${horizonSummary}

Seismic trace values (Depth: Trace1, Trace2, Trace3, AvgAmplitude):
${dataSummary}

Seismic attributes summary:
- Coherence: 0.85
- Dip Angle: -12°
- Interval Velocity: 2.4 km/s
- AVO Gradient: 0.12

Provide a comprehensive seismic interpretation report.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis returned from AI');
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seismic analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
