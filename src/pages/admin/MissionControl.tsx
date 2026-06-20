import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MissionControl } from "@/components/admin/dashboard/MissionControl";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { useFinancialAlerts } from "@/hooks/admin/useFinancialAlerts";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Target } from "lucide-react";

export default function MissionControlPage() {
  const { isLoading, criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions } =
    useDashboardData();
  const { data: financialAlerts = [], isLoading: isLoadingFinancial } = useFinancialAlerts();
  const { t } = useLanguage();

  // Recent Activity feed (same as Dashboard)
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const [leadsRes, proposalsRes, paymentsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, name, created_at")
          .is('deleted_at', null)
          .gte("created_at", cutoff)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("proposals")
          .select("id, proposal_number, sent_at")
          .not("sent_at", "is", null)
          .gte("sent_at", cutoff)
          .order("sent_at", { ascending: false })
          .limit(5),
        supabase
          .from("payments")
          .select("id, description, amount, created_at")
          .eq("category", "received")
          .eq("status", "confirmed")
          .gte("created_at", cutoff)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: { type: "lead" | "proposal" | "payment" | "job"; label: string; date: string; link: string; amount?: number }[] = [];

      (leadsRes.data || []).forEach((l) =>
        items.push({ type: "lead", label: l.name, date: l.created_at, link: `/admin/leads` })
      );
      (proposalsRes.data || []).forEach((p) =>
        items.push({ type: "proposal", label: `#${p.proposal_number}`, date: p.sent_at!, link: `/admin/proposals` })
      );
      (paymentsRes.data || []).forEach((p) =>
        items.push({
          type: "payment",
          label: p.description || "Pagamento",
          date: p.created_at,
          link: `/admin/payments`,
          amount: Number(p.amount || 0),
        })
      );

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    },
  });

  const priorityTasks = useMemo(() => {
    const tasks: {
      label: string;
      color: "blocked" | "risk" | "success";
      link: string;
      entityId?: string | null;
      type:
        | "follow_up"
        | "new_lead"
        | "stalled"
        | "field_upload"
        | "sla_followup"
        | "sla_estimate"
        | "sla_auto_escalation";
    }[] = [];

    if (recentSystemActions.length > 0) {
      tasks.push({
        label: `${recentSystemActions.length} ${t("mission.alerts.autoEscalations")}`,
        color: "risk",
        link: "/admin/leads",
        type: "sla_auto_escalation",
      });
    }

    if (slaBreaches.followupOverdue.count > 0) {
      tasks.push({
        label: `${slaBreaches.followupOverdue.count} ${t("mission.alerts.followupsOverdue")}`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
        type: "sla_followup",
      });
    }

    if (slaBreaches.estimateStale.count > 0) {
      tasks.push({
        label: `${slaBreaches.estimateStale.count} ${t("mission.alerts.estimatesStale")}`,
        color: "risk",
        link: "/admin/leads?status=estimate_scheduled",
        type: "sla_estimate",
      });
    }

    if (recentFieldUploads.length > 0) {
      tasks.push({
        label: `${recentFieldUploads.length} ${t("mission.alerts.recentFieldUploads")}`,
        color: "success",
        link: "/admin/jobs",
        type: "field_upload",
      });
    }

    criticalAlerts.proposalWithoutFollowUp.forEach((l) => {
      tasks.push({
        label: `${t("mission.alerts.followUp")} – ${l.name}`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
        type: "follow_up",
        entityId: l.id,
      });
    });

    criticalAlerts.newLeadsNoContact24h.forEach((l) => {
      tasks.push({
        label: `${t("dashboard.respostaLead")} – ${l.name}`,
        color: "risk",
        link: "/admin/leads?status=cold_lead",
        type: "new_lead",
        entityId: l.id,
      });
    });

    criticalAlerts.leadsStalled48h.forEach((l) => {
      tasks.push({
        label: `${t("dashboard.leadParado48h")} – ${l.name}`,
        color: "blocked",
        link: "/admin/leads",
        type: "stalled",
        entityId: l.id,
      });
    });

    financialAlerts.forEach((f) => {
      tasks.push({
        label: f.label,
        color: f.type === "invoice_overdue" || f.type === "deposit_missing" ? "blocked" : "risk",
        link: f.link,
        type: f.type,
        entityId: f.entityId,
        group: "financial",
      } as any);
    });

    return tasks;
  }, [criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions, financialAlerts, t]);

  return (
    <AdminLayout
      title="Mission Control"
      breadcrumbs={[{ label: "Mission Control" }]}
    >
      <div className="max-w-3xl mx-auto px-1 sm:px-0 pb-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mission Control
            </h1>
          </div>
        </div>

        <MissionControl systemAlerts={priorityTasks} isLoadingAlerts={isLoading || isLoadingFinancial} recentActivity={recentActivity} />
      </div>
    </AdminLayout>
  );
}
