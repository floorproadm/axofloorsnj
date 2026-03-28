import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { LinearPipeline } from "./components/LinearPipeline";
import { normalizeStatus, type PipelineStage } from "@/hooks/useLeadPipeline";

// Must match SALES_STAGES in LinearPipeline
const VALID_SALES_STAGES: PipelineStage[] = [
  'cold_lead', 'warm_lead', 'estimate_requested',
  'estimate_scheduled', 'in_draft', 'proposal_sent', 'proposal_rejected'
];

export default function LeadsManager() {
  const { leads, isLoading, refreshData } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();

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
