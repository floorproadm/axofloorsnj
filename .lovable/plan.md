## Objetivo

Visibilidade e controle das automações por lead. Saber em tempo real: o que foi enviado, o que está agendado, se falhou, e poder pausar/cancelar quando o lead responder.

## O que já existe (não vamos refazer)

- `automation_enrollments` (status: active/completed/cancelled) e `automation_drip_logs` (status: pending/sent/failed/skipped) já registram tudo.
- Trigger `auto_enroll_lead_automation` **já cancela enrollments ativos quando o status do lead muda** — auto-pausa por mudança de stage já funciona no banco; só falta expor isso na UI.
- `DripLogsViewer` global em /admin/automations já existe.

## O que vamos construir

### 1. Painel de Automação no Lead Detail (peça central)
Nova aba/seção dentro de `LeadDetail.tsx` chamada **"Automações"** com:
- **Status atual**: pill "Ativo" / "Pausado" / "Sem automação" + nome da sequência.
- **Próximo envio**: "Email em 2d 4h" (próximo log com status=pending, ordenado por scheduled_at).
- **Timeline vertical**: cada drip da sequência com ícone de status (✓ enviado, ⏱ agendado, ✗ falhou, — pulado), data, canal, assunto. Falhas mostram tooltip com `error_message`.
- **Botões de controle**:
  - `Pausar automação` → UPDATE enrollment status='cancelled' + drip_logs pending → 'skipped'
  - `Lead respondeu (parar tudo)` → mesma ação + nota no lead "Cliente respondeu em <data>"
  - `Reenviar agora` (em drip falhado) → reset status pra pending com scheduled_at=now()
  - `Ver logs completos` → link pra /admin/automations?tab=logs&lead=<id>

### 2. Badge discreto no Intake (cards de lead)
No `Intake.tsx` (cards do pipeline), adicionar pequeno ícone à direita do nome:
- 📨 verde = última automação enviada com sucesso (sent nas últimas 48h)
- ⚠ vermelho = última falhou (failed) — tooltip mostra erro
- ⏱ cinza = drip pendente agendado
- (nada) = sem automação ativa
Tooltip sempre mostra: "Última: <template> · há <X>h" ou "Próximo: em <X>h". Click no badge abre o LeadDetail direto na aba Automações.

### 3. Auto-pausa explícita (já existe parcialmente)
- Manter trigger `auto_enroll_lead_automation` que cancela ao mudar stage.
- **Adicionar**: marcar drip_logs pending como 'skipped' (não só cancelar enrollment) — hoje só o enrollment vira cancelled mas os logs ficam pending órfãos. Vamos atualizar a função pra também pular os logs.
- Quando lead vira `lost` ou `completed`: cancelar tudo (já acontece).

### 4. Hook reutilizável
Novo `useLeadAutomations(leadId)`:
- Retorna: `enrollments` (com sequência), `dripLogs` (com info do drip), `nextDrip`, `lastSent`, `failedCount`, mutations `pauseAll`, `markResponded`, `retryDrip`.
- Realtime subscription em `automation_drip_logs` filtrado por enrollments do lead pra atualizar UI ao vivo quando o cron processar.

## Detalhes técnicos

- **Migração**: atualizar função `auto_enroll_lead_automation` pra também `UPDATE automation_drip_logs SET status='skipped' WHERE enrollment_id IN (cancelados) AND status='pending'`.
- **RLS**: já coberta (`get_user_org_id()` em ambas tabelas).
- **Performance no Intake**: 1 query agregada via RPC `get_leads_automation_status(lead_ids[])` retornando `{lead_id, last_status, last_sent_at, next_scheduled_at, failed_count}` pra evitar N+1.
- **Aba no LeadDetail**: usar Tabs do shadcn (Detalhes | Notas | Automações).
- **Sem mudança em edge functions** — `automation-engine` continua processando os pending normalmente; quando viram skipped/cancelled ele ignora.

## Fora do escopo agora
- Detecção automática de resposta por email/SMS inbound (precisaria webhook do Twilio/Gmail) — fica como fase 2. Por enquanto o "Lead respondeu" é manual.
- Edição de drips da sequência inline no painel do lead (já existe na página /admin/automations).