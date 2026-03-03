

# Sincronizacao do Catalogo de Servicos

## Objetivo
Atualizar o `service_catalog` com os itens identificados nos dois documentos (CSV do Square e lista do Notion) que ainda nao existem no sistema.

## Itens a Adicionar (Servicos)

### Categoria: Installation (novos)
1. **Laminate Flooring Installation** - $7.00/sqft (preco do CSV)
2. **Vinyl Flooring Installation** - $0.00/sqft (sem preco definido no CSV)
3. **Tile Installation** - $0.00/sqft (presente no Notion)
4. **Subfloor Installation** - $0.00/sqft (presente no Notion)
5. **Custom Flooring** - $0.00/sqft (presente no CSV)

### Categoria: Refinishing (novos)
6. **Floor Leveling** - $0.00/sqft (prep work, do CSV)

### Categoria: Stairs (novos)
7. **Handrail Installation** - $0.00/linear_ft (CSV + Notion: "Stair Railings Installation")
8. **Baluster/Spindle Replacement** - $0.00/unit (CSV: "Spindles Replacement", Notion: "Balusters Installation")

### Categoria: Repair (nova categoria)
9. **General Floor Repair** - $0.00/sqft (CSV: "Floor Repair" -- Board Replacement e Pet Damage ja cobrem parcialmente, mas este e o item generico)

### Tipo: Material (Sales -- novos)
10. **Wood Flooring** - $0.00/sqft
11. **Vinyl Flooring** - $0.00/sqft
12. **Laminate Flooring** - $0.00/sqft
13. **Luxury Vinyl Tile (LVT)** - $0.00/sqft

## Implementacao Tecnica

### Passo 1: Migration SQL
Inserir os 13 novos itens na tabela `service_catalog` usando um unico INSERT com valores derivados dos documentos. Precos zerados serao preenchidos pelo admin depois -- o importante e ter os itens catalogados.

### Passo 2: Nenhuma mudanca de schema
A tabela `service_catalog` ja suporta todos os campos necessarios (`item_type`, `category`, `base_price`, `price_unit`, etc). Nenhuma alteracao de estrutura.

### Passo 3: Nenhuma mudanca de UI
A pagina `/admin/catalog` ja renderiza dinamicamente por categorias. Os novos itens aparecerao automaticamente nos chips de filtro.

## Resultado Final
- Catalogo passa de **14 para 27 itens**
- **5 categorias de servico**: Refinishing, Installation, Stairs, Add-ons, Repair
- **1 categoria de material**: Flooring Sales (Wood, Vinyl, Laminate, LVT)
- Alinhamento completo com Square export e Notion

