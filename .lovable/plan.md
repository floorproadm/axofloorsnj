
# Execucao: Limpeza de Status + Ciclo Collaborator + SLA V0

## PARTE 1: Limpeza Total de Status Legados

### 1A. `src/hooks/admin/useAdminData.ts`
Substituir filtros de stats (linhas 101-108):
- `'new'` -> `'cold_lead'`
- `'contacted'` -> `'warm_lead'`
- `'qualified'` -> `'estimate_requested'`
- `'converted'` -> `'in_production'`
- Renomear campos do interface `AdminStats` para refletir pipeline real (`coldLeads`, `warmLeads`, etc.)

### 1B. `src/pages/admin/Intake.tsx`
- Linha 199: `l.status === 'proposal'` -> `l.status === 'proposal_sent'`
- Linhas 236, 248: `'new_lead'` -> `'cold_lead'`
- Linha 248: `'appt_scheduled'` -> `'estimate_scheduled'`
- Linha 308: `status: 'new_lead'` -> `status: 'cold_lead'`
- Linhas 370-381: Substituir mapa `getStatusBadge` hardcoded por import de `STAGE_LABELS` + `STAGE_CONFIG` do `useLeadPipeline`

### 1C. Formularios publicos (todos `status: 'new'` -> `status: 'cold_lead'`)
- `src/pages/Contact.tsx` (linha 88)
- `src/pages/Builders.tsx` (linha 112)
- `src/pages/Realtors.tsx` (linha 126)
- `src/pages/Quiz.tsx` (linhas 215, 253)
- `src/components/shared/ContactForm.tsx` (linhas 148, 174)
- `src/components/shared/ContactSection.tsx` (linhas 52, 78)
- `src/components/shared/LeadMagnetGate.tsx` (linha 78)
- `src/hooks/useLeadCapture.ts` (linha 37)
- `src/pages/FloorDiagnostic.tsx` (linha 171): `'qualified'`/`'disqualified'` -> `'cold_lead'` (qualificacao fica em notes)

---

## PARTE 2: Collaborator Upload -> Admin Dashboard

### 2A. Edge Function `supabase/functions/collaborator-upload/index.ts`
Apos insert bem-sucedido em `media_files` (antes do return 201), inserir registro em `audit_log`:
```typescript
await serviceClient.from("audit_log").insert({
  user_id: userId,
  user_role: "collaborator",
  operation_type: "COLLABORATOR_UPLOAD",
  table_accessed: "media_files",
  data_classification: JSON.stringify({
    project_id: projectId,
    storage_path: storagePath,
    folder_type: folderType,
  }),
});
```

### 2B. Migration SQL: Atualizar RPC `get_dashboard_metrics()`
Adicionar bloco `recentFieldUploads` ao retorno:
- Query `audit_log` onde `operation_type = 'COLLABORATOR_UPLOAD'` nas ultimas 24h
- JOIN com `projects` para pegar `customer_name`
- Limite 10, ordenado por `created_at DESC`

### 2C. `src/hooks/admin/useDashboardData.ts`
- Adicionar `recentFieldUploads` ao tipo `DashboardRPCResponse`
- Expor `recentFieldUploads` no retorno do hook
- Adicionar `slaBreaches` ao tipo e retorno (para Parte 3)

### 2D. `src/pages/admin/Dashboard.tsx`
- Incluir uploads recentes e SLA breaches no array `priorityTasks`
- Novo type `'field_upload'` com link `/admin/jobs`

### 2E. `src/components/admin/dashboard/PriorityTasksList.tsx`
- Adicionar types `'field_upload'`, `'sla_followup'`, `'sla_estimate'` ao union type
- Adicionar icones correspondentes: `Camera`, `PhoneOff`, `Timer`

---

## PARTE 3: SLA V0 - Tempo Como Variavel Real

### 3A. Migration SQL (unica, junto com 2B)
```sql
-- 1. Nova coluna
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_changed_at timestamptz DEFAULT now();

-- 2. Backfill
UPDATE leads SET status_changed_at = COALESCE(updated_at, created_at)
WHERE status_changed_at IS NULL;

-- 3. Trigger
CREATE OR REPLACE FUNCTION set_status_changed_at()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_status_changed_at ON leads;
CREATE TRIGGER trg_set_status_changed_at
  BEFORE UPDATE ON leads FOR EACH ROW
  EXECUTE FUNCTION set_status_changed_at();

-- 4. View: follow-up overdue
CREATE OR REPLACE VIEW leads_followup_overdue AS
SELECT id, name, next_action_date
FROM leads
WHERE status = 'proposal_sent'
  AND next_action_date IS NOT NULL
  AND next_action_date < current_date;

-- 5. View: estimate stale (>3 dias)
CREATE OR REPLACE VIEW leads_estimate_scheduled_stale AS
SELECT id, name,
  EXTRACT(DAY FROM now() - status_changed_at)::int AS days_stale
FROM leads
WHERE status = 'estimate_scheduled'
  AND converted_to_project_id IS NULL
  AND status_changed_at < now() - interval '3 days';

-- 6. Atualizar get_dashboard_metrics() com slaBreaches + recentFieldUploads
```

### 3B. Dashboard Integration
SLA breaches aparecem como tasks no `priorityTasks`:
- Follow-up overdue = cor `blocked`, link `/admin/leads?status=proposal_sent`
- Estimate stale = cor `risk`, link `/admin/leads?status=estimate_scheduled`

---

## Checklist de Validacao

**SQL pos-deploy:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'status_changed_at';

SELECT * FROM leads_followup_overdue LIMIT 5;
SELECT * FROM leads_estimate_scheduled_stale LIMIT 5;
```

**Network (DevTools):**
- `POST /rpc/get_dashboard_metrics` deve retornar: `pipeline`, `financial`, `aging_top10`, `alerts`, `money`, `missingProgressPhotos`, `recentFieldUploads`, `slaBreaches`

**Grep final:**
- Zero ocorrencias de `'new'`, `'new_lead'`, `'contacted'`, `'qualified'`, `'converted'`, `'proposal'`, `'appt_scheduled'` como status no frontend

---

## Arquivos Modificados (resumo)

| Arquivo | Tipo |
|---|---|
| Migration SQL (1) | DB: coluna + trigger + views + RPC update |
| `src/hooks/admin/useAdminData.ts` | Corrigir filtros legados |
| `src/pages/admin/Intake.tsx` | Corrigir status + badges |
| `src/pages/Contact.tsx` | `'new'` -> `'cold_lead'` |
| `src/pages/Builders.tsx` | `'new'` -> `'cold_lead'` |
| `src/pages/Realtors.tsx` | `'new'` -> `'cold_lead'` |
| `src/pages/Quiz.tsx` | `'new'` -> `'cold_lead'` |
| `src/pages/FloorDiagnostic.tsx` | `'qualified'` -> `'cold_lead'` |
| `src/components/shared/ContactForm.tsx` | `'new'` -> `'cold_lead'` |
| `src/components/shared/ContactSection.tsx` | `'new'` -> `'cold_lead'` |
| `src/components/shared/LeadMagnetGate.tsx` | `'new'` -> `'cold_lead'` |
| `src/hooks/useLeadCapture.ts` | `'new'` -> `'cold_lead'` |
| `supabase/functions/collaborator-upload/index.ts` | Audit log insert |
| `src/hooks/admin/useDashboardData.ts` | Novos tipos + retorno |
| `src/pages/admin/Dashboard.tsx` | Novos task types |
| `src/components/admin/dashboard/PriorityTasksList.tsx` | Novos icones |
