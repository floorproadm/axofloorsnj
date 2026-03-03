

## Separar Formularios: Servicos vs Materiais

### Problema Atual
O formulario de criacao/edicao e identico para servicos e materiais. As categorias sao compartilhadas, e o conceito de subcategoria "Add-on" aparece para ambos, o que nao faz sentido para materiais.

### Mudancas Propostas

**1. Categorias separadas por tipo**
- **Servicos**: Installation, Refinishing, Stairs, Repair, Flooring Sales (mantendo o sistema atual com subcategoria Add-on)
- **Materiais**: Hardwood, Vinyl, Laminate, Stain & Finish, Adhesives & Underlayment, Trim & Molding, Sundries (novas categorias predefinidas para materiais, com opcao de criar custom)

**2. Formulario contextual**
- **Servicos**: Mantém campos atuais (Categoria + Subcategoria Core/Add-on + Preco + Unidade)
- **Materiais**: Remove o campo Subcategoria (Add-on nao se aplica). Adiciona campos opcionais preparando para futuro: `supplier_name` (text, nullable) e `sku` (text, nullable) -- apenas no formulario visual por enquanto, sem mudar o banco ainda

**3. Titulo do dialog contextual**
- "Novo Servico" / "New Service" quando na tab Services
- "Novo Material" / "New Material" quando na tab Materials

**4. Filtro de categorias separado**
- Os badges de categoria na barra de filtro ja filtram por `activeTab`, entao cada tab mostra apenas suas proprias categorias. O badge "Add-ons" so aparece na tab Services.

### Detalhes Tecnicos

**Arquivo**: `src/pages/admin/Catalog.tsx`

- Criar constante `PREDEFINED_MATERIAL_CATEGORIES` com as categorias de materiais
- No `allCategoryOptions` useMemo, filtrar por `activeTab` para retornar categorias relevantes
- No dialog, condicionar a exibicao do campo Subcategoria (Core/Add-on) apenas quando `activeTab === "service"`
- Atualizar titulo do dialog para refletir o tipo
- Atualizar placeholder do campo Nome baseado no tipo
- Nenhuma mudanca no banco de dados neste momento (campos `supplier_name` e `sku` serao adicionados em fase futura quando o portal do supply for implementado)

### Preparacao para Futuro (Portal Supply)
Esta separacao e o primeiro passo. Na fase seguinte:
- Tabela `suppliers` com dados do fornecedor
- Coluna `supplier_id` FK em `service_catalog` para materiais
- Coluna `sku` em `service_catalog`
- Portal read-only para suppliers verem pedidos/estoque

