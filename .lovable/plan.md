## Fase 1 — Fundação Visual (CompanyCam-style)

Vou implementar 3 features integradas ao admin do Axo OS, reutilizando o design system atual (navy/gold, shadcn).

---

### 1. Banco de dados (migration única)

**Tabela `project_photos`** (multi-tenant via `organization_id`):
- `id`, `project_id` (FK projects), `organization_id`
- `photo_url` (storage path), `thumbnail_url` (opcional)
- `taken_at` (timestamp do upload)
- `latitude` numeric, `longitude` numeric, `location_label` text
- `uploaded_by` uuid, `created_at`

**Tabela `before_after_pairs`**:
- `id`, `project_id`, `organization_id`
- `before_photo_id` / `after_photo_id` (FK project_photos) — vínculo a fotos existentes
- `title` text, `completed_date` date
- `share_token` text unique (uuid) — gera link público `/share/before-after/:token`
- `created_at`

**Storage bucket** novo: `project-photos` (público, para que watermark + share funcione sem signed URL).

**RLS**: leitura/escrita restrita a membros da organização do projeto (`get_user_org_id()`). Leitura pública só via `share_token` em RPC dedicada (`get_shared_before_after(token)`).

**GRANTs**: `authenticated` full CRUD, `service_role` ALL, `anon` SELECT apenas via RPC.

---

### 2. Watermark (frontend, Canvas API)

Novo util `src/utils/watermark.ts`:
- `applyWatermark(file: File): Promise<File>` — carrega imagem no canvas, desenha o texto "AXO FLOORS" no canto inferior direito (fundo navy semi-transparente, texto gold bold, ~15% da largura, 10px de margem), exporta como JPEG 0.9.
- Aplicado automaticamente antes de qualquer upload (feature 1 e 2).

---

### 3. Hook compartilhado

`src/hooks/useProjectPhotos.ts`:
- `useProjectPhotos(projectId)` — lista fotos do projeto.
- `useUploadProjectPhoto()` — captura geolocalização via `navigator.geolocation.getCurrentPosition`, aplica watermark, faz upload ao bucket, insere em `project_photos`. Faz reverse-geocode opcional via Nominatim (free, sem chave) para `location_label`; se negar permissão grava "Localização não disponível".
- `useDeleteProjectPhoto()`.

`src/hooks/useBeforeAfter.ts`:
- `useBeforeAfterPairs(projectId)`, `useCreateBeforeAfterPair()`, `useDeleteBeforeAfterPair()`.

---

### 4. UI — Detalhe do Projeto

Novo componente `src/components/admin/projects/ProjectPhotosSection.tsx` adicionado à página `src/pages/admin/ProjectDetail.tsx` (nova aba/seção "Fotos do Job"):

- **Tabs internos**: `Todas as Fotos` | `Before & After`
- **Aba Todas**:
  - Botão "Adicionar Foto" (input file).
  - Grid 2/3/4 colunas, cada card mostra thumbnail + overlay com data/hora (`format dd/MM HH:mm`) e label de localização (ou coordenadas truncadas).
  - Clique → lightbox com EXIF resumido.
- **Aba Before & After**:
  - Lista de pares já criados, cada um renderiza um **slider de comparação** (componente `BeforeAfterSlider` — divisor draggable, sem libs externas, apenas mouse/touch handlers + clip-path).
  - Botão "Novo par" → dialog para escolher 2 fotos do projeto (ou upload direto) + título + data + criar.
  - Botão "Compartilhar" copia URL pública `/share/before-after/:token`.

---

### 5. UI — Gallery Hub

Refatorar `src/pages/admin/GalleryHub.tsx`:
- Manter painel público existente como aba "Public Gallery".
- Adicionar nova aba primária **"Fotos dos Projetos"** que lista TODAS as `project_photos` da org em grid, com:
  - Filtro por projeto (Select)
  - Filtro por tipo: Todas / Apenas Before / Apenas After / Avulsas
  - Ordenação por data (asc/desc)
- A bottom nav já aponta para `/admin/gallery` — sem mudança.

---

### 6. Rota pública de compartilhamento

Nova rota `src/pages/ShareBeforeAfter.tsx` em `/share/before-after/:token`:
- Chama RPC `get_shared_before_after(token)` (SECURITY DEFINER, retorna apenas URLs + título + data).
- Renderiza o mesmo `BeforeAfterSlider` em layout limpo branded Axo (logo, CTA "Solicite seu orçamento").

---

### Arquivos novos
- `supabase/migrations/...` (tabelas + RPC + bucket + policies + GRANTs)
- `src/utils/watermark.ts`
- `src/hooks/useProjectPhotos.ts`
- `src/hooks/useBeforeAfter.ts`
- `src/components/admin/projects/ProjectPhotosSection.tsx`
- `src/components/admin/projects/BeforeAfterSlider.tsx`
- `src/components/admin/projects/NewBeforeAfterDialog.tsx`
- `src/components/admin/gallery/ProjectPhotosPanel.tsx`
- `src/pages/ShareBeforeAfter.tsx`

### Arquivos editados
- `src/pages/admin/ProjectDetail.tsx` (montar nova seção)
- `src/pages/admin/GalleryHub.tsx` (adicionar tabs)
- `src/App.tsx` (rota pública)

### Notas técnicas
- Geolocalização: `navigator.geolocation` requer HTTPS (✓ no Lovable). Permissão negada → grava NULL coords.
- Reverse geocode: `https://nominatim.openstreetmap.org/reverse?lat=..&lon=..&format=json` (sem chave, rate-limit leve, ok para uso interno; cai no fallback de coords se falhar).
- Slider before/after: implementação caseira (~80 linhas) com `clip-path: inset()` + listener de pointer.
- Watermark: dimensiona o canvas para o tamanho original da imagem (limite max 2400px para evitar mobile OOM).

Pronto para implementar? Confirmando, começo pela migration e depois código em paralelo.