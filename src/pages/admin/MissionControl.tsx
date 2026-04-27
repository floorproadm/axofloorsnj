import { useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MissionControl } from "@/components/admin/dashboard/MissionControl";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Target } from "lucide-react";

export default function MissionControlPage() {
  const { isLoading, criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions } =
    useDashboardData();
  const { t } = useLanguage();

  const priorityTasks = useMemo(() => {
    const tasks: {
      label: string;
      color: "blocked" | "risk" | "success";
      link: string;
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
        label: `${recentSystemActions.length} escalações automáticas (24h)`,
        color: "risk",
        link: "/admin/leads",
        type: "sla_auto_escalation",
      });
    }

    if (slaBreaches.followupOverdue.count > 0) {
      tasks.push({
        label: `${slaBreaches.followupOverdue.count} follow-ups atrasados`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
        type: "sla_followup",
      });
    }

    if (slaBreaches.estimateStale.count > 0) {
      tasks.push({
        label: `${slaBreaches.estimateStale.count} estimates parados > 3 dias`,
        color: "risk",
        link: "/admin/leads?status=estimate_scheduled",
        type: "sla_estimate",
      });
    }

    if (recentFieldUploads.length > 0) {
      tasks.push({
        label: `${recentFieldUploads.length} uploads recentes do campo`,
        color: "success",
        link: "/admin/jobs",
        type: "field_upload",
      });
    }

    criticalAlerts.proposalWithoutFollowUp.forEach((l) => {
      tasks.push({
        label: `Follow up – ${l.name}`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
        type: "follow_up",
      });
    });

    criticalAlerts.newLeadsNoContact24h.forEach((l) => {
      tasks.push({
        label: `${t("dashboard.respostaLead")} – ${l.name}`,
        color: "risk",
        link: "/admin/leads?status=cold_lead",
        type: "new_lead",
      });
    });

    criticalAlerts.leadsStalled48h.forEach((l) => {
      tasks.push({
        label: `${t("dashboard.leadParado48h")} – ${l.name}`,
        color: "blocked",
        link: "/admin/leads",
        type: "stalled",
      });
    });

    return tasks;
  }, [criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions, t]);

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
            <p className="text-sm text-muted-foreground mt-0.5">
              Alertas operacionais automáticos e tarefas manuais em um só lugar.
            </p>
          </div>
        </div>

        <MissionControl systemAlerts={priorityTasks} isLoadingAlerts={isLoading} />
      </div>
    </AdminLayout>
  );
}
