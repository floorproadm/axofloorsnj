

# Partner Pipeline com Mecanismo de Avanço + B2B Auto-Routing

## Resumo
Duas funcionalidades interligadas:
1. **Partner Board com avanço de status** (similar ao Lead Pipeline) -- cards clicaveis que abrem um modal de controle para avançar parceiros pelos estágios prospect -> contacted -> meeting_scheduled -> trial_first_job
2. **Leads B2B auto-routing** -- leads vindos de `builders_page` e `realtors_page` criam automaticamente um Partner como PROSPECT ao invés de ir para /admin/leads como cold_lead

---

## Parte 1: Partner Control Modal (Board com avanço)

### Conceito
Ao clicar num card do Partner Board, ao invés de ir direto para o PartnerDetailPanel, abre um modal compacto (estilo LeadControlModal) que mostra:
- Nome, empresa, tipo, status atual
- NRA do parceiro (Next Required Action): ex. "Fazer primeiro contato", "Agendar reunião", "Enviar proposta de parceria"
- Botao de avanço para o proximo estagio
- Info de contato (telefone, email)
- Botao "Ver Detalhes" que leva ao PartnerDetailPanel completo

### Estágios e NRA do Partner
```text
prospect       -> "Fazer primeiro contato"     -> contacted
contacted      -> "Agendar reunião"            -> meeting_scheduled
meeting_scheduled -> "Registrar trial/1o job"  -> trial_first_job
trial_first_job -> (avança manualmente para active via PartnerDetailPanel)
```

### Arquivos novos
- `src/components/admin/PartnerControlModal.tsx` -- modal de controle compacto
- `src/hooks/usePartnerPipeline.ts` -- hook com logica de transicoes validas e funcao de avanço

### Arquivos modificados
- `src/pages/admin/Partners.tsx` -- ao clicar no board, abre PartnerControlModal ao inves de ir direto pro detail
- `src/hooks/admin/usePartnersData.ts` -- adicionar campo `lead_source_tag` ao interface (novo campo DB)

### Detalhes tecnicos
- O hook `usePartnerPipeline` define transicoes validas: prospect->contacted->meeting_scheduled->trial_first_job
- O avanço é feito via `updatePartner` + `last_contacted_at` atualizado automaticamente
- O modal exibe o NRA baseado no status atual (logica local, sem RPC)
- Botao "Ver Detalhes" fecha o modal e abre o PartnerDetailPanel existente

---

## Parte 2: B2B Lead Auto-Routing para Partners

### Conceito
Leads vindos de `builders_page` e `realtors_page` nao devem ir para a tabela `leads` como `cold_lead`. Em vez disso, criam automaticamente um registro na tabela `partners` com:
- Status: `prospect`
- Tipo: `builder` (se builders_page) ou `realtor` (se realtors_page)
- Tag de origem visivel (novo campo `lead_source_tag`)

### Migração SQL
```sql
ALTER TABLE public.partners 
  ADD COLUMN lead_source_tag text DEFAULT NULL;
```
Esse campo armazena a origem (ex: `builders_page`, `realtors_page`) para KPI e para a tag visual.

### Arquivos modificados
- `src/pages/Builders.tsx` -- ao invés de inserir em `leads`, insere em `partners` com status `prospect`, tipo `builder`, e `lead_source_tag: 'builders_page'`
- `src/pages/Realtors.tsx` -- mesmo, com tipo `realtor` e `lead_source_tag: 'realtors_page'`
- `src/components/admin/PartnerPipelineBoard.tsx` -- exibir tag de origem no card quando `lead_source_tag` existir
- `src/hooks/admin/usePartnersData.ts` -- adicionar `lead_source_tag` ao interface Partner

### Notificação
- Ao criar o partner via B2B page, inserir uma notificacao na tabela `notifications` para o admin, com link para `/admin/partners`
- Buscar o user_id do admin via `user_roles` table

---

## Parte 3: Detalhes de implementacao

### PartnerControlModal (novo componente)
- Dialog com ScrollArea
- Header: avatar/iniciais + nome + empresa + badge de status
- NRA Card: acao necessaria destacada (verde/emerald, similar ao LeadControlModal)
- Info grid: telefone, email, tipo, criado em
- Se tiver `lead_source_tag`: badge com origem (ex: "via Builders Page")
- Footer: botao "Avançar" (primary) + "Ver Detalhes" (secondary) + "Deletar" (ghost)
- Ao avançar: atualiza status + last_contacted_at, invalida queries, fecha modal

### usePartnerPipeline (novo hook)
- Define `PARTNER_VALID_TRANSITIONS` e `PARTNER_NRA` por estagio
- Funcao `advancePartnerStatus(partnerId, currentStatus)` que calcula proximo estagio e executa update
- Nao precisa de RPC no banco -- usa update direto ja que nao tem gates complexos como o lead pipeline

### Fluxo do Board
1. Usuario clica no card -> abre PartnerControlModal
2. Modal mostra NRA e botao de avanço
3. Ao avançar, partner move para proximo estagio
4. Modal fecha e board atualiza
5. Se quiser ver detalhes completos: botao "Ver Detalhes" abre PartnerDetailPanel

### Fluxo B2B
1. Builder/Realtor preenche formulario na landing page
2. Frontend insere em `partners` (nao em `leads`) com status=prospect
3. Frontend insere notificacao para admin
4. Admin ve notificacao e vai para /admin/partners
5. No board, ve o novo prospect com tag de origem

