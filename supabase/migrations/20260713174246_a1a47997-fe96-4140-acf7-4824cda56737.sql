
ALTER TABLE public.well_pressures
  ADD COLUMN IF NOT EXISTS temperature_f numeric,
  ADD COLUMN IF NOT EXISTS measurement_date timestamptz;

ALTER TABLE public.model_parameters
  ADD COLUMN IF NOT EXISTS pressure_gradient_psi_ft numeric NOT NULL DEFAULT 0.465,
  ADD COLUMN IF NOT EXISTS pressure_gradient_variance numeric NOT NULL DEFAULT 0.01;
