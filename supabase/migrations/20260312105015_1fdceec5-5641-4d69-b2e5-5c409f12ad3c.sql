
-- PHASE 1: Types, Tables, Seed, Indexes

DO $$ BEGIN CREATE TYPE org_type AS ENUM ('flooring_owner', 'supply_partner'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE org_plan AS ENUM ('starter', 'pro', 'enterprise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'collaborator'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE supply_conn_status AS ENUM ('pending', 'active', 'paused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  type             org_type    NOT NULL DEFAULT 'flooring_owner',
  plan             org_plan    DEFAULT 'starter',
  logo_url         text,
  primary_color    text        DEFAULT '#1a1a2e',
  phone            text,
  email            text,
  address          text,
  city             text,
  state            text        DEFAULT 'NJ',
  zip_code         text,
  website_enabled  boolean     DEFAULT false,
  trial_ends_at    timestamptz,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id               uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid            NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role             org_member_role NOT NULL DEFAULT 'collaborator',
  created_at       timestamptz     DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS supply_connections (
  id               uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_org_id    uuid               NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flooring_org_id  uuid               NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status           supply_conn_status NOT NULL DEFAULT 'pending',
  notes            text,
  connected_at     timestamptz        DEFAULT now(),
  UNIQUE(supply_org_id, flooring_org_id),
  CHECK (supply_org_id != flooring_org_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user   ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org    ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_supply_conn_supply ON supply_connections(supply_org_id);
CREATE INDEX IF NOT EXISTS idx_supply_conn_floor  ON supply_connections(flooring_org_id);

-- Seed AXO Floors as tenant #1
INSERT INTO organizations (id, name, slug, type, plan, website_enabled, state)
VALUES ('a0000000-0000-0000-0000-000000000001', 'AXO Floors LLC', 'axo-floors', 'flooring_owner', 'enterprise', true, 'NJ')
ON CONFLICT (id) DO NOTHING;
