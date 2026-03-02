
-- 1. Create well_alerts table for automated monitoring
CREATE TABLE public.well_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id uuid REFERENCES public.wells(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL, -- 'production_drop', 'water_cut_high', 'status_change'
  severity text NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  message text NOT NULL,
  previous_value double precision,
  current_value double precision,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.well_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts from their companies"
  ON public.well_alerts FOR SELECT TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "Users can update alerts in their companies"
  ON public.well_alerts FOR UPDATE TO authenticated
  USING (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

CREATE POLICY "System can insert alerts"
  ON public.well_alerts FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT uc.company_id FROM user_companies uc WHERE uc.user_id = auth.uid()));

-- Index for fast queries
CREATE INDEX idx_well_alerts_company_created ON public.well_alerts(company_id, created_at DESC);
CREATE INDEX idx_well_alerts_unread ON public.well_alerts(company_id, is_read) WHERE is_read = false;

-- 2. Trigger: auto-generate alerts when well production changes significantly
CREATE OR REPLACE FUNCTION public.check_well_production_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Alert: Oil production dropped > 20%
  IF OLD.production_oil IS NOT NULL AND NEW.production_oil IS NOT NULL 
     AND OLD.production_oil > 0
     AND ((OLD.production_oil - NEW.production_oil) / OLD.production_oil) > 0.2 THEN
    INSERT INTO well_alerts (well_id, company_id, alert_type, severity, message, previous_value, current_value)
    VALUES (NEW.id, NEW.company_id, 'production_drop', 'critical',
      format('Oil production dropped %.0f%% (%.0f → %.0f bbl/day)', 
        ((OLD.production_oil - NEW.production_oil) / OLD.production_oil * 100),
        OLD.production_oil, NEW.production_oil),
      OLD.production_oil, NEW.production_oil);
  END IF;

  -- Alert: Water cut exceeded 70%
  IF NEW.water_cut IS NOT NULL AND NEW.water_cut > 70
     AND (OLD.water_cut IS NULL OR OLD.water_cut <= 70) THEN
    INSERT INTO well_alerts (well_id, company_id, alert_type, severity, message, previous_value, current_value)
    VALUES (NEW.id, NEW.company_id, 'water_cut_high', 'warning',
      format('Water cut exceeded 70%% threshold (%.1f%%)', NEW.water_cut),
      OLD.water_cut, NEW.water_cut);
  END IF;

  -- Alert: Status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO well_alerts (well_id, company_id, alert_type, severity, message)
    VALUES (NEW.id, NEW.company_id, 'status_change', 'info',
      format('Well status changed: %s → %s', COALESCE(OLD.status, 'N/A'), COALESCE(NEW.status, 'N/A')));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_well_production_alerts
  AFTER UPDATE ON public.wells
  FOR EACH ROW
  EXECUTE FUNCTION public.check_well_production_alerts();

-- 3. Trigger: auto-link core_images to wells by api_number
CREATE OR REPLACE FUNCTION public.auto_link_core_image_to_well()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_well_id uuid;
BEGIN
  IF NEW.api_number IS NOT NULL AND NEW.well_id IS NULL THEN
    SELECT id INTO matched_well_id
    FROM wells
    WHERE api_number = NEW.api_number
      AND company_id = NEW.company_id
    LIMIT 1;

    IF matched_well_id IS NOT NULL THEN
      NEW.well_id := matched_well_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_link_core_image
  BEFORE INSERT OR UPDATE ON public.core_images
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_core_image_to_well();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.well_alerts;
