import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { LeadsPipeline } from "./components/LeadsPipeline";

export default function LeadsManager() {
  const { leads, isLoading, refreshData } = useAdminData();

  return (
    <AdminLayout 
      title="Pipeline de Leads" 
      breadcrumbs={[{ label: "Leads" }]}
    >
      <div className="animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <LeadsPipeline leads={leads} onRefresh={refreshData} />
        )}
      </div>
    </AdminLayout>
  );
}
