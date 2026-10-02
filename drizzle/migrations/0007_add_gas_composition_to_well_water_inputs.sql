ALTER TABLE public.well_water_inputs
  ADD COLUMN IF NOT EXISTS h2s_ppm numeric,
  ADD COLUMN IF NOT EXISTS co2_pct numeric,
  ADD COLUMN IF NOT EXISTS gas_note text;