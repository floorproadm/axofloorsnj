

# Redesign Visual do /admin/settings

## Problemas Visuais Atuais

1. **Sidebar de navegacao plana** — botoes sem separacao visual, sem indicador de secao ativa alem de cor
2. **Cards sem hierarquia** — todos os cards tem o mesmo peso visual (mesmo tamanho de titulo, sem borda de acento)
3. **Timestamp de "ultima alteracao" apenas no Geral** — Branding nao mostra, Team nao tem
4. **Header da pagina generico** — titulo + descricao sem destaque visual, sem indicador de status
5. **Sidebar navigation nao tem descricoes** — so icone + label, sem contexto do que cada secao faz
6. **Botoes de salvar soltos** — fora dos cards, sem sticky behavior para forms longos

## Mudancas Propostas

### 1. Settings.tsx — Sidebar com descricoes e separador visual

- Adicionar `description` curta a cada item da sidebar (ex: "Razao social e regras de negocio")
- Adicionar uma borda left de 2px na secao ativa (estilo navigation rail)
- Envolver sidebar em um Card com fundo `bg-muted/30` para separar visualmente do conteudo
- No mobile, manter horizontal scroll mas com pills arredondadas

### 2. Settings.tsx — Header com status badge

- Adicionar um badge "Online" ou timestamp da ultima sincronizacao ao lado do titulo
- Usar icone com acento dourado (`text-[hsl(var(--gold-warm))]`) no titulo para consistencia com o design system premium

### 3. GeneralSettings.tsx — Cards hierarquicos

- Card "Identidade": adicionar `border-l-4 border-primary` para destaque de primeiro nivel
- Card "Regras de Negocio": adicionar `border-l-4 border-[hsl(var(--gold-warm))]` — cor diferente para dominio diferente
- Mover botao "Salvar" para dentro de um `CardFooter` sticky, com divider acima
- Timestamp "Ultima atualizacao" sempre visivel como badge discreto no header do card Identidade

### 4. BrandingSettings.tsx — Timestamp + hierarquia

- Adicionar timestamp de `updated_at` (ja disponivel via hook) abaixo do botao Salvar
- Separar os campos em 2 cards: "Identidade Visual" (nome fantasia + logo) e "Paleta de Cores" (color pickers + preview)
- Card de preview com fundo mais escuro para contraste real das cores

### 5. TeamSettings.tsx — Visual mais institucional

- Adicionar header com contagem total e icone com acento
- Separar membros admin dos demais com um `Separator` e label de grupo
- Adicionar avatar placeholder com iniciais em vez de icone generico
- Mostrar data de criacao no formato relativo ("ha 3 meses") com tooltip do absoluto

### 6. Todos os componentes — Consistencia

- Todos os cards ganham `shadow-sm hover:shadow-md transition-shadow` para feedback de elevacao
- Todos os `CardTitle` com `text-base` (em vez de `text-lg` misturado com `text-2xl`)
- Padding unificado: `CardHeader` com `pb-3`, `CardContent` com `pt-0`

## Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `src/pages/admin/Settings.tsx` | Sidebar com descricoes, borda ativa, card wrapper, header com badge |
| `src/components/admin/settings/GeneralSettings.tsx` | Border-left nos cards, botao no CardFooter, timestamp badge |
| `src/components/admin/settings/BrandingSettings.tsx` | Split em 2 cards, timestamp, fundo escuro no preview |
| `src/components/admin/settings/TeamSettings.tsx` | Avatar com iniciais, separacao admin/outros, data relativa |

## Tecnico

- Nenhuma mudanca de banco de dados
- Nenhuma nova dependencia
- Usa tokens CSS existentes (`--gold-warm`, `--state-success`, `--navy-primary`)
- `formatDistanceToNow` de `date-fns` (ja instalado) para datas relativas
- Zero impacto em logica de negocio — apenas visual

