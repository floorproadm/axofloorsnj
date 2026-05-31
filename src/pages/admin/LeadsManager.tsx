import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { LinearPipeline } from "./components/LinearPipeline";
import { normalizeStatus, type PipelineStage } from "@/hooks/useLeadPipeline";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Must match SALES_STAGES in LinearPipeline
const VALID_SALES_STAGES: PipelineStage[] = [
  'cold_lead', 'warm_lead', 'estimate_requested',
  'estimate_scheduled', 'in_draft', 'proposal_sent', 'proposal_rejected'
];

export default function LeadsManager() {
  const { leads, isLoading, refreshData } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }).then(({ data: ok }) => {
        if (ok) {
          setIsAdmin(true);
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .not("deleted_at", "is", null)
            .then(({ count }) => setTrashCount(count ?? 0));
        }
      });
    });
  }, []);

  const rawStatus = searchParams.get('status');
  const normalized = rawStatus ? normalizeStatus(rawStatus) : undefined;
  const statusFilter = normalized && VALID_SALES_STAGES.includes(normalized)
    ? normalized
    : undefined;

  const handleClearFilter = useCallback(() => {
    searchParams.delete('status');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <AdminLayout
      title="Leads & Vendas"
      breadcrumbs={[{ label: "Leads & Vendas" }]}
      actions={
        isAdmin ? (
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/leads/trash">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Lixeira{trashCount > 0 ? ` (${trashCount})` : ""}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <LinearPipeline
            leads={leads}
            onRefresh={refreshData}
            statusFilter={statusFilter}
            onClearFilter={handleClearFilter}
          />
        )}
      </div>
    </AdminLayout>
  );
}
