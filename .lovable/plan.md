

## Automations -- Fluxos Automaticos por Pipeline

### Visao Geral

Criar a pagina `/admin/automations` dentro do grupo MANAGE da sidebar, inspirada nas referências visuais compartilhadas (DripJobs-style). A pagina centraliza os fluxos automaticos de comunicacao organizados por pipeline (Sales e Jobs), onde cada estagio tem sequencias de mensagens (drips) configuráveis.

### Estrutura da Pagina

```text
Automations
+------------------------------------------+
| [Sales Pipeline]  [Jobs Pipeline]        |
+------------------------------------------+
| + Add Custom Stage (dashed button)       |
+------------------------------------------+
| Cold Leads                             > |
| 1 Sequence(s) - 8 Drip(s)               |
+------------------------------------------+
| Warm Leads                             > |
| 2 Sequence(s) - 7 Drip(s)               |
+------------------------------------------+
| Estimate Requested                     > |
| 1 Sequence(s) - 1 Drip(s)               |
+------------------------------------------+
| ...                                      |
+------------------------------------------+
```

Ao clicar em um estagio, abre um painel/pagina de detalhe com as sequencias e seus drips (mensagens individuais com delay, canal, template).

### Modelo de Dados

**Tabela `automation_sequences`**

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| pipeline_type | text | 'sales' ou 'jobs' |
| stage_key | text | Ex: 'cold_lead', 'in_production' |
| name | text | Nome da sequencia |
| is_active | boolean | default true |
| display_order | integer | Ordenacao dentro do estagio |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Tabela `automation_drips`**

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| sequence_id | uuid | FK -> automation_sequences.id |
| delay_days | integer | Dias apos entrada no estagio (ou drip anterior) |
| delay_hours | integer | Horas adicionais de delay |
| channel | text | 'sms', 'email', 'whatsapp' |
| subject | text | Assunto (para email) |
| message_template | text | Corpo da mensagem com variaveis {{name}}, {{service}}, etc |
| is_active | boolean | default true |
| display_order | integer | Ordem dentro da sequencia |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: admin full access em ambas as tabelas.

### Estagios por Pipeline

**Sales Pipeline** (mapeados do `useLeadPipeline`):
- Cold Leads (`cold_lead`)
- Warm Leads (`warm_lead`)
- Estimate Requested (`estimate_requested`)
- Estimate Scheduled (`estimate_scheduled`)
- In Draft (`in_draft`)
- Proposal Sent (`proposal_sent`)
- Proposal Rejected (`proposal_rejected`)

**Jobs Pipeline** (mapeados dos project statuses):
- Pre-Production (`pending`)
- In Progress (`in_progress`)
- Completed (`completed`)

### Arquivos a Criar

1. **SQL Migration** -- Tabelas `automation_sequences` + `automation_drips` + RLS + triggers
2. **`src/pages/admin/Automations.tsx`** -- Pagina principal com tabs Sales/Jobs, lista de estagios com contadores de sequences/drips
3. **`src/components/admin/automations/StageFlowList.tsx`** -- Lista de estagios com contadores, click para expandir
4. **`src/components/admin/automations/SequenceDetail.tsx`** -- Painel de detalhe de uma sequencia com lista de drips editaveis
5. **`src/components/admin/automations/DripEditor.tsx`** -- Editor inline de um drip (delay, canal, template de mensagem)
6. **`src/hooks/useAutomationFlows.ts`** -- Hook com CRUD para sequences e drips

### Arquivos a Modificar

7. **`src/App.tsx`** -- Adicionar rota `/admin/automations`
8. **`src/components/admin/AdminSidebar.tsx`** -- Adicionar "Automations" no grupo MANAGE com icone `Zap`
9. **`src/contexts/LanguageContext.tsx`** -- Traducoes para labels da pagina

### Fluxo de Navegacao

1. Sidebar MANAGE > Automations -> Lista de estagios (tab Sales por default)
2. Click em estagio -> Expande/abre as sequencias daquele estagio
3. Click em sequencia -> Mostra os drips com editor inline
4. "+ Add Drip" -> Formulario inline para nova mensagem
5. Cada drip mostra: delay, canal (badge), preview da mensagem, toggle ativo/inativo

### Proximos Passos (apos mensagens do MindMeister)

- Popular as sequences e drips com o conteudo real das mensagens
- Definir os delays corretos entre cada drip
- Mapear quais canais (SMS/Email/WhatsApp) para cada estagio
- Eventualmente conectar com edge functions de envio (send-follow-up, send-notifications)

### Nota

A pagina comeca como um **configurador visual** -- os fluxos ficam salvos no banco e prontos para serem consumidos pelo SLA Engine ou edge functions quando a integracao de envio for implementada. Por enquanto, serve como fonte de verdade para as mensagens e regras de timing.

