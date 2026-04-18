

# Refatoração `/admin/jobs/:id` — densidade + ações destrutivas

## Problemas observados (no screenshot)
1. **Sem Delete** — operador fica preso, precisa voltar ao board
2. Job Details mostra 6 linhas com "—" → desperdício vertical brutal
3. Edit em ghost discreto por seção → descobribilidade ruim
4. Notes + Comments duplicam função
5. Photos & Proof (que **bloqueia conclusão**) está no rodapé
6. Header sem risk/priority indicator
7. Financial cards todos $0 sem call-to-action

## Mudanças propostas

### 1. Header com menu de ações + Delete
Adicionar `DropdownMenu` (kebab) ao lado do status select com:
- **Open in Maps**, **Copy link**, **Duplicate job**, **Archive**, **Delete job** (destrutivo)
- Delete abre `AlertDialog` de confirmação (mesmo padrão do `ProjectDetailPanel`)
- Após delete: toast + `navigate('/admin/projects')` + invalidate `hub-projects`

### 2. Quick Action Bar (sticky abaixo do header)
Linha compacta com 4-5 chips de ação contextuais:
`📅 Schedule` · `💵 Add Cost` · `🧾 New Invoice` · `📷 Upload Proof` · `✅ Mark Complete`

Cada uma scrolla até a seção correspondente OU abre side sheet. Reduz scroll-fadiga.

### 3. Job Details — colapsar campos vazios
Em vez de 6 linhas com "—", mostrar **só campos preenchidos** + footer:

> 4 fields empty · [+ Add Sqft, Start, End, Team Lead]

Click expande inline para edit. Ganha ~120px verticais.

### 4. Unificar Notes + Comments em "Activity"
Tab única com:
- Notes pin no topo (campo livre)
- Timeline cronológica de comments + uploads + status changes
- Mesma UX do Notion/Linear

### 5. Reordenar seções por prioridade operacional
Atual: Job > Client > Notes > Comments > Materials > Labor > Invoices > **Photos**
Nova: Job > **Photos & Proof** > Materials > Labor > Invoices > Activity (Notes+Comments) > Client

Por quê: Photos bloqueia conclusão; Client raramente muda depois de criar.

### 6. Financial Snapshot acionável
Quando $0 ou vazio, cada card vira CTA:
- `Revenue $0` → "Set revenue" (abre inline edit)
- `Cost $0` → "Add first material/labor"
- `No Invoice` → "Create invoice" (abre inline form)

### 7. Risk + Priority no header
Reusar o `useProjectSignals` que já criamos. Mostrar:
- Risk dot ao lado do título (🟢/🟡/🔴)
- Badge "Need photos" se completed sem proof
- Badge "Overdue invoice" se aplicável

### 8. Edit por seção mais visível
Substituir botão ghost por hover-reveal de **ícone Pencil no canto direito do header da Section** (padrão Notion). Sempre visível em mobile.

## Arquivos a editar
- `src/pages/admin/JobDetail.tsx` — header com menu + delete dialog, quick action bar, reordenar seções, colapsar empty fields, financial CTAs
- Reusar `useProjectSignals` existente para risk/NRA badges
- Sem novos arquivos; tudo inline na refatoração de `JobDetail.tsx`

## Fora de escopo
- Activity timeline unificada (#4) — refatoração maior, fica para próxima rodada
- Duplicate / Archive — só Delete agora (Archive precisa de coluna na DB)

## Resultado
- **Delete disponível** com confirmação destrutiva
- ~30% menos scroll vertical (empty fields colapsados, seções reordenadas)
- Ações operacionais a 1 clique (quick bar)
- Header com sinais de risco visuais
- Edit descoberto naturalmente

