import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import LeadsManagement from "../LeadsManagement";

export default function LeadsManager() {
  const { shouldShowLoading, canAccessAdmin } = useAdminAuth();

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null; // useAdminAuth já redirecionou
  }

  return (
    <AdminLayout 
      title="Gestão de Leads" 
      breadcrumbs={[{ label: "Leads" }]}
    >
      <LeadsManagement />
    </AdminLayout>
  );
}