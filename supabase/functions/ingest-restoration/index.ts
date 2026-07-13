// Ingest restoration / new-well data + run Bayesian 1D calibration
// Endpoint: POST /functions/v1/ingest-restoration
// Body: {
//   well_id?, well_external_ref?, formation_key?, scope_key?,
//   restoration_date?, spt_depth_ft, oil_price,
//   predicted_qoil, actual_qoil, predicted_cum?, actual_cum?,
//   arps_b_used, arps_di_used, spt_multiplier_used,
//   payload?: object, source?: string
// }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 1-D Bayesian / Kalman update for a scalar parameter
function bayesUpdate(mu: number, sigma2: number, z: number, r2: number) {
  const newSigma2 = (sigma2 * r2) / (sigma2 + r2);
  const newMu = (mu * r2 + z * sigma2) / (sigma2 + r2);
  return { mu: newMu, sigma2: newSigma2 };
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ── Pressure-measurement branch ─────────────────────────────────────────────
// Body (mode="pressure_measurement"): {
//   well_id, formation_key?, scope_key?,
//   depth_ft, pressure_psi, temperature_f?, measurement_date?,
//   method?: "rft" | "dst" | "measured",  // default: "measured"
//   observation_variance?: number,        // psi/ft²  (defaults ~1e-4)
//   source?: string, payload?: object
// }
async function handlePressureMeasurement(
  supabase: any, body: any, company_id: string | null, user_id: string | null,
): Promise<Response> {
  const {
    well_id = null, formation_key = null, scope_key: scopeKeyIn = null,
    depth_ft, pressure_psi, temperature_f = null,
    measurement_date = new Date().toISOString(),
    method = "measured",
    observation_variance,
    source = "rft_ingest", payload = {},
  } = body ?? {};

  if (!well_id || !depth_ft || !pressure_psi) {
    return new Response(JSON.stringify({ error: "missing required fields: well_id, depth_ft, pressure_psi" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
  if (depth_ft <= 0 || pressure_psi <= 0) {
    return new Response(JSON.stringify({ error: "depth_ft and pressure_psi must be positive" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  // Resolve company from wells if not supplied
  if (!company_id) {
    const { data: w } = await supabase.from("wells").select("company_id").eq("id", well_id).maybeSingle();
    company_id = w?.company_id ?? null;
  }
  if (!company_id) {
    return new Response(JSON.stringify({ error: "unable to resolve company_id" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const z_grad = pressure_psi / depth_ft;           // observed gradient, psi/ft
  const r2 = Math.max(1e-5, observation_variance ?? 1e-4);

  // Determine scope
  const scope_type = "well";
  const scope_key = scopeKeyIn ?? well_id;

  // Load current params for this scope (fallback to global, then defaults)
  let { data: params } = await supabase.from("model_parameters")
    .select("*").eq("scope_type", scope_type).eq("scope_key", scope_key)
    .eq("company_id", company_id).maybeSingle();
  if (!params) {
    const { data: gl } = await supabase.from("model_parameters")
      .select("*").eq("scope_type", "global").eq("scope_key", "default").is("company_id", null).maybeSingle();
    params = gl ?? {
      arps_b: 0.5, arps_b_variance: 0.04,
      arps_di: 0.00018, arps_di_variance: 1e-7,
      spt_multiplier: 1.45, spt_multiplier_variance: 0.05,
      pressure_gradient_psi_ft: 0.465, pressure_gradient_variance: 0.01,
      confidence: 50, sample_count: 0, model_version: "v1.0",
    };
  }

  const mu = Number(params.pressure_gradient_psi_ft ?? 0.465);
  const sigma2 = Number(params.pressure_gradient_variance ?? 0.01);
  const upd = bayesUpdate(mu, sigma2, z_grad, r2);
  const clampedMu = clamp(upd.mu, 0.30, 1.00);

  // Insert measured point into well_pressures
  const { data: wp, error: wpErr } = await supabase.from("well_pressures").insert({
    well_id, company_id,
    p_current_psi: pressure_psi,
    datum_depth_ft: depth_ft,
    gradient_psi_ft: z_grad,
    method,
    temperature_f, measurement_date,
    confidence: 0.95,
    notes: `RFT/DST ingest via ingest-restoration (source=${source})`,
  }).select().single();
  if (wpErr) throw wpErr;

  const before = {
    pressure_gradient_psi_ft: mu, pressure_gradient_variance: sigma2,
    confidence: params.confidence, sample_count: params.sample_count,
  };
  const sample_count = (Number(params.sample_count) || 0) + 1;
  const stdRel = Math.sqrt(upd.sigma2) / Math.max(clampedMu, 0.01);
  const newConfidence = clamp(100 * (1 - stdRel), 5, 99.5);

  const upsertRow = {
    company_id, scope_type, scope_key,
    arps_b: params.arps_b, arps_b_variance: params.arps_b_variance,
    arps_di: params.arps_di, arps_di_variance: params.arps_di_variance,
    spt_multiplier: params.spt_multiplier, spt_multiplier_variance: params.spt_multiplier_variance,
    pressure_gradient_psi_ft: clampedMu,
    pressure_gradient_variance: upd.sigma2,
    confidence: newConfidence, sample_count,
    model_version: params.model_version ?? "v1.0",
    last_calibrated_at: new Date().toISOString(),
  };
  const { data: savedParam, error: upErr } = await supabase
    .from("model_parameters")
    .upsert(upsertRow, { onConflict: "company_id,scope_type,scope_key" })
    .select().single();
  if (upErr) throw upErr;

  const after = {
    pressure_gradient_psi_ft: clampedMu, pressure_gradient_variance: upd.sigma2,
    confidence: newConfidence, sample_count,
  };
  await supabase.from("calibration_audit").insert({
    company_id, model_parameter_id: savedParam.id, restoration_id: null,
    well_id, scope_type, scope_key, method: "ekf_pressure_1d",
    before_state: before, after_state: after,
    input_summary: {
      depth_ft, pressure_psi, temperature_f, measurement_date, method, z_grad, r2, source, payload,
      well_pressure_id: wp.id,
    },
    residual: z_grad - mu,
    mape: Math.abs(z_grad - mu) / Math.max(mu, 1e-6),
    confidence_delta: newConfidence - Number(before.confidence ?? 50),
  });

  return new Response(JSON.stringify({
    ok: true,
    well_pressure_id: wp.id,
    scope: { scope_type, scope_key },
    observation: { z_grad, r2 },
    before, after,
    message: "Pressure gradient auto-calibrated via 1-D EKF/Bayes",
  }), { headers: { ...cors, "Content-Type": "application/json" } });
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve company via auth header (best effort)
    let company_id: string | null = null;
    let user_id: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: auth } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        user_id = user.id;
        const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
        company_id = uc?.company_id ?? null;
      }
    }
    if (!company_id && body.company_id) company_id = body.company_id;

    // ── Branch: pressure_measurement (RFT / DST ingestion + EKF on gradient) ──
    if (body?.mode === "pressure_measurement") {
      return await handlePressureMeasurement(supabase, body, company_id, user_id);
    }

    const {
      well_id = null, well_external_ref = null, formation_key = null,
      scope_key: scopeKeyIn = null,
      restoration_date = new Date().toISOString(),
      spt_depth_ft = null, oil_price = null,
      predicted_qoil, actual_qoil,
      predicted_cum = null, actual_cum = null,
      arps_b_used, arps_di_used, spt_multiplier_used,
      payload = {}, source = "api",
    } = body ?? {};

    if (predicted_qoil == null || actual_qoil == null || arps_b_used == null || spt_multiplier_used == null) {
      return new Response(JSON.stringify({ error: "missing required fields: predicted_qoil, actual_qoil, arps_b_used, spt_multiplier_used" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }


    // 1) Insert raw restoration
    const { data: rest, error: restErr } = await supabase.from("well_restorations").insert({
      company_id, well_id, well_external_ref,
      restoration_date, spt_depth_ft, oil_price,
      predicted_qoil, actual_qoil, predicted_cum, actual_cum,
      arps_b_used, arps_di_used, spt_multiplier_used,
      payload, source, created_by: user_id,
    }).select().single();
    if (restErr) throw restErr;

    // 2) Determine scope (well > formation > global)
    const scope_type = well_id ? "well" : (formation_key ? "formation" : "global");
    const scope_key = scopeKeyIn ?? (well_id ?? well_external_ref ?? formation_key ?? "default");

    // 3) Load current params (or fallback to global)
    let { data: params } = await supabase.from("model_parameters")
      .select("*").eq("scope_type", scope_type).eq("scope_key", scope_key)
      .eq("company_id", company_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
    if (!params) {
      const { data: gl } = await supabase.from("model_parameters")
        .select("*").eq("scope_type", "global").eq("scope_key", "default").is("company_id", null).maybeSingle();
      params = gl ?? {
        arps_b: 0.5, arps_b_variance: 0.04,
        arps_di: 0.00018, arps_di_variance: 1e-7,
        spt_multiplier: 1.45, spt_multiplier_variance: 0.05,
        confidence: 50, sample_count: 0, model_version: "v1.0",
      };
    }

    // 4) Compute observation
    const residual = actual_qoil - predicted_qoil;
    const mape = Math.abs(residual) / Math.max(Math.abs(predicted_qoil), 1);
    const ratio = actual_qoil / Math.max(predicted_qoil, 1e-6);

    // Implied SPT multiplier from this single observation
    const z_spt = spt_multiplier_used * ratio;
    const r2_spt = Math.max(0.005, mape * mape * 0.2 + 0.005);

    // Implied Arps b: if actual declines slower than predicted (ratio > 1 over time) b is higher
    // Use predicted_cum/actual_cum if available, else degrade from rate ratio
    let z_b: number;
    if (actual_cum != null && predicted_cum != null && predicted_cum > 0) {
      const cumRatio = actual_cum / predicted_cum;
      z_b = clamp(arps_b_used * (1 + (cumRatio - 1) * 0.6), 0.05, 1.5);
    } else {
      z_b = clamp(arps_b_used * (1 + (ratio - 1) * 0.3), 0.05, 1.5);
    }
    const r2_b = Math.max(0.005, mape * mape * 0.4 + 0.01);

    const before = {
      arps_b: params.arps_b, arps_b_variance: params.arps_b_variance,
      spt_multiplier: params.spt_multiplier, spt_multiplier_variance: params.spt_multiplier_variance,
      confidence: params.confidence, sample_count: params.sample_count,
    };

    const updB = bayesUpdate(Number(params.arps_b), Number(params.arps_b_variance), z_b, r2_b);
    const updS = bayesUpdate(Number(params.spt_multiplier), Number(params.spt_multiplier_variance), z_spt, r2_spt);

    // Confidence: lower std-dev relative to mean → higher confidence
    const stdRel = (Math.sqrt(updB.sigma2) / Math.max(updB.mu, 0.01) + Math.sqrt(updS.sigma2) / Math.max(updS.mu, 0.01)) / 2;
    const newConfidence = clamp(100 * (1 - stdRel), 5, 99.5);
    const newSampleCount = (Number(params.sample_count) || 0) + 1;

    // 5) Upsert model_parameters for this scope
    const upsertRow = {
      company_id, scope_type, scope_key,
      arps_b: updB.mu, arps_b_variance: updB.sigma2,
      arps_di: params.arps_di, arps_di_variance: params.arps_di_variance,
      spt_multiplier: updS.mu, spt_multiplier_variance: updS.sigma2,
      confidence: newConfidence, sample_count: newSampleCount,
      model_version: params.model_version ?? "v1.0",
      last_calibrated_at: new Date().toISOString(),
    };
    const { data: savedParam, error: upErr } = await supabase
      .from("model_parameters")
      .upsert(upsertRow, { onConflict: "company_id,scope_type,scope_key" })
      .select().single();
    if (upErr) throw upErr;

    // 6) Audit log
    const after = {
      arps_b: updB.mu, arps_b_variance: updB.sigma2,
      spt_multiplier: updS.mu, spt_multiplier_variance: updS.sigma2,
      confidence: newConfidence, sample_count: newSampleCount,
    };
    await supabase.from("calibration_audit").insert({
      company_id, model_parameter_id: savedParam.id, restoration_id: rest.id,
      well_id, scope_type, scope_key, method: "bayesian_1d",
      before_state: before, after_state: after,
      input_summary: {
        predicted_qoil, actual_qoil, predicted_cum, actual_cum,
        arps_b_used, spt_multiplier_used, spt_depth_ft, oil_price,
        z_b, z_spt, r2_b, r2_spt, ratio,
      },
      residual, mape, confidence_delta: newConfidence - Number(before.confidence ?? 50),
    });

    // 7) Mark processed
    await supabase.from("well_restorations").update({ processed: true, processed_at: new Date().toISOString() }).eq("id", rest.id);

    return new Response(JSON.stringify({
      ok: true,
      restoration_id: rest.id,
      scope: { scope_type, scope_key },
      before, after,
      residual, mape,
      message: "Model auto-calibrated via Bayesian 1-D update",
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ingest-restoration error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
