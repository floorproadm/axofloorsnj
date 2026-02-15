

# Company Feed -- Hub Central de Midia e Atividades

## Visao Geral

Criar um sistema de **Company Feed** dentro do admin -- uma timeline social interna onde toda foto, video, update de status e comentario de projetos vive em um so lugar. O feed funciona como a ponte entre o trabalho no campo (colaboradores enviando fotos) e a presenca digital da empresa (social media/portal do cliente).

## O Que Muda (e o que NAO muda)

- Tudo que existe hoje (Jobs, Leads, Orcamentos, Gallery Manager, etc.) **permanece intacto**
- O Feed e uma **nova camada** por cima dos dados existentes de projetos
- A rota `/admin/gallery` passa a abrir o Company Feed (em vez do Gallery Manager atual que se torna acessivel por dentro do feed na aba Folders)

## Arquitetura do Sistema

### Fluxo de Conteudo

```text
Colaborador no campo
       |
       v
  Upload de fotos/videos (via app)
       |
       v
  Feed Post criado (status: "draft")
       |
       v
  SPU / Social Media revisa
       |
       v
  "Edit Feed Post" --> seleciona fotos, escreve descricao, tags
       |
       v
  Publica (visibility: "public")
       |
       v
  Aparece no Portal do Cliente / Galeria publica
```

## Novas Tabelas no Banco de Dados

### 1. `feed_posts` -- Posts do feed

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | Identificador |
| project_id | uuid FK (nullable) | Link opcional com projeto |
| post_type | text | "project_update", "photo", "status_change", "milestone" |
| title | text | Titulo do post |
| description | text | Descricao/corpo do post |
| location | text | Endereco do projeto |
| category | text | "Installation", "Refinishing", "Vinyl", etc. |
| tags | text[] | Array de tags (ex: ["Hardwood", "Residential", "In Progress"]) |
| visibility | text | "internal" (so equipe), "public" (portal do cliente) |
| status | text | "draft", "published" |
| folder_id | uuid FK (nullable) | Pasta organizacional |
| author_name | text | Quem postou |
| author_id | uuid (nullable) | User ID de quem postou |
| likes_count | int | Contador de curtidas |
| comments_count | int | Contador de comentarios |
| created_at / updated_at | timestamptz | Timestamps |

### 2. `feed_post_images` -- Imagens/videos de cada post

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | Identificador |
| feed_post_id | uuid FK | Referencia ao post |
| file_url | text | URL no storage |
| file_type | text | "image", "video" |
| display_order | int | Ordem de exibicao |
| created_at | timestamptz | Timestamp |

### 3. `feed_comments` -- Comentarios nos posts

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | Identificador |
| feed_post_id | uuid FK | Referencia ao post |
| author_name | text | Nome do autor |
| content | text | Texto do comentario |
| created_at | timestamptz | Timestamp |

### 4. `feed_folders` -- Pastas organizacionais

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | Identificador |
| name | text | Nome da pasta (ex: "Installation Projects") |
| description | text | Descricao |
| cover_image_url | text | Capa |
| item_count | int | Contador de itens |
| display_order | int | Ordem |
| created_at / updated_at | timestamptz | Timestamps |

### RLS Policies
- Admins: CRUD completo em todas as tabelas
- Leitura publica nos posts com `visibility = 'public'` e `status = 'published'`

## Novas Telas e Componentes

### Tela 1: Company Feed (`/admin/feed`)
Baseada na referencia image-48:

- **Header**: "Company Feed" com busca e toggle grid/list
- **Tabs**: Feed | Folders
- **Feed Tab**: Timeline de posts com:
  - Titulo + endereco
  - Galeria de imagens (1 ou multiplas)
  - Tags coloridos (badges)
  - Contador de likes e comments
  - Timestamp + autor
  - Link para categoria
  - Menu de acoes (3 dots)
- **Folders Tab** (image-49): Grid 2 colunas com pastas + contagem de itens

### Tela 2: Post Detail (`/admin/feed/:postId`)
Baseada na referencia image-51:

- Carrossel de fotos com contador "1 of 3"
- Thumbnails navegaveis
- Botoes download e share
- Detalhes do projeto (nome, endereco, data)
- Descricao completa
- Tags
- Project Details (Start Date, Status, Area)
- Secao de Comments com avatar, nome, timestamp e texto

### Tela 3: Edit Feed Post (`/admin/feed/:postId/edit`)
Baseada na referencia image-50:

- Post Type (dropdown)
- Project Details (nome, localizacao, categoria)
- Images (galeria com upload + delete)
- Description (textarea)
- Tags (badges removiveis + input para adicionar)
- Organization: Folder (dropdown) + Visibility (dropdown)
- Quality Checklist (checkboxes)

## Componentes React

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/CompanyFeed.tsx` | Pagina principal com tabs Feed/Folders |
| `src/pages/admin/FeedPostDetail.tsx` | Detalhe de um post |
| `src/pages/admin/FeedPostEdit.tsx` | Edicao/criacao de post |
| `src/components/admin/feed/FeedPostCard.tsx` | Card de um post na timeline |
| `src/components/admin/feed/FeedFolderGrid.tsx` | Grid de pastas |
| `src/components/admin/feed/FeedImageCarousel.tsx` | Carrossel de imagens no detalhe |
| `src/components/admin/feed/FeedCommentSection.tsx` | Secao de comentarios |
| `src/components/admin/feed/FeedPostForm.tsx` | Formulario de edicao |
| `src/hooks/admin/useFeedData.ts` | Hook para CRUD do feed |

## Mudancas em Arquivos Existentes

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar rotas `/admin/feed`, `/admin/feed/:postId`, `/admin/feed/:postId/edit` |
| `src/components/admin/AdminSidebar.tsx` | Trocar "Portfolio" por "Feed" apontando para `/admin/feed` |
| `src/components/admin/MobileBottomNav.tsx` | Atualizar link "Feed" para `/admin/feed`; "Nova Foto" no quick actions abre criacao de post |

## Ordem de Implementacao

Dado o tamanho, a implementacao sera dividida em **fases**:

**Fase 1** (esta aprovacao): Banco de dados + Feed page com tabs + FeedPostCard + FeedFolderGrid
**Fase 2**: Post Detail com carrossel e comentarios
**Fase 3**: Edit Feed Post com upload de imagens e quality checklist
**Fase 4**: Integracao com Portal do Cliente (visibilidade publica)

---

Esta fase 1 cria a fundacao: tabelas, a pagina principal do feed com a timeline e a aba de pastas, e atualiza a navegacao para apontar para o novo feed.

