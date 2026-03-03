

# Fotos no Catalogo de Servicos e Materiais

## O que muda
Cada item do catalogo (servico ou material) podera ter uma foto ilustrativa. A imagem aparece no card do item e pode ser adicionada/alterada no dialog de criacao/edicao.

## Implementacao

### 1. Schema: adicionar coluna `image_url`
Uma migration para adicionar `image_url text` a tabela `service_catalog`. Campo opcional, nullable.

```text
ALTER TABLE service_catalog ADD COLUMN image_url text;
```

### 2. Upload de imagem
Reutilizar o bucket `media` (ja existente, privado) com path `catalog/{item_id}/{filename}`. O upload sera feito direto pelo Supabase Storage SDK no frontend, sem edge function.

Criar politica de storage para admins fazerem upload no path `catalog/`:
```text
INSERT policy: has_role(auth.uid(), 'admin') AND bucket_id = 'media' AND path LIKE 'catalog/%'
```

### 3. Hook `useServiceCatalog`
- Adicionar `image_url` ao tipo `CatalogItem`
- O upload sera um passo separado: primeiro faz upload no storage, pega a URL publica/signed, depois salva no campo `image_url` via update

### 4. UI do Dialog (Catalog.tsx)
- Adicionar area de upload de foto acima do campo "Nome"
- Preview da imagem existente com botao de remover
- Aceitar formatos: JPG, PNG, WebP (com conversao HEIC via utilitario existente)
- Limite: 5MB por imagem

### 5. UI do Card (ItemGrid)
- Exibir thumbnail da imagem no topo do card (aspect-ratio 16:9, object-cover)
- Fallback com icone quando nao ha foto
- Gerar signed URL para exibicao (bucket `media` e privado)

### Detalhes tecnicos
- Signed URLs serao geradas em batch ao carregar a lista, com cache local via `useState`
- Upload usa `supabase.storage.from('media').upload(path, file)`
- Conversao HEIC reutiliza `convertHeicToJpeg` de `src/utils/heicConverter.ts`
- O campo `image_url` armazena o storage_path (ex: `catalog/uuid/foto.jpg`), nao a URL completa
- Nenhuma mudanca em RLS da tabela `service_catalog` (ja tem admin_all)

### Arquivos modificados
1. **Nova migration SQL** -- adiciona coluna `image_url`
2. **`src/hooks/useServiceCatalog.ts`** -- atualiza tipos e inclui helper de upload
3. **`src/pages/admin/Catalog.tsx`** -- upload no dialog + thumbnail no card

