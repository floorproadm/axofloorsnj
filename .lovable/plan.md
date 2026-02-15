

# Pagina de Schedule - Estilo Roofr

## Resumo

Criar uma pagina dedicada de **Schedule** no admin com tres modos de visualizacao inspirados no Roofr: **Day** (calendario diario com blocos de horario), **List** (lista vertical de compromissos) e **Week** (visao semanal). A pagina usara a tabela `appointments` que ja existe no banco de dados.

---

## O que sera construido

### 1. Nova pagina: `/admin/schedule`

Uma pagina completa com:

- **Header com navegacao de semana**: Barra de dias (Dom-Sab) com o dia atual destacado, setas para navegar entre semanas
- **Seletor de mes**: Dropdown no topo para pular para meses especificos
- **3 modos de visualizacao** (tabs):
  - **Day**: Grade de horarios (5AM-9PM) com blocos coloridos representando agendamentos
  - **List**: Cards verticais mostrando endereco, cliente e horario (como na imagem 2)
  - **Week**: Visao semanal com colunas por dia
- **Contador de jobs**: Indicador "X/Y" mostrando quantos jobs estao agendados no dia
- **Botao + (FAB)**: Para criar novo agendamento rapidamente
- **Responsivo**: Funcional em 375px, 768px e desktop

### 2. Modal de criar/editar agendamento

- Campos: Cliente (autocomplete dos projetos existentes), Tipo, Data, Horario, Duracao, Localizacao, Notas
- Possibilidade de vincular a um projeto existente (`project_id`)

### 3. Sidebar e Rotas

- Adicionar "Schedule" ao grupo **Ferramentas** na sidebar com icone de calendario
- Registrar rota `/admin/schedule` no App.tsx com ProtectedRoute

---

## Detalhes Tecnicos

### Banco de dados
- **Nenhuma migracao necessaria** - a tabela `appointments` ja existe com todos os campos: `customer_name`, `customer_phone`, `appointment_type`, `appointment_date`, `appointment_time`, `duration_hours`, `location`, `status`, `notes`, `project_id`
- RLS ja configurada para admins

### Arquivos a criar
- `src/pages/admin/Schedule.tsx` - Pagina principal com os 3 modos de visualizacao e toda a logica de CRUD

### Arquivos a modificar
- `src/components/admin/AdminSidebar.tsx` - Adicionar item "Schedule" com icone `CalendarDays` no grupo Ferramentas
- `src/App.tsx` - Registrar rota `/admin/schedule` com ProtectedRoute e import do componente

### Dependencias
- Nenhuma nova dependencia. Usaremos `date-fns` (ja instalado) para manipulacao de datas e o calendario do shadcn para selecao de data no formulario.

### Cores dos blocos
- Agendamentos usarao cores por tipo (medicao = verde, producao = azul, follow-up = amarelo) com borda lateral colorida no estilo Roofr.

