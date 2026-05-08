
-- Automation enrollments
CREATE TABLE public.automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_drip_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view enrollments"
  ON public.automation_enrollments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can insert enrollments"
  ON public.automation_enrollments FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can update enrollments"
  ON public.automation_enrollments FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Automation drip logs
CREATE TABLE public.automation_drip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.automation_enrollments(id) ON DELETE CASCADE,
  drip_id UUID NOT NULL REFERENCES public.automation_drips(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_drip_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view drip logs"
  ON public.automation_drip_logs FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can insert drip logs"
  ON public.automation_drip_logs FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can update drip logs"
  ON public.automation_drip_logs FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Indexes
CREATE INDEX idx_drip_logs_pending ON public.automation_drip_logs (status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_enrollments_active ON public.automation_enrollments (lead_id, status) WHERE status = 'active';

-- Trigger: auto-enroll leads on status change
CREATE OR REPLACE FUNCTION public.auto_enroll_lead_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_seq RECORD;
  v_drip RECORD;
  v_enrollment_id uuid;
  v_schedule_at timestamptz;
  v_drip_index int;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Cancel existing active enrollments for this lead
  UPDATE public.automation_enrollments
  SET status = 'cancelled', updated_at = now()
  WHERE lead_id = NEW.id AND status = 'active';

  -- Find active sequences matching new status
  FOR v_seq IN
    SELECT s.* FROM public.automation_sequences s
    WHERE s.stage_key = NEW.status
      AND s.is_active = true
      AND s.organization_id = NEW.organization_id
    ORDER BY s.display_order
  LOOP
    -- Create enrollment
    INSERT INTO public.automation_enrollments (lead_id, sequence_id, organization_id)
    VALUES (NEW.id, v_seq.id, NEW.organization_id)
    RETURNING id INTO v_enrollment_id;

    -- Schedule all drips
    v_drip_index := 0;
    FOR v_drip IN
      SELECT * FROM public.automation_drips
      WHERE sequence_id = v_seq.id AND is_active = true
      ORDER BY display_order
    LOOP
      v_schedule_at := now() + (COALESCE(v_drip.delay_days, 0) || ' days')::interval
                             + (COALESCE(v_drip.delay_hours, 0) || ' hours')::interval;

      INSERT INTO public.automation_drip_logs (enrollment_id, drip_id, organization_id, scheduled_at)
      VALUES (v_enrollment_id, v_drip.id, NEW.organization_id, v_schedule_at);

      v_drip_index := v_drip_index + 1;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_enroll_lead_automation
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_lead_automation();
