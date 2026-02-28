

## Seed do Catalogo com Servicos Reais da AXO

### Objetivo
Inserir via migracao SQL os servicos extraidos do Price Guide do Notion diretamente na tabela `service_catalog`, populando o catalogo com dados reais para uso imediato no sistema.

### Servicos a Inserir (14 itens)

Extraidos do Price Guide, **sem packages** -- apenas servicos individuais:

**Categoria: Refinishing** (price_unit: sqft)
1. Floor Refinishing -- $3.50/sqft (base do Silver)
2. Dustless Sanding Upgrade -- $0.75/sqft

**Categoria: Installation** (price_unit: sqft)
3. Nail Down (Solid Hardwood) -- $6.00/sqft
4. Glue Down (Engineered) -- $7.00/sqft
5. Floating / Click System -- $4.50/sqft

**Categoria: Stairs** (price_unit: step)
6. Stair Tread Refinishing -- $60.00/step
7. Full Stair Replacement -- $150.00/step

**Categoria: Stairs** (price_unit: linear_ft)
8. Railing Sand & Refinish -- $25.00/linear_ft

**Categoria: Add-ons** (unidades variadas)
9. Furniture Moving -- $100.00/unit
10. Pet Damage Repair -- $200.00/unit
11. Board Replacement (Patch) -- $15.00/sqft
12. Stain Matching / Custom Color Lab -- $150.00/unit
13. Water Popping -- $0.50/sqft
14. Baseboard Installation -- $2.50/linear_ft

### Notas de Design
- Todos os `base_price` usam o **valor minimo** do range (ex: $3.50-$4.50 -> $3.50)
- `description` contem o que esta incluido ou notas relevantes do Price Guide
- `display_order` sequencial por categoria para manter organizacao
- Todos inseridos como `item_type = 'service'` e `is_active = true`
- Nenhum material sera inserido nesta seed (apenas servicos)

### Detalhes Tecnicos

**Arquivo a criar:**
- Migracao SQL com INSERT INTO `service_catalog` dos 14 servicos

**Nenhum arquivo de codigo precisa mudar** -- o catalogo ja tem a UI pronta para exibir esses dados.

