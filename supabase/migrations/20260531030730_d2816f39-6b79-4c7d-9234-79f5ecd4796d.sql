-- Add new role values to app_role enum
-- Must be in its own migration: cannot use new enum values in same transaction in which they were created
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'salesperson';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'installer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';