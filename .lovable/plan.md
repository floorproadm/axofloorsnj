
Objetivo
Eliminar o desalinhamento no mobile em /admin/partners (aba “Projetos”), fazendo o botão “Novo Job” ficar com o mesmo alinhamento visual da aba “Indicações”.

Diagnóstico (erro encontrado)
O problema não está no botão em si (rounded, tamanho, etc.).  
A aba “Projetos” renderiza conteúdo adicional (`PartnerProjectsTab`) que pressiona a largura horizontal no mobile:
- cards de projeto com bloco de status à direita sem limite de largura efetivo;
- tabela financeira dentro da mesma árvore de layout, que pode forçar largura extra dependendo do conteúdo;
- com isso, o conteúdo da aba passa a ocupar mais largura que o viewport interno e o CTA no topo aparenta “cortado”/deslocado à direita.
Na aba “Indicações” isso não ocorre porque o conteúdo é mais simples e não gera essa pressão horizontal.

Arquivos alvo
- `src/components/admin/PartnerDetailPanel.tsx` (principal e suficiente para correção)

Plano de implementação
1) Conter largura horizontal da aba “Projetos”
- Em `TabsContent value="projetos"`, aplicar classes de contenção:
  - `w-full min-w-0 overflow-x-hidden`
- No wrapper interno da aba (div que contém botão + conteúdo), reforçar:
  - `w-full min-w-0`

2) Blindar o bloco de cards de projeto contra overflow
- Em `renderProjectCard`:
  - garantir `w-full min-w-0` no card;
  - manter texto esquerdo com truncamento consistente (`min-w-0`, `truncate` nas linhas críticas);
  - limitar bloco direito (badge + valor + ícone) com `max-w-*` no mobile e `truncate` no badge para status longos.
Resultado esperado: o lado direito nunca “empurra” a largura total do card.

3) Tornar a seção “Histórico Financeiro” verdadeiramente responsiva no mobile
- Encapsular tabela com contenção horizontal local (não global da aba):
  - wrapper com `w-full max-w-full overflow-x-auto`
- Ajustar tabela para não expandir além do container:
  - usar `table-fixed` quando necessário;
  - aplicar `break-words`/`truncate` na coluna de projeto.
Isso mantém o overflow, se existir, apenas dentro da área da tabela e não na aba inteira.

4) Ajuste de consistência visual do CTA
- Manter o botão “Novo Job” com padrão idêntico ao CTA de “Indicações”:
  - `w-full gap-2` e sem compensações artificiais de margem.
A correção estrutural acima deve resolver o alinhamento sem “gambiarras”.

5) Verificação final em viewport mobile
- Testar alternando entre:
  - Geral → Indicações → Projetos → Notas;
- Confirmar:
  - botão em Projetos com mesmos insets laterais de Indicações;
  - nenhum corte na borda direita;
  - tabela não estoura o container;
  - sem regressão em tablet/desktop.

Critério de aceite
- No mobile, ao entrar na aba “Projetos”, o botão “Novo Job” fica 100% alinhado com o grid visual da página (mesma referência lateral do botão “Nova Indicação”).
- Nenhum elemento da aba “Projetos” deve causar expansão horizontal do painel.

Seção técnica (resumo)
- Causa raiz: overflow horizontal estrutural na aba Projetos.
- Correção: contenção de largura + truncamento inteligente + isolamento de overflow na tabela.
- Escopo: apenas `PartnerDetailPanel.tsx`, sem mudanças de backend e sem alterar componentes globais reutilizados por outras páginas.
