

## Catalogo de Servicos e Materiais -- V1 Completa

### Visao Geral
Construir a pagina de Catalogo (`/admin/catalog`) com duas abas (Servicos / Materiais), tabela no banco de dados, CRUD completo, busca, filtros por tipo, e integracao futura com Medicoes. A interface segue o estilo dos mockups enviados -- lista com cards, busca, filtros por categoria em chips.

---

### 1. Banco de Dados -- Criar tabela `service_catalog`

Uma unica tabela para ambos os tipos (servico e material):

```text
service_catalog
  id            uuid PK
  item_type     text NOT NULL  -- 'service' | 'material'
  name          text NOT NULL
  description   text
  category      text           -- Ex: Hardwood, Tile, Installation, Refinish
  default_material  text       -- (para servicos) material padrao
  default_finish    text       -- (para servicos) acabamento padrao
  base_price    numeric DEFAULT 0
  price_unit    text DEFAULT 'sqft'  -- sqft, unit, step, linear_ft
  is_active     boolean DEFAULT true
  display_order integer DEFAULT 0
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()
```

RLS: admin (authenticated) pode tudo. Politica simples: authenticated users can SELECT, INSERT, UPDATE, DELETE.

---

### 2. Hook -- `src/hooks/useServiceCatalog.ts`

- `useServiceCatalog(itemType?: 'service' | 'material')` -- lista itens ativos filtrados por tipo
- `useCreateCatalogItem()` -- mutacao para criar
- `useUpdateCatalogItem()` -- mutacao para atualizar
- `useDeleteCatalogItem()` -- mutacao para deletar
- Invalida queries ao mutar

---

### 3. Pagina Catalogo -- `src/pages/admin/Catalog.tsx`

Layout inspirado nos mockups enviados:

**Header:**
- Titulo "Catalogo"
- Botao "Adicionar Item" (abre dialog)

**Tabs de divisao (barra visual):**
- Duas abas: **Servicos** | **Materiais**
- Separador visual claro entre as duas categorias
- Cada aba carrega seus itens filtrados por `item_type`

**Barra de Busca + Filtros:**
- Input de busca por nome
- Chips de categoria (ex: Hardwood, Tile, Installation, Refinish, Staircase) -- filtrados dinamicamente pelas categorias existentes nos itens
- Cada chip mostra a contagem de itens

**Lista de Itens:**
- Cards com: nome, descricao curta, badges de categoria, preco base com unidade
- Botao "Edit" e menu de acoes (ativar/desativar, deletar)
- Estado vazio quando nao ha itens

**Dialog Criar/Editar:**
- Campos: nome, descricao, tipo (servico/material), categoria, preco base, unidade de preco, material padrao, acabamento padrao
- Campos condicionais: material padrao e acabamento padrao so aparecem para tipo "servico"

---

### 4. Integracao com Medicoes (preparacao)

Nesta V1, o campo "Tipo de Servico" em Medicoes permanece como input de texto. A integracao com Select alimentado pelo catalogo sera feita em uma etapa posterior, quando o catalogo ja tiver dados populados.

---

### Arquivos a criar
- `src/hooks/useServiceCatalog.ts`

### Arquivos a modificar
- `src/pages/admin/Catalog.tsx` (reescrever completamente -- substituir placeholder)

### Migracao SQL
- Criar tabela `service_catalog` com RLS policies

