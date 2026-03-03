

# Correção: Tabs Condicionais no Partner Detail

## Problema
A lógica atual (`showFullTabs`) exige que o partner seja do tipo "builder" E status "active/inactive" E tenha projetos. Isso removeu as tabs Projetos e Indicações de parceiros ativos que já existiam.

## Nova Regra
Mostrar todas as 4 tabs (Geral, Projetos, Indicações, Notas) quando **qualquer uma** destas condições for verdadeira:
- Status é `trial_first_job`, `active`, ou `inactive`
- Partner tem projetos vinculados (independente do status)

Caso contrário (prospect, contacted, meeting_scheduled sem projetos): apenas Geral e Notas.

## Mudança

### `src/components/admin/PartnerDetailPanel.tsx`
Alterar a lógica de `showFullTabs` de:
```typescript
const showFullTabs =
  partner.partner_type === "builder" &&
  (partner.status === "active" || partner.status === "inactive") &&
  partnerProjects.length > 0;
```
Para:
```typescript
const showFullTabs =
  partner.status === "trial_first_job" ||
  partner.status === "active" ||
  partner.status === "inactive" ||
  partnerProjects.length > 0;
```

Isso garante que:
- Todos os partners ativos/inativos/em trial veem a page completa (qualquer tipo, não só builder)
- Partners em estágios iniciais (prospect, contacted, meeting_scheduled) que já tiverem projetos vinculados também veem tudo
- Partners em estágios iniciais sem projetos veem apenas Geral e Notas

## Arquivo modificado
- `src/components/admin/PartnerDetailPanel.tsx` (1 linha alterada)
