## Plano: Transformar Preços B2B em catálogo de serviços (sem preço)

### Decisões
- **Tabela `b2b_price_list`**: vira catálogo simples — só nome, unidade, ativo/inativo, ordem. Colunas de preço somem.
- **`B2BQuoteSheet`**: continua existindo. Ao selecionar um serviço, **não** preenche mais o `unit_price` (que era o wholesale); usuário digita o preço caso a caso, como já é possível hoje.

### Mudanças

**1. Migration DB**
- `ALTER TABLE b2b_price_list DROP COLUMN wholesale_price, DROP COLUMN retail_price;`

**2. `B2BPricingSettings.tsx` → `B2BServiceCatalogSettings.tsx`**
- Renomear arquivo e título da aba para **"Catálogo de Serviços B2B"**.
- Remover colunas Wholesale ($) e Retail ($) da tabela.
- Layout fica: Serviço | Unidade | Ativo | Remover.
- Subtítulo: "Lista de serviços disponíveis ao montar cotações B2B. O preço é definido caso a caso na cotação."

**3. `Settings.tsx`**
- Atualizar import e label da seção de "Preços B2B" para "Catálogo B2B".

**4. `B2BQuoteSheet.tsx`**
- Remover `wholesale_price` da query e do tipo `Price`.
- `pickService()` deixa de setar `unit_price` (mantém só `service_name` e `unit`); usuário digita o preço.
- Placeholder do campo `$ / Unit` continua igual; nada mais muda no fluxo de envio.

**5. `types.ts`** atualiza automaticamente após migration.

### Impacto
- Nenhum dado crítico perdido (wholesale_price não estava sendo usado em proposals/invoices reais).
- `B2BQuoteSheet` continua funcional, só sem auto-preenchimento de preço.
- Settings fica com nome mais honesto (é catálogo, não tabela de preços).

Posso seguir?
