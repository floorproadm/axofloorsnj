

User quer foco: **só JobProof**, sem mexer em StainGallery agora. Apenas adicionar **filtro/seleção de cor de stain** no momento do upload das fotos para deixar tudo organizado e categorizado para o futuro.

## Escopo enxuto

**O que faço:**

1. **Mini-form de metadados no upload do JobProof** (após escolher arquivo, antes de salvar):
   - **Stain Color**: dropdown com as 40 cores DuraSeal (lista compartilhada com `/stain-gallery` — White Oak + Red Oak + Custom)
   - **Wood Species**: White Oak / Red Oak / Maple / Other
   - **Phase**: Before / After (já existe)
   - Campos opcionais — não bloqueiam o upload

2. **Persistência em `media_files.metadata`** (jsonb já existe):
   ```json
   { "phase": "after", "stain_color": "Honey", "wood_species": "White Oak" }
   ```
   Mantém compatibilidade total com o sistema atual de dual-write.

3. **Visualização no card do JobProof**: badge pequeno mostrando a cor aplicada (ex: "Honey · White Oak") nas thumbnails After.

4. **Lista de cores centralizada**: criar `src/lib/stainColors.ts` com as 40 cores DuraSeal exportadas como constante (reutilizável depois pelo StainGallery futuro).

**O que NÃO faço:**
- Não mexo em `/stain-gallery` (fica para o futuro)
- Não crio "Real Jobs in this Color" agora
- Não toco em Gallery pública
- Não migro fotos antigas (apenas novos uploads ganham metadados)

## Arquivos afetados

- `src/lib/stainColors.ts` (novo) — lista de cores DuraSeal
- `src/hooks/useJobProof.ts` — `uploadImage` aceita parâmetro `metadata` extra
- `src/components/admin/JobProofUploader.tsx` — adicionar mini-form (Stain + Wood Species) após selecionar arquivo, antes de submeter; badge de cor nas thumbnails

## Fluxo do usuário

```text
1. Click "Registrar foto After"
2. Seleciona arquivo
3. Mini-form aparece: 
   - Stain Color [dropdown 40 opções]  ← opcional
   - Wood Species [White Oak/Red Oak/Maple/Other]  ← opcional
4. Click "Salvar"
5. Upload + metadata persistido
6. Thumbnail mostra badge "Honey · White Oak"
```

Tudo fica catalogado e quando você quiser ativar StainGallery dinâmico no futuro, é só fazer query em `media_files.metadata->>'stain_color'`.

