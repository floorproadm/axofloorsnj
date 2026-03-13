-- ============================================================
-- MULTI-TENANCY PHASE 2: Secondary Tables
-- AXO Floors NJ / FloorPRO
-- Date: 2026-03-12
-- 
-- Tables covered: partners, tasks, feed_posts, feed_comments,
--   automation_sequences, automation_drips, notifications,
--   material_requests, referral_profiles, referrals
--
-- Safe to run: uses IF NOT EXISTS + backfill before NOT NULL
-- AXO org ID: a0000000-0000-0000-0000-000000000001
-- ============================================================

-- ── PARTNERS ─────────────────────────────────────────────────
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.partners
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.partners
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partners_org ON public.partners(organization_id);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_tenant_all" ON public.partners;
CREATE POLICY "partners_tenant_all" ON public.partners
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── TASKS ─────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.tasks
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.tasks
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_tenant_all" ON public.tasks;
CREATE POLICY "tasks_tenant_all" ON public.tasks
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── FEED POSTS ────────────────────────────────────────────────
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.feed_posts
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.feed_posts
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feed_posts_org ON public.feed_posts(organization_id);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_posts_tenant_all" ON public.feed_posts;
CREATE POLICY "feed_posts_tenant_all" ON public.feed_posts
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── FEED COMMENTS ─────────────────────────────────────────────
-- feed_comments is isolated via JOIN with feed_posts (same org)
-- Adding org_id directly for explicit RLS
ALTER TABLE public.feed_comments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.feed_comments
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.feed_comments
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feed_comments_org ON public.feed_comments(organization_id);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_comments_tenant_all" ON public.feed_comments;
CREATE POLICY "feed_comments_tenant_all" ON public.feed_comments
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── AUTOMATION SEQUENCES ──────────────────────────────────────
ALTER TABLE public.automation_sequences
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.automation_sequences
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.automation_sequences
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_automation_sequences_org ON public.automation_sequences(organization_id);

ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_sequences_tenant_all" ON public.automation_sequences;
CREATE POLICY "automation_sequences_tenant_all" ON public.automation_sequences
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── AUTOMATION DRIPS ──────────────────────────────────────────
ALTER TABLE public.automation_drips
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.automation_drips
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.automation_drips
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_automation_drips_org ON public.automation_drips(organization_id);

ALTER TABLE public.automation_drips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_drips_tenant_all" ON public.automation_drips;
CREATE POLICY "automation_drips_tenant_all" ON public.automation_drips
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── NOTIFICATIONS ─────────────────────────────────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.notifications
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_tenant_all" ON public.notifications;
CREATE POLICY "notifications_tenant_all" ON public.notifications
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── MATERIAL REQUESTS ─────────────────────────────────────────
ALTER TABLE public.material_requests
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.material_requests
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.material_requests
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_material_requests_org ON public.material_requests(organization_id);

ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_requests_tenant_all" ON public.material_requests;
CREATE POLICY "material_requests_tenant_all" ON public.material_requests
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── REFERRAL PROFILES ─────────────────────────────────────────
ALTER TABLE public.referral_profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.referral_profiles
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.referral_profiles
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_profiles_org ON public.referral_profiles(organization_id);

ALTER TABLE public.referral_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_profiles_tenant_all" ON public.referral_profiles;
CREATE POLICY "referral_profiles_tenant_all" ON public.referral_profiles
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── REFERRALS ─────────────────────────────────────────────────
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE public.referrals
  SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

ALTER TABLE public.referrals
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_org ON public.referrals(organization_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_tenant_all" ON public.referrals;
CREATE POLICY "referrals_tenant_all" ON public.referrals
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── VERIFY ────────────────────────────────────────────────────
-- Run this after to confirm all tables are covered:
-- SELECT table_name, COUNT(*) as rows_without_org
-- FROM (
--   SELECT 'partners' as table_name FROM partners WHERE organization_id IS NULL
--   UNION ALL SELECT 'tasks' FROM tasks WHERE organization_id IS NULL
--   UNION ALL SELECT 'feed_posts' FROM feed_posts WHERE organization_id IS NULL
--   UNION ALL SELECT 'automation_sequences' FROM automation_sequences WHERE organization_id IS NULL
--   UNION ALL SELECT 'automation_drips' FROM automation_drips WHERE organization_id IS NULL
-- ) t GROUP BY table_name;
