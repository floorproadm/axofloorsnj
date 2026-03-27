

## Plano: Adicionar Toggle PT/EN no AXO Master System

### Abordagem
Adicionar um seletor de idioma na top bar do AXO Master System. Todo o conteúdo (tabs, nodes, painéis de detalhe, UI labels) terá versão PT e EN. O idioma atual fica salvo em localStorage e sincronizado com o `LanguageContext` já existente.

### Estrutura de dados

Atualmente `axoMasterSystem.ts` tem strings fixas em português. A solução:

1. **Criar um arquivo `src/data/axoMasterSystemEN.ts`** com traduções EN de:
   - `NODE_DATA` — eyebrow, title, intro, section titles, items (t/s), axo box
   - `TABS` — label, paneLabel, paneTitle, paneSub, e cada node (tag, title, subtitle)

2. **Criar helper `getLocalizedData(lang)`** que retorna os dados corretos (PT original ou EN traduzido)

3. **No `AxoMasterSystem.tsx`**:
   - Importar `useLanguage` do contexto existente
   - Adicionar toggle PT/EN na top bar (ao lado do botão Editar)
   - Usar `language` para selecionar dados PT ou EN
   - Traduzir labels de UI fixos (botões "Editar/Edit", "Editando/Editing", "Novo Node/New Node", "Criar Node/Create Node", labels do painel etc.)

### O que será traduzido

| Elemento | Exemplo PT → EN |
|----------|----------------|
| Tab labels | "01 · Influência Local" → "01 · Local Influence" |
| Pane titles | "Mapa de Influência Local" → "Local Influence Map" |
| Node tags | "Indicação" → "Referral" |
| Node titles | Mantidos quando já em inglês (ex: "Realtors") |
| Node subtitles | "Urgência alta · pré-listing" → "High urgency · pre-listing" |
| Panel content | Todas as seções, items, intros, AXO boxes |
| UI buttons | "Editar" → "Edit", "Criar Node" → "Create Node" |
| Panel labels | "Notas" → "Notes", "Salvar" → "Save" etc. |

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/data/axoMasterSystemEN.ts` | **Criar** — traduções EN completas (~500 linhas) |
| `src/data/axoMasterSystem.ts` | **Modificar** — exportar helper de localização |
| `src/pages/AxoMasterSystem.tsx` | **Modificar** — integrar toggle + usar dados localizados |

### Toggle na UI
Botão discreto na top bar, estilo consistente com o design atual:
- Mostra `🇧🇷 PT` ou `🇺🇸 EN`
- Click alterna entre os dois
- Salva preferência via `LanguageContext` (já persiste em localStorage)

