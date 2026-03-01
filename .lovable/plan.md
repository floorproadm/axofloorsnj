

# Evolucao da Pagina de Perfil do Colaborador

## Visao Geral
A pagina de perfil atual e minimalista -- mostra apenas avatar, nome, email e botao de logout. Vamos transforma-la em um hub completo do colaborador com informacoes uteis e acoes rapidas.

## Secoes Planejadas

### 1. Cabecalho do Perfil (melhorado)
- Avatar com iniciais (mantido)
- Nome completo e email
- Badge mostrando a role do usuario (ex: "Colaborador")
- Data de entrada no sistema ("Membro desde Mar 2026")

### 2. Resumo de Atividade
Card com metricas rapidas do colaborador:
- **Projetos ativos**: quantidade de projetos em que participa (via `project_members`)
- **Tarefas concluidas**: total de tasks com status "done" atribuidas a ele
- **Fotos enviadas**: contagem de uploads feitos (via `audit_log` com `COLLABORATOR_UPLOAD`)

### 3. Projetos Atribuidos
Lista compacta dos projetos em que o colaborador e membro, mostrando:
- Nome do cliente
- Status do projeto
- Botao para navegar ao detalhe do projeto

### 4. Configuracoes Rapidas
- **Alterar senha**: formulario inline para trocar a senha via `supabase.auth.updateUser`
- **Preferencia de notificacoes**: toggle simples para ativar/desativar notificacoes push (salvo em `localStorage` por enquanto)

### 5. Botao de Logout (mantido)
- Permanece no final da pagina com estilo destrutivo

## Detalhes Tecnicos

### Dados buscados
- `project_members` + `projects` para listar projetos atribuidos
- `tasks` filtrado por `assigned_to = user.id` para metricas
- `profiles` para data de criacao
- `user_roles` para exibir role

### Arquivos modificados
- `src/pages/collaborator/CollaboratorProfile.tsx` -- reescrita completa com as novas secoes

### Sem mudancas no banco
- Todos os dados ja existem nas tabelas atuais
- Nenhuma migration necessaria

