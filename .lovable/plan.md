
# Corrigir categorias do Select no Catalogo

## Problema
O Select de Category foi preenchido com categorias genericas (Hardwood, Vinyl, Tile, etc.) que nao correspondem as categorias reais dos itens do catalogo. As categorias corretas sao as que agrupam os servicos/materiais: Installation, Refinishing, Stairs, Repair, Add-ons, Flooring Sales.

## Solucao
Substituir as opcoes do Select de Category no dialog de criacao/edicao em `src/pages/admin/Catalog.tsx`.

### Categorias corretas (extraidas do banco)
- Installation
- Refinishing
- Stairs
- Repair
- Add-ons
- Flooring Sales

### Arquivo modificado
**`src/pages/admin/Catalog.tsx`** -- linhas ~440-449: trocar os `SelectItem` pelas categorias corretas.

### Detalhes tecnicos
Substituir o bloco de SelectItems:
```text
<SelectItem value="Installation">Installation</SelectItem>
<SelectItem value="Refinishing">Refinishing</SelectItem>
<SelectItem value="Stairs">Stairs</SelectItem>
<SelectItem value="Repair">Repair</SelectItem>
<SelectItem value="Add-ons">Add-ons</SelectItem>
<SelectItem value="Flooring Sales">Flooring Sales</SelectItem>
```

Mudanca pontual, sem impacto em outros arquivos.
