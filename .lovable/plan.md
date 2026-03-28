

## Plano: Converter LeadControlModal de Dialog para Sheet (Sidebar estilo Notion)

### O que muda
Trocar o `Dialog` centralizado por um `Sheet` lateral (side="right") que abre como uma página sidebar, igual ao padrão do Notion. Todas as informações do lead permanecem as mesmas, mas o layout será otimizado para sidebar.

### Alterações

**`src/components/admin/LeadControlModal.tsx`**
- Substituir `Dialog` + `DialogContent` por `Sheet` + `SheetContent` com `side="right"`
- Largura: `sm:max-w-lg` (480px) no desktop, full-width no mobile
- Manter `ScrollArea` para o conteúdo
- Header com `SheetHeader` + `SheetTitle`
- Footer de ações (Deletar, Mark Lost) fica fixo no bottom
- Toda a estrutura interna (NRA panel, contact info, follow-up, proposals) permanece igual

### Layout da Sidebar

```text
┌─────────────────────────┐
│  Nome do Lead        X  │  ← SheetHeader
│  [Badge Status] [+48h]  │
├─────────────────────────┤
│  🟢 NRA Panel           │
│  Fazer primeiro contato  │
├─────────────────────────┤
│  Proposal Actions       │
├─────────────────────────┤
│  Histórico de Contatos  │
├─────────────────────────┤
│  📞 Telefone  ✉ Email   │
│  📍 Cidade   $ Budget   │
├─────────────────────────┤
│  Serviços: [badges]     │
├─────────────────────────┤
│  Criado / Atualizado    │
├─────────────────────────┤
│  🗑 Deletar    Mark Lost │  ← Footer fixo
└─────────────────────────┘
```

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/components/admin/LeadControlModal.tsx` | `Dialog` → `Sheet`, ajustar layout para sidebar |

Nenhuma mudança em `LinearPipeline.tsx` — as props `isOpen`/`onClose` continuam iguais.

