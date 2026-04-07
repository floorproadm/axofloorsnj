
-- ══ FIX 1 ══ leads.converted_to_project_id missing FK
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_leads_converted_project') THEN
    ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_project FOREIGN KEY (converted_to_project_id) REFERENCES projects(id) ON DELETE SET NULL;
    RAISE NOTICE 'FIX 1 applied: fk_leads_converted_project added';
  ELSE
    RAISE NOTICE 'FIX 1 skipped: constraint already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 1 ERROR: %', SQLERRM;
END $$;

-- ══ FIX 2 ══ payments.collaborator_id missing FK to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_payments_collaborator') THEN
    ALTER TABLE payments ADD CONSTRAINT fk_payments_collaborator FOREIGN KEY (collaborator_id) REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'FIX 2 applied: fk_payments_collaborator added';
  ELSE
    RAISE NOTICE 'FIX 2 skipped: constraint already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 2 ERROR: %', SQLERRM;
END $$;

-- ══ FIX 3 ══ project_comments missing organization_id
DO $$ DECLARE null_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_comments' AND column_name = 'organization_id') THEN
    ALTER TABLE project_comments ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'FIX 3a: organization_id column added to project_comments';
  END IF;

  UPDATE project_comments pc SET organization_id = p.organization_id
  FROM projects p WHERE pc.project_id = p.id AND pc.organization_id IS NULL;

  SELECT COUNT(*) INTO null_count FROM project_comments WHERE organization_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE project_comments ALTER COLUMN organization_id SET NOT NULL;
    RAISE NOTICE 'FIX 3c: NOT NULL constraint applied';
  ELSE
    RAISE NOTICE 'FIX 3c SKIPPED: % rows still NULL', null_count;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 3 ERROR: %', SQLERRM;
END $$;

ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_comments' AND policyname = 'project_comments_org_isolation') THEN
    EXECUTE 'CREATE POLICY project_comments_org_isolation ON project_comments FOR ALL TO authenticated USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id())';
    RAISE NOTICE 'FIX 3d: RLS policy created';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 3d ERROR: %', SQLERRM;
END $$;

-- ══ FIX 4 ══ tasks missing FK on related_* columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tasks_project') THEN
    ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL;
    RAISE NOTICE 'FIX 4a: fk_tasks_project added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tasks_lead') THEN
    ALTER TABLE tasks ADD CONSTRAINT fk_tasks_lead FOREIGN KEY (related_lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    RAISE NOTICE 'FIX 4b: fk_tasks_lead added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tasks_partner') THEN
    ALTER TABLE tasks ADD CONSTRAINT fk_tasks_partner FOREIGN KEY (related_partner_id) REFERENCES partners(id) ON DELETE SET NULL;
    RAISE NOTICE 'FIX 4c: fk_tasks_partner added';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 4 ERROR: %', SQLERRM;
END $$;

-- ══ FIX 5 ══ material_requests.project_id missing FK
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'material_requests' AND column_name = 'project_id')
  AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_material_requests_project') THEN
    ALTER TABLE material_requests ADD CONSTRAINT fk_material_requests_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    RAISE NOTICE 'FIX 5 applied: fk_material_requests_project added';
  ELSE
    RAISE NOTICE 'FIX 5 skipped';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 5 ERROR: %', SQLERRM;
END $$;

-- ══ FIX 6 ══ feed_folders missing organization_id (with fallback backfill)
DO $$ DECLARE null_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feed_folders' AND column_name = 'organization_id') THEN
    ALTER TABLE feed_folders ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'FIX 6a: organization_id added to feed_folders';
  END IF;

  -- Backfill via feed_posts → projects
  UPDATE feed_folders ff SET organization_id = sub.org_id
  FROM (
    SELECT DISTINCT fp.folder_id, p.organization_id as org_id
    FROM feed_posts fp JOIN projects p ON fp.project_id = p.id
    WHERE fp.folder_id IS NOT NULL
  ) sub
  WHERE ff.id = sub.folder_id AND ff.organization_id IS NULL;

  -- Fallback: backfill remaining via feed_posts.organization_id directly
  UPDATE feed_folders ff SET organization_id = sub.org_id
  FROM (
    SELECT DISTINCT fp.folder_id, fp.organization_id as org_id
    FROM feed_posts fp
    WHERE fp.folder_id IS NOT NULL
  ) sub
  WHERE ff.id = sub.folder_id AND ff.organization_id IS NULL;

  -- Final fallback: use default org for any remaining
  UPDATE feed_folders SET organization_id = 'a0000000-0000-0000-0000-000000000001'
  WHERE organization_id IS NULL;

  RAISE NOTICE 'FIX 6b: backfill completed for feed_folders';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 6 ERROR: %', SQLERRM;
END $$;

ALTER TABLE feed_folders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_folders' AND policyname = 'feed_folders_org_isolation') THEN
    EXECUTE 'CREATE POLICY feed_folders_org_isolation ON feed_folders FOR ALL TO authenticated USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id())';
    RAISE NOTICE 'FIX 6d: RLS policy created';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 6d ERROR: %', SQLERRM;
END $$;

-- ══ FIX 7 ══ appointment_assignees junction table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_assignees') THEN
    CREATE TABLE appointment_assignees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (appointment_id, profile_id)
    );
    RAISE NOTICE 'FIX 7: appointment_assignees table created';
  ELSE
    RAISE NOTICE 'FIX 7 skipped: table already exists';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 7 ERROR: %', SQLERRM;
END $$;

ALTER TABLE appointment_assignees ENABLE ROW LEVEL SECURITY;

-- Simplified RLS: use appointments.organization_id directly
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_assignees' AND policyname = 'appointment_assignees_org_isolation') THEN
    EXECUTE 'CREATE POLICY appointment_assignees_org_isolation ON appointment_assignees FOR ALL TO authenticated USING (appointment_id IN (SELECT a.id FROM appointments a WHERE a.organization_id = get_user_org_id()))';
    RAISE NOTICE 'FIX 7b: RLS policy created';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 7b ERROR: %', SQLERRM;
END $$;

COMMENT ON COLUMN appointments.assigned_to IS 'DEPRECATED: use appointment_assignees junction table instead. Kept for backwards compat.';

-- ══ FIX 8 ══ projects.customer_id NOT NULL (SKIPPED — 2 rows have NULL)
-- 2 projects with customer_id NULL found: dfd4a351 and ae535a48 (both "TBD via parceiro")
-- NOT applying NOT NULL constraint. These need manual resolution first.
-- Adding a notice-only block:
DO $$ DECLARE null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM projects WHERE customer_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE projects ALTER COLUMN customer_id SET NOT NULL;
    RAISE NOTICE 'FIX 8 applied: projects.customer_id is now NOT NULL';
  ELSE
    RAISE NOTICE 'FIX 8 SKIPPED: % projects have NULL customer_id', null_count;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FIX 8 ERROR: %', SQLERRM;
END $$;
