import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { IntakeTabContent } from "@/components/admin/IntakeTabContent";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { LinearPipeline } from "./components/LinearPipeline";
import { normalizeStatus, type PipelineStage } from "@/hooks/useLeadPipeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, BarChart3, ListFilter } from "lucide-react";
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

  const tab = searchParams.get("tab") || "pipeline";

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

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "pipeline") {
      next.delete("tab");
    } else {
      next.set("tab", value);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <AdminLayout
      title="Leads & Vendas"
      breadcrumbs={[{ label: "Leads & Vendas" }]}
    >
      <div className="animate-fade-in space-y-3">
        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full sm:w-auto justify-center sm:justify-start">
              <TabsTrigger
                value="pipeline"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <ListFilter className="w-4 h-4 mr-1.5" /> Pipeline
              </TabsTrigger>
              <TabsTrigger
                value="intake"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" /> Captação
              </TabsTrigger>
            </TabsList>

            {tab === "pipeline" && isAdmin && (
              <div className="flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/leads/trash">
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Lixeira{trashCount > 0 ? ` (${trashCount})` : ""}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="pipeline" className="mt-0 space-y-3">
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
          </TabsContent>

          <TabsContent value="intake" className="mt-0">
            <IntakeTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
