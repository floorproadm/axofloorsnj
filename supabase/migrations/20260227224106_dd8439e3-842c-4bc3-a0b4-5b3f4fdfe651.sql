
-- Cleanup seed data: SEED_AXO_V1__

-- Delete related job_costs for seed projects
DELETE FROM public.job_costs WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related job_proof for seed projects
DELETE FROM public.job_proof WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related proposals for seed projects
DELETE FROM public.proposals WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related project_documents for seed projects
DELETE FROM public.project_documents WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related media_files for seed projects
DELETE FROM public.media_files WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related project_comments for seed projects
DELETE FROM public.project_comments WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related project_measurements and their areas
DELETE FROM public.measurement_areas WHERE measurement_id IN (
  SELECT id FROM public.project_measurements WHERE project_id IN (
    SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
  )
);
DELETE FROM public.project_measurements WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete related appointments for seed projects
DELETE FROM public.appointments WHERE project_id IN (
  SELECT id FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%'
);

-- Delete seed projects
DELETE FROM public.projects WHERE customer_name LIKE 'SEED_AXO_V1__%';

-- Delete seed leads
DELETE FROM public.leads WHERE name LIKE 'SEED_AXO_V1__%';

-- Clean audit_log entries from seed (best-effort)
DELETE FROM public.audit_log WHERE data_classification LIKE '%SEED_AXO_V1__%';
