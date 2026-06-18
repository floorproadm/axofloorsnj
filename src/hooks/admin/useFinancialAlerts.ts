import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialAlertItem {
  id: string;
  type:
    | "invoice_overdue"
    | "deposit_missing"
    | "proposal_viewed_no_reply"
    | "project_stale"
    | "expense_no_receipt";
  label: string;
  link: string;
  entityId: string;
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export function useFinancialAlerts() {
  return useQuery({
    queryKey: ["financial-alerts"],
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<FinancialAlertItem[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const fourteenDaysAgoDate = new Date();
      fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
      const overdueDate = fourteenDaysAgoDate.toISOString().slice(0, 10);

      const alerts: FinancialAlertItem[] = [];

      // 1. Invoices overdue +14d
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, due_date, status, customer_id, project_id")
        .lt("due_date", overdueDate)
        .neq("status", "paid")
        .neq("status", "cancelled")
        .neq("status", "void")
        .limit(50);

      // fetch customer names in batch
      const customerIds = Array.from(
        new Set(
          [
            ...(invoices ?? []).map((i: any) => i.customer_id),
          ].filter(Boolean)
        )
      );
      const customerMap = new Map<string, string>();
      if (customerIds.length > 0) {
        const { data: custs } = await supabase
          .from("customers")
          .select("id, name")
          .in("id", customerIds);
        (custs ?? []).forEach((c: any) => customerMap.set(c.id, c.name));
      }

      (invoices ?? []).forEach((inv: any) => {
        alerts.push({
          id: `invoice-${inv.id}`,
          type: "invoice_overdue",
          label: `Fatura ${inv.invoice_number || "#"} vencida +14d — ${
            customerMap.get(inv.customer_id) || "Cliente"
          }`,
          link: `/admin/payments?invoice=${inv.id}`,
          entityId: inv.id,
        });
      });

      // 2. Proposals accepted +5d without deposit + 3. proposals viewed no reply +5d
      const fiveDaysAgo = daysAgo(5);
      const { data: acceptedProposals } = await supabase
        .from("proposals")
        .select("id, project_id, customer_id, accepted_at, status")
        .eq("status", "accepted")
        .lt("accepted_at", fiveDaysAgo)
        .limit(50);

      const acceptedProjectIds = (acceptedProposals ?? [])
        .map((p: any) => p.project_id)
        .filter(Boolean);

      let depositsByProject = new Set<string>();
      if (acceptedProjectIds.length > 0) {
        const { data: dep } = await supabase
          .from("payments")
          .select("project_id, description, category")
          .in("project_id", acceptedProjectIds)
          .ilike("description", "%DEPOSIT%");
        (dep ?? []).forEach((d: any) => {
          if (d.project_id) depositsByProject.add(d.project_id);
        });
      }

      const propCustIds = Array.from(
        new Set((acceptedProposals ?? []).map((p: any) => p.customer_id).filter(Boolean))
      );
      if (propCustIds.length > 0) {
        const { data: custs } = await supabase
          .from("customers")
          .select("id, name")
          .in("id", propCustIds);
        (custs ?? []).forEach((c: any) => {
          if (!customerMap.has(c.id)) customerMap.set(c.id, c.name);
        });
      }

      (acceptedProposals ?? []).forEach((p: any) => {
        if (p.project_id && !depositsByProject.has(p.project_id)) {
          alerts.push({
            id: `deposit-${p.id}`,
            type: "deposit_missing",
            label: `Depósito não recebido +5d — ${
              customerMap.get(p.customer_id) || "Cliente"
            }`,
            link: p.project_id ? `/admin/jobs/${p.project_id}` : `/admin/payments`,
            entityId: p.project_id || p.id,
          });
        }
      });

      // 3. Proposals viewed no reply +5d
      const { data: viewedProposals } = await supabase
        .from("proposals")
        .select("id, customer_id, viewed_at, status")
        .in("status", ["sent", "viewed"])
        .not("viewed_at", "is", null)
        .lt("viewed_at", fiveDaysAgo)
        .limit(50);

      const vpCustIds = Array.from(
        new Set((viewedProposals ?? []).map((p: any) => p.customer_id).filter(Boolean))
      );
      const missingVp = vpCustIds.filter((id) => !customerMap.has(id));
      if (missingVp.length > 0) {
        const { data: custs } = await supabase
          .from("customers")
          .select("id, name")
          .in("id", missingVp);
        (custs ?? []).forEach((c: any) => customerMap.set(c.id, c.name));
      }

      (viewedProposals ?? []).forEach((p: any) => {
        alerts.push({
          id: `prop-viewed-${p.id}`,
          type: "proposal_viewed_no_reply",
          label: `Proposta visualizada sem resposta +5d — ${
            customerMap.get(p.customer_id) || "Cliente"
          }`,
          link: `/admin/proposals/${p.id}`,
          entityId: p.id,
        });
      });

      // 4. Projects in_progress no activity +14d
      const { data: staleProjects } = await supabase
        .from("projects")
        .select("id, customer_name, project_status, updated_at")
        .eq("project_status", "in_progress")
        .lt("updated_at", daysAgo(14))
        .limit(50);

      (staleProjects ?? []).forEach((p: any) => {
        alerts.push({
          id: `project-stale-${p.id}`,
          type: "project_stale",
          label: `Projeto sem atividade +14d — ${p.customer_name || "Projeto"}`,
          link: `/admin/jobs/${p.id}`,
          entityId: p.id,
        });
      });

      // 5. Reimbursable expenses without receipt
      const { data: noReceiptExpenses } = await supabase
        .from("payments")
        .select("id, description, project_id, amount, receipt_photo_url")
        .ilike("description", "%[REIMBURSABLE]%")
        .is("receipt_photo_url", null)
        .limit(50);

      (noReceiptExpenses ?? []).forEach((e: any) => {
        alerts.push({
          id: `expense-no-receipt-${e.id}`,
          type: "expense_no_receipt",
          label: `Despesa reembolsável sem recibo — $${Number(e.amount || 0).toFixed(2)}`,
          link: `/admin/payments`,
          entityId: e.id,
        });
      });

      return alerts;
    },
  });
}
