
Objetivo: parar de “maquiar” a tela e transformar o Job Detail numa página realmente útil, com foco primeiro em funcionalidade real e só depois em visual.

1. Diagnóstico do problema atual
- Hoje a tela está tentando parecer “premium”, mas a experiência principal continua fraca:
  - muita UI custom sem hierarquia operacional clara;
  - ações importantes espalhadas entre cards e collapses;
  - vários blocos fazem CRUD direto, mas sem sensação de fluxo robusto;
  - parte do estado visual parece elegante, mas não comunica o que está salvo, pendente ou quebrado.
- Encontrei também inconsistências técnicas que explicam a sensação de “não funciona de verdade”:
  - o produto/documentação fala em `in_production`, mas há lógica nova usando `in_progress` em SQL;
  - `job_costs` tem campos gerados no banco, porém a UI ainda tenta tratar custos como edição manual em alguns pontos;
  - materiais e labor atualizam `job_costs` via trigger, mas o layout atual não deixa isso óbvio;
  - invoices/payments no Job Detail são só um resumo com navegação para outra página, então a seção parece incompleta.

2. Direção de correção
Vou refazer a tela com uma filosofia mais “operational control panel” e menos “showcase UI”:
- menos cards decorativos;
- mais estrutura fixa e previsível;
- mais clareza de status, bloqueios e próximos passos;
- menos edição inline espalhada;
- mais ações com feedback explícito.

3. O que vou implementar
A. Reestruturar o topo da página
- Transformar o header em um bloco operacional real:
  - título do job;
  - cliente + contato;
  - status do projeto;
  - next action;
  - saúde financeira;
  - ações rápidas relevantes.
- Remover ruído visual e deixar o topo responder: “o que é esse job, em que estado está, o que falta fazer?”

B. Substituir edição inline excessiva por blocos mais confiáveis
- Reduzir o uso de `EditableField` em massa.
- Usar padrão híbrido:
  - leitura clara por padrão;
  - botões “Edit” por seção;
  - campos agrupados e salvos com confirmação visível.
- Isso melhora percepção de controle e reduz sensação de UI improvisada.

C. Reorganizar a página por fluxo de operação
Ordem planejada:
1. Header operacional
2. Client
3. Job info
4. Notes / Comments
5. Materials
6. Labor
7. Financials / Invoices & Payments
8. Photos / Proof
- Cada seção terá um papel claro: dados, execução, financeiro, evidência.

D. Fazer as seções “trabalharem de verdade”
- Materials:
  - lista mais clara;
  - formulário persistente e melhor validado;
  - total visível e sincronizado com custos.
- Labor:
  - mesmo padrão de materials;
  - custo total e composição mais legíveis.
- Notes / Comments:
  - separar melhor “nota estrutural do job” de “timeline/comentários”.
- Invoices & Payments:
  - deixar explícito que é um resumo operacional;
  - exibir melhor saldo, últimos eventos e CTA útil.
- Photos:
  - destacar before/after e estado de completion gate.

4. Correções funcionais prioritárias
Antes de qualquer polish visual, vou alinhar a lógica:
- revisar e corrigir inconsistência `in_production` vs `in_progress`;
- garantir que “next action” e estados do projeto reflitam o status real do banco;
- revisar invalidation/refetch nas mutações para evitar sensação de “não salvou”;
- conferir se a tela usa corretamente os campos gerados de `job_costs` e não passa a impressão de edição manual indevida;
- melhorar feedbacks de sucesso/erro nas ações principais.

5. Resultado esperado
Depois dessa refatoração, a tela deve:
- parecer mais séria e menos “mock bonita”;
- mostrar mais valor acima da dobra;
- exigir menos scroll e menos interpretação;
- deixar claro o que está salvo, o que falta e o que bloqueia o job;
- recuperar confiança porque a UX vai refletir o backend real.

6. Arquivos que pretendo mexer
- `src/pages/admin/JobDetail.tsx`
- `src/components/admin/job-detail/JobFinancialHeader.tsx`
- `src/components/admin/job-detail/InvoicesPaymentsSection.tsx`
- possivelmente hooks ligados à tela:
  - `src/hooks/useJobCosts.ts`
  - `src/hooks/useMaterialCosts.ts`
  - `src/hooks/useLaborEntries.ts`
- e, se necessário, uma correção backend/migration para alinhar status e regras operacionais.

7. Detalhes técnicos
- Vou preservar os triggers existentes que sincronizam `material_costs` e `labor_entries` com `job_costs`.
- Não vou editar os arquivos gerados da integração.
- Se a inconsistência de status estiver realmente no backend, a correção certa é via migration, não gambiarra no frontend.
- A meta não é “mais design”; é reduzir divergência entre UI, fluxo operacional e dados reais.

8. Escopo recomendado
Eu sugiro fazer em 2 passos:
- Passo 1: funcionalidade + arquitetura da tela;
- Passo 2: refinamento visual fino.
Assim evitamos gastar mais créditos em maquiagem antes de estabilizar a experiência.

Se você aprovar, eu sigo com uma refatoração objetiva do Job Detail focada em confiança operacional, não em enfeite.
