ALTER TABLE public.well_water_inputs
  ADD COLUMN IF NOT EXISTS reservoir_pressure_psi numeric,
  ADD COLUMN IF NOT EXISTS pressure_datum_ft numeric,
  ADD COLUMN IF NOT EXISTS bht_f numeric,
  ADD COLUMN IF NOT EXISTS bht_depth_ft numeric,
  ADD COLUMN IF NOT EXISTS surface_temp_f numeric;
COMMENT ON COLUMN public.well_water_inputs.reservoir_pressure_psi IS 'Measured reservoir pressure at pressure_datum_ft';
COMMENT ON COLUMN public.well_water_inputs.bht_f IS 'Bottom-hole temperature measured at bht_depth_ft';