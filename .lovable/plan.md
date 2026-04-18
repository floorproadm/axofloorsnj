

## Problema
1. Click numa invoice no `ProjectDetailPanel` navega para `/admin/payments?invoice=<id>` — **mas a página Payments ignora esse param**. A sheet de detalhes nunca abre.
2. Faltam relações cruzadas:
   - Hub de Payments → não tem botão "Abrir Job" para navegar ao projeto da invoice
   - JobDetail (Invoices section) → também deveria deep-linkar para a invoice no hub

## Mudanças

**1. `src/pages/admin/Payments.tsx`** — consumir query params
- Adicionar `useSearchParams`
- `useEffect`: quando `?invoice=<id>` presente e `invoices` carregado → setar `selectedInvoice` e ativar tab `invoices`
- Idem para `?payment=<id>` (futuro-proof, mesmo padrão)
- Limpar param da URL ao fechar a sheet

**2. `src/components/admin/payments/InvoiceDetailsSheet.tsx`** — adicionar link para o Job
- No header da sheet, ao lado do invoice number, botão ghost "Open Job" (ícone `ExternalLink`) → navega para `/admin/jobs/<project_id>`

**3. `src/components/admin/job-detail/InvoicesPaymentsSection.tsx`** — click na invoice abre sheet
- Hoje o card de invoice provavelmente é estático. Tornar clicável → navega para `/admin/payments?invoice=<id>` (mesma rota; agora vai funcionar com a fix #1)

## Resultado
- Fluxo completo: criar invoice inline no painel → clicar → abre sheet de detalhes em Payments → "Open Job" volta ao projeto
- Invoice é entidade **navegável** entre os 3 contextos (Project Panel, Payments Hub, Job Detail)

## Fora de escopo
- Refatorar `InvoiceDetailsSheet` (já está OK)
- Mudar layout do `NewInvoiceDialog`

