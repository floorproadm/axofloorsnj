
-- Add team and scheduling fields to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS team_lead text,
  ADD COLUMN IF NOT EXISTS team_members text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_schedule text DEFAULT '8:00 AM - 5:00 PM';
