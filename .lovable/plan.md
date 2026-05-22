# Admin: Bom → Excelente (revisado) — ✅ Concluído (Ondas 1, 2, 3)

Execução **onda a onda**. Item 12 fora de escopo. Item 3 = remover state morto.

---

## 🔴 Onda 1 — Crítico (entregar primeiro, aguardar revisão)

1. **Dashboard.tsx** — remover `"Eduardo"` hardcoded. Usar `user.user_metadata.full_name ?? user.email` do `useAuth`/sessão Supabase.
2. **LaborPayroll.tsx** — envolver delete em `AlertDialog` ("Remove this entry?"), padrão do `Catalog.tsx`.
3. **LaborPayroll.tsx** — **remover** `filterRole` (state + setter) por ser dead code.
4. **Catalog.tsx `handleDelete()`** — inverter ordem: delete do DB **antes**; só apaga imagem do Storage se DB OK.
5. **LinearPipeline.tsx** (QuickApptModal + QuickRequestModal) — padronizar `lead_source: 'partner_referral'` quando o lead vem de parceiro. Exceção autorizada ao freeze do item 15.

→ **Pausa para revisão do usuário.**

## 🟡 Onda 2 — Importante (após aprovação da Onda 1)

6. **Performance.tsx OverviewTab** — "Completed Jobs" passa a derivar do mesmo `projectAgg` baseado em `paidInvoices` que alimenta os KPIs (fonte única).
7. **Reputation.tsx** — `eligibleProjects`: `enabled: !isLoading && requests !== undefined`; memoizar `sentIds` via `useMemo([requests])` fora do `queryFn`.
8. **ProjectsHub.tsx** — substituir `isThisWeek()` manual por `isThisWeek(parseISO(dateStr), { weekStartsOn: 0 })` do date-fns.
9. **MissionControl.tsx** — mover labels PT hardcoded ("escalações automáticas (24h)", "follow-ups atrasados", "estimates parados > 3 dias", "uploads recentes do campo") para `LanguageContext` em `mission.alerts.*`.
10. **Payments.tsx** — eliminar hack `+ "T12:00:00"`; padronizar parsing com `parseISO` em todo o arquivo.

→ **Pausa para revisão do usuário.**

## 🟢 Onda 3 — Polimento + Freeze (após aprovação da Onda 2)

11. **ProjectsHub.tsx `handleStatusChange()`** — `AlertDialog` de confirmação só para transições destrutivas (`cancelled`, `paid`); demais seguem diretas + `toast`.
13. **Schedule.tsx AppointmentModal** — ao salvar, checar appointments na mesma data com `appointment_time` em janela ±1h; se houver, `toast.warning` ("There's already an appointment at this time: [customer_name]") e seguir salvando (soft warning).
14. **Payments.tsx** — paginação: 50 mais recentes via `.range(0,49)`, botão "Load more" incrementa janela; state local de `page`.
15. **LinearPipeline.tsx** — adicionar comentário-freeze no topo cobrindo:
   - ordem das 7 stages
   - sistema NRA + color coding
   - Quick Quote em `estimate_scheduled` / `in_draft`
   - funnel health bar
   - toggle Board/List
   - filtro de parceiro (`lead_source === 'partner_referral'`)
   - exceção explícita: padronização de `lead_source` (item 5)

**Fora de escopo desta rodada:** item 12 (collaborator_id em labor_entries) — endereçar em sessão dedicada ao modelo de colaboradores.

---

## Notas

- Zero migrations.
- Nada toca `/proposal/:token`, `SignatureDialog`, `Proposals.tsx` (freeze prévio preservado).
- Cada onda termina com pausa explícita para sua revisão antes de prosseguir.
